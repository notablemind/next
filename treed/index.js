// @flow

import FlushingEmitter from './FlushingEmitter'
import Commandeger from './Commandeger'
import commands from './commands'
import Database from './Database'

import baseActions from './actions'
import baseGetters from './getters'
import baseEvents from './events'

import addPluginKeys from './keys/addPluginKeys'
import makeViewKeyLayers from './keys/makeViewKeyLayers'
import KeyManager from './keys/Manager'

import organizePlugins from './organizePlugins'
import bindCommandProxies from './bindCommandProxies'
import * as search from './search'

type ViewId = number

const defaultSettings = {
  _id: 'settings',
  viewConfig: {
    leaf: true,
    type: 'list',
    root: 'root',
  },
}

type GlobalStore = any

type Store = {
  [key: string]: any
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

export default class Treed {
  emitter: FlushingEmitter
  commands: Commandeger<*, *>
  ready: Promise<void>
  db: Database<*>
  config: {
    events: any,
    getters: any,
    actions: any,
    plugins: Array<any>
  }
  keys: any
  nextViewId: number
  viewStores: any
  globalState: {
    activeView: number,
    plugins: any,
    clipboard: ?any,
  }
  keyManager: KeyManager
  globalStore: GlobalStore

  constructor(db: any, plugins: any) {
    this.emitter = new FlushingEmitter()
    this.commands = new Commandeger(commands, this.setActive)
    this.db = new Database(
      db, plugins, id => this.emitter.emit('node:' + id),
      this.settingsChanged
    )

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
      activeView: 1,
      plugins: {},
      clipboard: null,
    }
    this.keyManager = new KeyManager([
      () => this.getCurrentKeyLayer(),
    ])
    // this._pluginKeyLayer = this.keyManager.addLayer(pluginKeys(plugins))

    // TODO maybe plugins will want a say in the db stuff?
    this.ready = this.db.ready.then(() => {
      // first run
      const now = Date.now()
      if (!this.db.data.root) {
        const pluginSettings = plugins.reduce((settings, plugin) => (
          settings[plugin.id] = plugin.defaultGlobalConfig, settings
        ), {})
        return this.db.saveMany([{
          _id: 'root',
          created: now,
          modified: now,
          parent: null,
          children: [],
          type: 'normal',
          content: '',
          plugins: {},
          types: {},
          views: {},
        }, {
          _id: 'settings',
          created: now,
          modified: now,
          plugins: pluginSettings,
          views: {},
          // TODO what other things go in settings?
        }])
      }

      /*
      // TODO remove
      if (!this.db.data.settings) {
        const pluginSettings = plugins.reduce((settings, plugin) => (
          settings[plugin.id] = plugin.defaultGlobalConfig, settings
        ), {})
        return this.db.save({
          _id: 'settings',
          created: now,
          modified: now,
          plugins: pluginSettings,
          views: {},
          // TODO what other things go in settings?
        })
      }
      */
    }).then(() => {
      const settings = this.db.data.settings
      return Promise.all(plugins.map(plugin => {
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

    const events = {}
    const args: any = [this.db, events]
    this.globalStore = {
      db: this.db,
      emit: this.emitter.emit,
      emitMany: this.emitter.emitMany,
      plugins: organizePlugins(this.config.plugins),
      addKeyLayer: this.keyManager.addLayer,
      addNormalKeyLayer: this.addNormalKeyLayer,
      globalState: this.globalState,
      activeView: () => this.activeView(),
      handleKey: this.handleKey,
      on: this.on,
      addListener: (evt, fn) => this.emitter.on(evt, fn),
      removeListener: (evt, fn) => this.emitter.off(evt, fn),

      undo: () => this.emitter.emitMany(this.commands.undo(args)),
      redo: () => this.emitter.emitMany(this.commands.redo(args)),

      events,
      getters: {},
      actions: {},

      setupStateListener: (...args) => this.setupStateListener(this.globalStore, ...args),
    }

    bindCommandProxies(this.globalStore, this.commands, this.emitter, args, null)
    bindStoreProxies(this.globalStore, this.config, 'global')
  }

  registerView(root: string, type: string, viewActions: any): any {
    const id = this.nextViewId++
    if (!root || !this.db.data[root]) root = 'root'

    const state = {
      id,
      root,
      active: root,
      selected: null,
      editPos: null,
      mode: 'normal',
      minorMode: null,
      viewType: type,
    }

    const events = {
      ...this.globalStore.events,
    }
    const args: any = [this.db, events]
    const store: Store = this.viewStores[id] = {
      id,
      state,
      ...this.globalStore,
      getters: {...this.globalStore.getters},
      actions: {...this.globalStore.actions},

      // TODO maybe handle "changing active view" here too?
      // TODO test this stuff
      // call with (this, store => [], store => {})
      // and it will automatically manage unsub / resub for you
      setupStateListener: (...args) => this.setupStateListener(store, ...args),
    }

    bindCommandProxies(store, this.commands, this.emitter, args, id)
    bindStoreProxies(store, this.config, 'view')

    this.keys[store.id] = makeViewKeyLayers(viewActions, `views.${type}.`, {}, store)
    addPluginKeys(store, this.keys[store.id], this.config.plugins)

    this.globalState.activeView = store.id
    this.emitter.emit(this.globalStore.events.activeView())

    return store
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

  searchFromCurrentView(text) {
    return search.shallowFromRoot(this.activeView(), text)
  }

  handlePaste = (e: any) => {
    const data = e.clipboardData
    if (data.items.length === 1) {
      if (data.items[0].kind === 'string') {
        if (e.target.nodeName === 'INPUT') {
          return // allow normal pasting into text input
        }
      }
      if (data.items[0].kind === 'file') {
        const file = data.items[0].getAsFile()
        this.activeView().actions.pasteFile(file, data.items[0].type, '<pasted file>')
        return
      }
    }

    e.preventDefault()
    if (
      data.items.length === 2 &&
      data.items[0].kind === 'string' &&
        data.items[1].kind === 'file'
    ) {
      // looks like a "copy/pasted a file"
      // note this will only work if they pasted an image. (at least in chrome)
      const file = data.items[1].getAsFile()
      console.log(data.items[1], file)
      if (!file) { // wasn't an image I guess
        // TODO toast
        console.warn("Bad file - not an image?")
        return
      }
      const type = data.items[1].type
      data.items[0].getAsString(filename => {
        this.activeView().actions.pasteFile(file, type, filename)
      })
    } else {
      // TODO other pastes
      debugger
    }
  }

  addKeyLayer(layer: Function | any): () => void {
    return this.keyManager.addLayer(layer)
  }

  addNormalKeyLayer = (layer: Object) => {
    return this.keyManager.addLayer(() => this.isCurrentViewInInsertMode() ? null : layer)
  }

  settingsChanged = () => {
    this.emitter.emit(this.globalStore.events.settingsChanged())
    console.log('TODO proces settings change')
  }

  pluginStore(pluginId: string): any {
    const store = {
      events: {},
    }
  }

  setupStateListener = (
    store: Store,
    reactElement: any,
    eventsFromStore: (store: Store) => Array<string>,
    stateFromStore: (store: Store) => {[key: string]: any},
    shouldResub?: ?()=>bool =null
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

  destroy() {
    this.config.plugins.map(plugin => {
      if (plugin.destroy) {
        plugin.destroy(this.globalState.plugins[plugin.id])
      }
    })
    // TODO
  }
}
