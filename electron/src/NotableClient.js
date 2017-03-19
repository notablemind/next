
import PouchDB from 'pouchdb'
PouchDB.plugin(require('pouchdb-authentication'))
PouchDB.plugin(require('pouchdb-adapter-memory'))
PouchDB.plugin(require('pouchdb-upsert'))

import setupDbConnection from './setupDbConnection'

export default class NotableClient {
  constructor(remote, showToast) {
    this.remote = remote
    this.metaListeners = []
    this.userListeners = []
    this.meta = null
    this.user = null
    this.ready = new Promise((res, rej) => {
      this._onReady = res
      this._onFail = rej
    })

    remote.on('toast', (evt, data) => showToast(data))

    remote.once('hello', (evt, {user, meta}) => {
      this.meta = meta
      this.user = user
      this.notifyMeta()
      this.notifyUser()
      this._onReady()
    })

    remote.on('user:status', (evt, user) => {
      this.user = user
      this.notifyUser()
    })
    remote.on('meta:update', (evt, id, update) => {
      this.meta[id] = {
        ...this.meta[id],
        ...update
      }
      this.notifyMeta()
    })
  }

  notifyMeta() {
    this.metaListeners.forEach(fn => fn(this.meta))
  }

  notifyUser() {
    this.userListeners.forEach(fn => fn(this.user))
  }

  onMeta(fn) {
    this.metaListeners.push(fn)
    return () => this.metaListeners.splice(this.metaListeners.indexOf(fn), 1)
  }

  onUser(fn) {
    this.userListeners.push(fn)
    return () => this.userListeners.splice(this.userListeners.indexOf(fn), 1)
  }

  // TODO I should probably make sure only one thing's connected at a time?
  getFileDb(docid) {
    const db = new PouchDB(id || 'home', {adapter: 'memory'})
    return setupDbConnection(docid, ipcRemote, db)
  }
}

