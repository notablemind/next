// @flow

import FlushingEmitter from './FlushingEmitter'
import Commandeger from './Commandeger'
import commands from './commands'
import Database from './Database'

import baseActions from './actions'
import baseGetters from './getters'
import baseEvents from './events'

import addPluginKeys from './keys/addPluginKeys'
import addViewKeys from './keys/addViewKeys'
import KeyManager from './keys/Manager'
import makeKeyLayer from './keys/makeKeyLayer'

import newNode from './newNode'
import organizePlugins from './organizePlugins'
import bindCommandProxies from './bindCommandProxies'
import handlePaste from './handlePaste'
import * as search from './search'
import * as migrations from './migrations'

import uuid from './uuid'
import type {Plugin, Store, GlobalStore, GlobalState, ViewTypeConfig} from './types'
import type {Db} from './Database'

type ViewId = number

type ViewTypes = {
  [name: string]: ViewTypeConfig,
}

const bindStoreProxies = (store, config, sub) => {
  Object.keys(config.getters[sub]).forEach(name => {
    store.getters[name] = config.getters[sub][name].bind(null, store)
  })

  Object.keys(config.events[sub]).forEach(name => {
    store.events[name] = config.events[sub][name].bind(null, store)
  })

  Object.keys(config.actions[sub]).forEach(name => {
    store.actions[name] = config.actions[sub][name].bind(null, store)
  })
}

const createSettings = (now, plugins, defaultPlugins) => {
  const pluginSettings = (defaultPlugins || Object.keys(plugins)).reduce((settings, pid) => (
    settings[pid] = plugins[pid].defaultGlobalConfig || {}, settings
  ), {})
  console.log('plugin settings', pluginSettings)
  return {
    _id: 'settings',
    created: now,
    modified: now,
    plugins: pluginSettings,
    views: {},
    version: 1,
    defaultViews: {
      root: {
        viewType: 'list',
        settings: {},
      },
    },
  }
}

class Emitter {
  listeners: {[evt: string]: Set<Function>}

  constructor() {
    this.listeners = {}
  }

  on = (evt, fn) => {
    if (!this.listeners[evt]) this.listeners[evt] = new Set()
    this.listeners[evt].add(fn)
  }

  off = (evt, fn) => {
    if (!this.listeners[evt]) return
    this.listeners[evt].delete(fn)
  }

  emit = (evt, ...extra) => {
    if (!evt || !this.listeners[evt]) return console.warn('unhandled intent', evt, extra)
    for (let fn of this.listeners[evt]) {
      fn(...extra)
    }
  }
}

export default class Treed {
  emitter: FlushingEmitter
  intentEmitter: Emitter
  commands: Commandeger<*, *>
  ready: Promise<*>
  db: Database
  config: {
    events: any,
    getters: any,
    actions: any,
    plugins: {[pluginId: string]: Plugin<*,*>},
  }
  enabledPlugins: Array<Plugin<*, *>>
  keys: any
  nextViewId: number
  viewStores: any
  globalState: GlobalState
  keyManager: KeyManager
  globalStore: GlobalStore
  viewTypes: ViewTypes

  constructor(
    db: Db,
    pluginsArray: Array<Plugin<any, any>>,
    viewTypes: ViewTypes,
    documentId: string,
    sharedViewData: any,
    defaultRootContents: string = '',
    defaultPlugins: Array<string> = [],
  ) {
    this.emitter = new FlushingEmitter()
    this.intentEmitter = new Emitter()
    this.viewTypes = viewTypes
    this.commands = new Commandeger(commands, this.setActive)
    this.db = new Database(
      db, id => this.emitter.emit('node:' + id),
      this.settingsChanged
    )

    const plugins = pluginsArray.reduce((obj, p) => (obj[p.id] = p, obj), {})
    this.config = {
      actions: baseActions,
      getters: baseGetters,
      events: baseEvents,
      plugins: plugins,
    }

    this.viewStores = {}
    this.keys = {}
    this.nextViewId = 1
    this.globalState = {
      cut: null,
      activeView: 1,
      plugins: {},
      clipboard: null,
      dropping: null,
      runtimeId: uuid(),
      documentId,
    }
    this.keyManager = new KeyManager([
      () => this.getCurrentKeyLayer(),
      makeKeyLayer({
        normalMode: {
          shortcut: 'escape',
          action: () => this.activeView().actions.normalMode(),
          description: 'go back to normal mode',
        },
      }, 'general.', {}),
    ])
    // this._pluginKeyLayer = this.keyManager.addLayer(pluginKeys(plugins))

    // TODO maybe plugins will want a say in the db stuff?
    this.ready = this.db.ready.then(() => {
      // first run
      const now = Date.now()
      // TODO handle initial sync - if the doc is already on the server, don't
      // open this up until we've had a full sync.
      if (!this.db.data.root) {
        console.log('creating')
        return this.db.saveMany([newNode('root', null, now, defaultRootContents), createSettings(now, plugins, defaultPlugins)])
      } else if (!this.db.data.settings.version ||
                 this.db.data.settings.version < migrations.version) {
        return migrations.migrate(this.db)
      }
      const newPluginSettings = {}
      let addedPlugins = false
      defaultPlugins.forEach(id => {
        if (!this.db.data.settings.plugins[id]) {
          addedPlugins = true
          newPluginSettings[id] = plugins[id].defaultGlobalConfig || {}
        }
      })
      if (addedPlugins) {
        return this.db.save({
          ...this.db.data.settings,
          plugins: {
            ...this.db.data.settings.plugins,
            ...newPluginSettings,
          }
        })
      }
    }).then(() => {
      const settings = this.db.data.settings
      sharedViewData = {...sharedViewData}
      Object.keys(viewTypes).forEach(key => {
        if (!sharedViewData[key]) {
          sharedViewData[key] = viewTypes[key].initialSharedViewData ? viewTypes[key].initialSharedViewData() : {}
        }
      })
      this.enabledPlugins = Object.keys(settings.plugins).map(id => this.config.plugins[id]).filter(plugin => !!plugin)
      this.setupGlobalStore(settings.plugins, sharedViewData)
      return Promise.all(this.enabledPlugins.map(plugin => {
        if (plugin.init) {
          return Promise.resolve(plugin.init(
            settings.plugins[plugin.id] || plugin.defaultGlobalConfig,
            this.globalStore
          )).then(state => {
            this.globalState.plugins[plugin.id] = state
          })
        }
      }))
    })
  }

  setupGlobalStore(pluginSettings: {[pluginId: string]: any}, sharedViewData: *) {
    const events = {}
    const args: any = [this.db, events]
    const globalStore: any = {
      db: this.db,
      emit: this.emitter.emit,
      emitMany: this.emitter.emitMany,
      emitIntent: this.intentEmitter.emit,
      plugins: organizePlugins(pluginSettings, this.config.plugins),
      enabledPlugins: this.enabledPlugins,
      addKeyLayer: this.keyManager.addLayer,
      addNormalKeyLayer: this.addNormalKeyLayer,
      globalState: this.globalState,
      activeView: () => this.activeView(),
      handleKey: this.handleKey,
      on: this.on,
      onIntent: this.onIntent,
      addListener: (evt, fn) => this.emitter.on(evt, fn),
      removeListener: (evt, fn) => this.emitter.off(evt, fn),
      viewTypes: this.viewTypes,
      sharedViewData,

      undo: () => this.emitter.emitMany(this.commands.undo(args)),
      redo: () => this.emitter.emitMany(this.commands.redo(args)),

      events,
      getters: {},
      actions: {},

      setupStateListener: (...args) => this.setupStateListener(this.globalStore, ...args),
    }
    bindCommandProxies(globalStore, this.commands, this.emitter, args, null)
    bindStoreProxies(globalStore, this.config, 'global')
    this.globalStore = globalStore
  }

  changeViewType(id: number, type: string, initialState: ?Object=null): any {
    if (!this.viewTypes[type]) {
      throw new Error(`Unknown view type ${type}`)
    }
    const viewTypeConfig: ViewTypeConfig = this.viewTypes[type]
    const store = this.viewStores[id]
    store.state.viewType = type
    store.state.viewTypeConfig = viewTypeConfig
    store.state.view = viewTypeConfig.getInitialState ? viewTypeConfig.getInitialState() : {}
    if (initialState) {
      store.state = {
        ...store.state,
        ...initialState,
      }
    }
    this.setupActionsAndGetters(store, viewTypeConfig)
    this.keys[store.id] = {}
    addViewKeys(this.keys[store.id], this.viewTypes[type].keys, `views.${type}.`, {}, store)
    addPluginKeys(store, this.keys[store.id], this.enabledPlugins)
    store.emit(store.events.viewType())
    store.emit(store.events.serializableState())
  }

  serializeViewState(id: number): any {
    const {state} = this.viewStores[id]
    const viewTypeConfig: ViewTypeConfig = this.viewTypes[state.viewType]
    const plugins = {}
    this.enabledPlugins.forEach(plugin => (
      plugin.serializeState ?
        plugins[plugin.id] = plugin.serializeState(state.plugins[plugin.id])
          : null))
    return {
      root: state.root,
      viewType: state.viewType,
      view: viewTypeConfig.serializeState ? viewTypeConfig.serializeState(state.view) : null,
      plugins,
    }
  }

  exportMarkdown() {
    const root = this.activeView().state.root
    const nodes = this.db.data
    const white = num => {
      let res = ''
      for (let i=0; i<num; i++) res += ' '
      return res
    }
    const walk = (id, level) => {
      return white(level * 2) + '- ' + nodes[id].content + '\n' + nodes[id].children.map(child => walk(child, level + 1)).join('\n')
    }
    return walk(root, 0)
  }

  registerView(initialState: Object): Store {
    const type = initialState.viewType
    if (!this.viewTypes[type]) {
      throw new Error(`Unknown view type ${type}`)
    }
    const id = this.nextViewId++
    const viewTypeConfig: ViewTypeConfig = this.viewTypes[type]

    const state = {
      id,
      root: 'root',
      active: 'root',
      activeIsJump: false,
      selected: null,
      editPos: null,
      mode: 'normal',
      minorMode: null,
      viewType: type,
      contextMenu: null,
      lastEdited: null,
      lastJumpOrigin: null,
      viewTypeConfig,
      plugins: {},
      view: null,
      ...initialState,
    }
    if (!state.view) {
      state.view = viewTypeConfig.getInitialState ?
        viewTypeConfig.getInitialState() : {}
    }

    this.enabledPlugins.forEach(
      plugin => !state.plugins[plugin.id] &&
        (state.plugins[plugin.id] = plugin.getInitialState ?
          plugin.getInitialState() : null))

    if (!state.root || !this.db.data[state.root]) state.root = 'root'
    state.active = viewTypeConfig.defaultActive === 'firstChild' && this.db.data[state.root].children[0] || state.root

    const events = {
      ...this.globalStore.events,
    }
    const args: any = [this.db, events]
    const store: Store = this.viewStores[id] = {
      id,
      state,
      ...this.globalStore,
      getters: {
        ...this.globalStore.getters,
      },
      actions: {
        ...this.globalStore.actions,
        changeViewType: this.changeViewType.bind(this, id),
      },

      setupStateListener: (...args) => this.setupStateListener(store, ...args),
      emitIntent: (intent, extra) => this.intentEmitter.emit(intent, store.id, extra),
    }

    this.setupActionsAndGetters(store, viewTypeConfig)
    bindCommandProxies(store, this.commands, this.emitter, args, id)

    this.keys[store.id] = {}
    addViewKeys(this.keys[store.id], this.viewTypes[type].keys, `views.${type}.`, {}, store)
    addPluginKeys(store, this.keys[store.id], this.enabledPlugins)

    this.globalState.activeView = store.id
    this.emitter.emit(this.globalStore.events.activeView())

    return store
  }

  setupActionsAndGetters(store: Store, viewTypeConfig: ViewTypeConfig) {
    Object.keys(viewTypeConfig.getters).forEach(key => {
      store.getters[key] = viewTypeConfig.getters[key].bind(null, store)
    })
    Object.keys(viewTypeConfig.actions).forEach(key => {
      store.actions[key] = viewTypeConfig.actions[key].bind(null, store)
    })
    this.enabledPlugins.forEach(plugin => {
      const {actions, getters, events} = plugin
      if (actions) {
        Object.keys(actions).forEach(key => {
          store.actions[key] = actions[key].bind(null, store)
        })
      }
      if (getters) {
        Object.keys(getters).forEach(key => {
          store.getters[key] = getters[key].bind(null, store)
        })
      }
      if (events) {
        Object.keys(events).forEach(key => {
          store.events[key] = events[key].bind(null, store)
        })
      }
    })
    bindStoreProxies(store, this.config, 'view')
  }

  setActive = (view: ViewId, id: string) => {
    this.viewStores[view].actions.setActive(id)
  }

  getCurrentKeyLayer(): any {
    const mode = this.viewStores[this.globalState.activeView].state.mode
    return this.keys[this.globalState.activeView][mode]
  }

  handleKey = (e: any) => {
    this.keyManager.handle(e)
    // throw new Error('not impl')
  }

  searchFromCurrentView(text: string) {
    return search.shallowFromRoot(this.activeView(), text)
  }

  handlePaste = (e: any) => {
    handlePaste(e, (type, data) => {
      if (type === 'notablemind') {
        if (data.runtime === this.globalState.runtimeId) {
          if (data.source === 'clipboard') {
            this.activeView().actions.pasteAfter()
            return
          } else if (data.source === 'cut') {
            // umm yeah this is the same I think
            this.activeView().actions.pasteAfter()
            return
          }
        } else {
          const store = this.activeView()
          store.actions.insertTreeAfter(store.state.active, data.tree)
          return
        }
      } else if (type === 'file') {
        this.activeView().actions.pasteFile(data.file, data.type, data.filename)
      }
    })
  }

  addKeyLayer(layer: Function | any): () => void {
    return this.keyManager.addLayer(layer)
  }

  addNormalKeyLayer = (layer: Object) => {
    return this.keyManager.addLayer(() => this.isCurrentViewInInsertMode() ? null : layer)
  }

  settingsChanged = () => {
    if (!this.globalStore) return // hasn't been setup yet
    this.emitter.emit(this.globalStore.events.settingsChanged())
    console.log('TODO proces settings change')
  }

  setupStateListener = (
    store: GlobalStore,
    reactElement: any,
    eventsFromStore: (store: GlobalStore) => Array<string>,
    stateFromStore: (store: GlobalStore) => {[key: string]: any},
    shouldResub?: ?(store: GlobalStore)=>bool =null
  ) => {
    reactElement.state = stateFromStore(store)
    let evts = eventsFromStore(store)
    const fn = () => {
      if (shouldResub && shouldResub(store)) {
        let nevts = eventsFromStore(store)
        evts.forEach(ev => nevts.indexOf(ev) === -1 ? this.emitter.off(ev, fn) : null)
        nevts.forEach(ev => evts.indexOf(ev) === -1 ? this.emitter.on(ev, fn) : null)
        evts = nevts
      }
      reactElement.setState(stateFromStore(store))
    }
    if (process.env.NODE_ENV !== 'production') {
      const err = new Error("`setupStateListener` called, but `start` was never called")
      const startTimer = setTimeout(() => {
        console.error(err)
      }, 1000)
      return {
        start: () => {
          clearTimeout(startTimer)
          evts.forEach(ev => this.emitter.on(ev, fn))
        },
        stop: () => evts.forEach(ev => this.emitter.off(ev, fn)),
      }
    }
    return {
      start: () => evts.forEach(ev => this.emitter.on(ev, fn)),
      stop: () => evts.forEach(ev => this.emitter.off(ev, fn)),
    }
  }

  unregisterView(id: string) {
    delete this.viewStores[id]
    if (id === this.globalState.activeView) {
      const keys = Object.keys(this.viewStores)
      if (keys.length) {
        this.globalState.activeView = +keys[0]
        this.emitter.emit(this.config.events.activeView())
      }
    }
  }

  activeView(): any {
    return this.viewStores[this.globalState.activeView]
  }

  isCurrentViewInInsertMode() {
    const current = this.activeView()
    return current && current.state.mode === 'insert'
  }

  on = (evts: Array<string>, fn: Function) => {
    if (!Array.isArray(evts)) {
      evts = [evts]
    }
    evts.forEach(evt => this.emitter.on(evt, fn))
    return () => {
      evts.forEach(evt => this.emitter.off(evt, fn))
    }
  }

  onIntent = (evt: string, fn: Function) => {
    this.intentEmitter.on(evt, fn)
    return () => this.intentEmitter.off(evt, fn)
  }

  destroy() {
    Object.keys(this.globalState.plugins).forEach(pid => {
      const plugin = this.config.plugins[pid]
      if (plugin.destroy) {
        plugin.destroy(this.globalState.plugins[plugin.id])
      }
    })
    // TODO
  }
}
