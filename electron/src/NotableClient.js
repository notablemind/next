/*
import PouchDB from '../../node_modules/pouchdb'
PouchDB.plugin(require('pouchdb-authentication'))
PouchDB.plugin(require('pouchdb-adapter-memory'))
PouchDB.plugin(require('pouchdb-upsert'))
*/

import uuid from 'treed/uuid'
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

    setTimeout(
      () => this._onFail(new Error('Timeout waiting for electron')),
      5 * 1000
    )

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
    this.remote.on('meta:delete', (evt, id) => {
      delete this.meta[id]
      this.notifyMeta()
      this.notifyMetaById(id)
    })
    this.remote.on('meta:update', (evt, id, update) => {
      // console.log('got remote update', id, update)
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

  createDoc(title) {
    const docid = uuid()
    this.remote.send('doc:new', docid, title)
    return docid
  }

  importDoc(filename, data) {
    const docid = uuid()
    return this.prom.send('doc:import', docid, filename, data).then(meta => {
      this.meta[docid] = meta
      console.log('got meta back', meta)
      this.notifyMeta()
      return docid
    })
  }

  syncNow(docid) {
    this.remote.send('doc:sync-now', docid)
  }

  getFileDb(docid) {
    const connectionId = Math.random().toString(16).slice(2)
    const {remote, prom} = this
    let cleanup = () => {}
    return Promise.resolve({
      sync(onDump, onChange, onError) {
        const listener = (evt, id, doc) => onChange(id, doc)
        remote.on(connectionId, listener)
        cleanup = () => remote.removeListener(connectionId, listener)
        prom.send('doc:hello', docid, connectionId).then(onDump, onError)
      },
      // TODO I could probably just ditch this and go straight to
      // `processAction` or something
      set(id, attr, value, modified) {
        return prom.send('doc:action', 'set', docid, {
          id,
          attr,
          value,
          modified
        })
      },
      setNested(id, attrs, last, value, modified) {
        return prom.send('doc:action', 'setNested', docid, {
          id,
          attrs,
          last,
          value,
          modified
        })
      },
      updateNested(id, attrs, last, update, modified) {
        return prom.send('doc:action', 'updateNested', docid, {
          id,
          attrs,
          last,
          update,
          modified
        })
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
      }
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
    return this.prom.send('doc:delete', files)
  }

  listRemoteFiles() {
    return this.prom.send('sync:list-remote')
  }

  downloadFiles(files: any[]) {
    return this.prom.send('sync:download', files)
  }

  syncFiles(ids: string[]) {
    return this.prom.send('sync:upload', ids)
  }
}
