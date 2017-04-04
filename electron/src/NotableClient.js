
import PouchDB from '../../node_modules/pouchdb'
PouchDB.plugin(require('pouchdb-authentication'))
PouchDB.plugin(require('pouchdb-adapter-memory'))
PouchDB.plugin(require('pouchdb-upsert'))

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

  getFileDb(docid) {
    const connectionId = Math.random().toString(16).slice(2)
    const {remote, prom} = this
    let cleanup = () => {}
    return Promise.resolve({
      sync(onDump, onChange, onError) {
        const listener = (evt, id, doc) => onChange(id, doc)
        remote.on(connectionId, listener)
        cleanup = () => this.remote.removeEventListener(connectionId, listener)
        prom.send('doc:hello', docid, connectionId)
          .then(onDump, onError)
      },
      // TODO I could probably just ditch this and go straight to
      // `processAction` or something
      set(id, attr, value, modified) {
        return prom.send('doc:action', 'set', docid, {id, attr, value, modified})
      },
      setNested(id, attrs, last, value, modified) {
        return prom.send('doc:action', 'setNested', docid, {id, attrs, last, value, modified})
      },
      update(id, update, modified) {
        return prom.send('doc:action', 'update', docid, {id, update, modified})
      },
      save(doc) {
        return prom.send('doc:action', 'save', docid, {doc})
      },
      saveMany(docs) {
        return prom.send('doc:action', 'saveMany', docid, {docs})
      },
      delete(doc) {
        return prom.send('doc:action', 'delete', docid, {doc})
      },
      getAttachment(id, attachmentId) {
        return Promise.reject(new Error('not impl'))
      },
      getBase64Attachment(id, attachmentId) {
        return Promise.reject(new Error('not impl'))
      },
      destroy() {
        cleanup()
      },
    })
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

