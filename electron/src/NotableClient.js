
import PouchDB from '../../node_modules/pouchdb'
PouchDB.plugin(require('pouchdb-authentication'))
PouchDB.plugin(require('pouchdb-adapter-memory'))
PouchDB.plugin(require('pouchdb-upsert'))

import setupDbConnection from './setupDbConnection'
import NotableBase from './NotableBase'

import ipcPromise from './ipcPromise'

export default class NotableClient extends NotableBase {
  constructor(showToast) {
    super()
    this.remote = require('electron').ipcRenderer
    this.prom = ipcPromise(this.remote)
    this.showToast = showToast
  }

  init() {
    this.ready = new Promise((res, rej) => {
      this._onReady = res
      this._onFail = rej
    })

    setTimeout(() => this._onFail(new Error('Timeout waiting for electron')), 5 * 1000)

    this.remote.on('toast', (evt, data) => this.showToast(data))

    this.remote.once('hello', (evt, {user, meta}) => {
      this.meta = meta
      this.user = user
      this.notifyMeta()
      this.notifyUser()
      this._onReady()
    })

    this.remote.on('user:status', (evt, user) => {
      this.user = user
      this.notifyUser()
    })
    this.remote.on('meta:update', (evt, id, update) => {
      console.log('got remote update', id, update)
      this.meta[id] = {
        ...this.meta[id],
        ...update
      }
      this.notifyMeta()
      this.notifyMetaById(id)
    })

    this.remote.send('hello')

    return this.ready
  }

  // TODO better figure out what to do here
  importDoc(data: {id: string, title: string, data: any[]}) {
    return this.prom.send('doc:import', data)
  }

  // TODO I should probably make sure only one thing's connected at a time?
  getFileDb(docid) {
    docid = docid || 'home'
    const db = new PouchDB(docid, {adapter: 'memory'})
    const connectionId = Math.random().toString(16).slice(2)
    const gotChanges = {}

    const startSyncing = () => {
      this.remote.on(connectionId, onChange)
      db._changeStream = db.changes({
        live: true,
        since: 'now',
        include_docs: true,
        attachments: true,
      }).on('change', change => {
        if (!gotChanges[change.doc._rev]) {
          this.remote.send(connectionId, change)
        } else {
          delete gotChanges[change.doc._rev]
        }
      }).on('complete', info => {
        this.remote.send(connectionId, null)
        this.remote.removeListener(connectionId, onChange)
      }).on('error', err => {
        console.error('sync error', docid, connectionId, err)
        this.showToast({type: 'error', message: 'failed syncing document'})
      })
    }

    const onChange = (evt, doc) => {
      gotChanges[doc._rev] = true
      console.log('got a change from the server') // TODO rm
      db.bulkDocs({docs: [doc], new_edits: false}).catch(err => {
        console.error('failed', err)
        this.showToast({type: 'error', message: 'failed to update from sync'})
      })
    }

    return new Promise((res, rej) => {
      this.remote.send('doc:hello', docid, connectionId)
      this.remote.once(connectionId + ':all', (evt, docs) => {
        db.bulkDocs({docs, new_edits: false}).then(() => {
          startSyncing()
          res(db)
        })
      })
    })
    // return setupDbConnection(docid, this.remote, db)
  }

  _updateMeta(id, update) {
    this.remote.send('meta:update', id, update)
  }

  signIn() {
    this.remote.send('user:login')
  }

  signOut() {
    this.remote.send('user:logout')
  }

  deleteFiles(files) {
    // TODO
    return Promise.reject()
  }

  listRemoteFiles() {
    return this.prom.send('sync:list-remote')
  }

  syncFiles(ids: string[]) {
    return this.prom.send('sync:upload', ids)
  }
}

