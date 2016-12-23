// @flow

import FlushingEmitter from './FlushingEmitter'
import Commandeger from './Commandeger'
import commands from './commands'
import Database from './Database'

import baseActions from './actions'
import baseGetters from './getters'
import baseEvents from './events'

import makeViewKeyLayers from './keys/makeViewKeyLayers'

type ViewId = number

const defaultSettings = {
  _id: 'settings',
  viewConfig: {
    leaf: true,
    type: 'list',
    root: 'root',
  },
}

const bindStoreProxies = (store, config) => {
  Object.keys(config.getters).forEach(name => {
    store.getters[name] = config.getters[name].bind(null, store)
  })

  Object.keys(config.events).forEach(name => {
    store.events[name] = config.events[name].bind(null, store)
  })

  Object.keys(config.actions).forEach(name => {
    store.actions[name] = config.actions[name].bind(null, store)
  })
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
            settings.plugins[plugin.id] || plugin.defaultGlobalConfig
          )).then(state => {
            this.globalState.plugins[plugin.id] = state
          })
        }
      }))
    })
  }

  setActive = (view: ViewId, id: string) => {
    this.viewStores[view].actions.setActive(id)
  }

  getCurrentKeyLayer(): any {
    const mode = this.viewStores[this.globalState.activeView].state.mode
    return this.keys[this.globalState.activeView][mode]
  }

  handleKey(e: any) {
    throw new Error('not impl')
  }

  settingsChanged = () => {
    this.emitter.emit(this.config.events.settingsChanged())
    console.log('TODO proces settings change')
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

    const events = {}
    const args: any = [this.db, events]
    const store = this.viewStores[id] = {
      id,
      events,
      getters: {},
      actions: {},
      emit: this.emitter.emit,
      emitMany: this.emitter.emitMany,
      plugins: organizePlugins(this.config.plugins),
      state,
      globalState: this.globalState,
      db: this.db,

      on: (evts, fn) => {
        if (!Array.isArray(evts)) {
          evts = [evts]
        }
        evts.forEach(evt => this.emitter.on(evt, fn))
        return () => {
          evts.forEach(evt => this.emitter.off(evt, fn))
        }
      },

      // TODO maybe handle "changing active view" here too?
      // TODO test this stuff
      // call with (this, store => [], store => {})
      // and it will automatically manage unsub / resub for you
      setupStateListener: (reactElement, eventsFromStore, stateFromStore, shouldResub=null) => {
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
      },

      undo: () => this.emitter.emitMany(this.commands.undo(args)),
      redo: () => this.emitter.emitMany(this.commands.redo(args)),

      execute: (cmd, preActive?: string=store.state.active, postActive?: string=store.state.active) => {
        const res = this.commands.execute(cmd, args, store.id, preActive, postActive)
        this.emitter.emitMany(res.events)
        return res.idx
      },

      executeMany: (cmds, preActive?: string=store.state.active, postActive?: string=store.state.active) => {
        const res = this.commands.executeMany(cmds, args, store.id, preActive, postActive)
        this.emitter.emitMany(res.events)
        return res.idx
      },

      append: (idx, cmd) => this.emitter.emitMany(this.commands.append(idx, cmd, args)),
      appendMany: (idx, cmds) => this.emitter.emitMany(this.commands.appendMany(idx, cmds, args)),
    }

    bindStoreProxies(store, this.config)

    this.keys[store.id] = makeViewKeyLayers(viewActions, `views.${type}.`, {}, store)

    this.globalState.activeView = store.id
    this.emitter.emit(this.config.events.activeView())

    return store
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

  on(evts: Array<string>, fn: Function) {
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
