// @flow

import FlushingEmitter from './FlushingEmitter'
import Commandeger from './Commandeger'
import commands from './commands'
import Database from './Database'

import baseActions from './actions'
import baseGetters from './getters'
import baseEvents from './events'

import makeViewKeyLayers from './keys/makeViewKeyLayers'
import KeyManager from './keys/Manager'

type ViewId = number

const defaultSettings = {
  _id: 'settings',
  viewConfig: {
    leaf: true,
    type: 'list',
    root: 'root',
  },
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

const bindCommandProxies = (store, commands, emitter, args, viewId: ?string) => {
  if (viewId) {
    store.execute = (cmd, preActive?: string=store.state.active,
                     postActive?: string=store.state.active) => {
      const res = commands.execute(cmd, args, store.id, preActive, postActive)
      emitter.emitMany(res.events)
      return res.idx
    }
    store.executeMany = (cmds, preActive?: string=store.state.active,
                         postActive?: string=store.state.active) => {
      const res = commands.executeMany(cmds, args, store.id, preActive, postActive)
      emitter.emitMany(res.events)
      return res.idx
    }
  } else {
    store.execute = cmd => {
      const res = commands.execute(cmd, args, null, null, null)
      emitter.emitMany(res.events)
      return res.idx
    }
    store.executeMany = cmds => {
      const res = commands.executeMany(cmds, args, null, null, null)
      emitter.emitMany(res.events)
      return res.idx
    }
  }

  store.append = (idx, cmd) =>
    emitter.emitMany(commands.append(idx, cmd, args))
  store.appendMany = (idx, cmds) =>
    emitter.emitMany(commands.appendMany(idx, cmds, args))
}

const organizePlugins = plugins => {
  const classNameGetters = plugins.filter(p => p.node && p.node.className)
  .map(p => (node, store) => p.node.className(
    node.plugins[p.id],
    node,
    store
  ))
  return {
    node: {
      className: classNameGetters.length === 1 ? classNameGetters[0] :
        (classNameGetters.length === 0 ? null :
         (node, store) => classNameGetters.map(f => f(node, store)).join(' '))
    },
  }
}

const makeGlobalStore = (db, emitter, commands, globalState, config) => {
  const globalStore = {
    db,
    globalStore,
    actions: {},
    getters: {},
    events: {},

  }
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
  globalState: any
  keyManager: KeyManager

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
    }
    this.keyManager = new KeyManager([
      () => this.getCurrentKeyLayer(),
    ])

    // TODO maybe plugins will want a say in the db stuff?
    this.ready = this.db.ready.then(() => {
      // first run
      const now = Date.now()
      if (!this.db.data.root) {
        const pluginSettings = plugins.reduce((settings, plugin) => (
          settings[plugin.id] = plugin.defaultGlobalConfig, settings
        ), {})
        return this.db.db.saveMany([{
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
        }], [{
          _id: 'settings',
          created: now,
          modified: now,
          plugins: pluginSettings,
          views: {},
          // TODO what other things go in settings?
        }])
      }
      // backfill: TODO remove
      if (!this.db.data.settings) {
        const pluginSettings = plugins.reduce((settings, plugin) => (
          settings[plugin.id] = plugin.defaultGlobalConfig, settings
        ), {})
        return this.db.db.save({
          _id: 'settings',
          created: now,
          modified: now,
          plugins: pluginSettings,
          views: {},
          // TODO what other things go in settings?
        })
      }
    }).then(() => {
      const settings = this.db.data.settings || {plugins: {}}
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

    /*
    this.globalStore = makeGlobalStore(
      this.db, this.emitter, this.commands, this.config)
      */

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
    const store = this.viewStores[id] = {
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

  addKeyLayer(layer: Function | any): () => void {
    return this.keyManager.addLayer(layer)
  }

  addNormalKeyLayer = (layer: Object) => {
    return this.keyManager.addLayer(() => this.isCurrentViewInInsertMode() ? null : layer)
  }

  settingsChanged = () => {
    this.emitter.emit(this.config.events.settingsChanged())
    console.log('TODO proces settings change')
  }

  pluginStore(pluginId: string): any {
    const store = {
      events: {},
    }
  }

  setupStateListener = (store, reactElement, eventsFromStore, stateFromStore, shouldResub=null) => {
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
