// @flow

import FlushingEmitter from './FlushingEmitter'
import Commandeger from './Commandeger'
import commands from './commands'
import Database from './Database'
import ViewManager from './ViewManager'

import baseActions from './actions'
import baseGetters from './getters'
import baseEvents from './events'

const defaultSettings = {
  _id: 'settings',
  viewConfig: {
    leaf: true,
    type: 'list',
    root: 'root',
  },
}

export default class Treed {
  emitter: FlushingEmitter
  commands: Commandeger<*, *>
  viewManager: ViewManager
  ready: Promise<void>
  db: Database<*>

  constructor(db: any, plugins: any) {
    this.emitter = new FlushingEmitter()
    this.commands = new Commandeger(commands, this.setActive)
    this.db = new Database(db, plugins, id => this.emitter.emit('node:' + id), this.settingsChanged)
    this.events = baseEvents
    this.getters = baseGetters
    this.viewManager = new ViewManager(
      this.db,
      this.commands,
      this.emitter,
      {
        actions: baseActions,
        getters: baseGetters,
        events: baseEvents,
        plugins: [],
      },
    )

    this.ready = this.db.ready.then(() => {
      if (!this.db.data.root) {
        const now = Date.now()
        return this.db.db.save({
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
        })
      }
    })
  }

  setActive = (view: string, id: string) => {
    this.viewManager.viewStores[view].actions.setActive(id)
  }

  getCurrentKeyLayer(): any {
    return this.viewManager.getCurrentKeyLayer()
  }

  handleKey(e: any) {
    return this.viewManager.handleKey(e)
  }

  settingsChanged = () => {
    console.log('TODO proces settings change')
  }

  registerView(root: string, type: string, viewActions: any) {
    return this.viewManager.registerView(root, type, viewActions)
  }

  unregisterView(id: string) {
    return this.viewManager.unregisterView(id)
  }

  activeView(): any {
    return this.viewManager.activeView
  }

  isCurrentViewInInsertMode() {
    const current = this.viewManager.activeView
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
    // TODO
  }
}
