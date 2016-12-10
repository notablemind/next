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
  db: Database

  constructor(settings: any, db: any) {
    this.emitter = new FlushingEmitter()
    this.commands = new Commandeger(commands)
    this.db = new Database(db, settings, this.emitter)
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
          parent: null,
          content: '',
          children: [],
          created: now,
          modified: now,
          collapsed: true,
          type: 'normal',
          plugins: {},
          views: {},
        })
      }
    })
  }

  registerView(root: string, type: string) {
    return this.viewManager.registerView(root, type)
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
}
