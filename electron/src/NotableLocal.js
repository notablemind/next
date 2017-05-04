import PouchDB from '../../node_modules/pouchdb'
PouchDB.plugin(require('pouchdb-authentication'))
PouchDB.plugin(require('pouchdb-adapter-idb'))
PouchDB.plugin(require('pouchdb-upsert'))

import NotableBase from './NotableBase'

const LS_KEY = 'nm:files'
const loadFiles = () => {
  try {
    return JSON.parse(localStorage[LS_KEY] || '')
  } catch (e) {
    return null
  }
}
const onChange = () => {} // noop
const saveFiles = files => (localStorage[LS_KEY] = JSON.stringify(files))
const updateFile = (files, id, update) => {
  files[id] = {...files[id], ...update}
  saveFiles(files)
}

export default class NotableLocal extends NotableBase {
  constructor(showToast) {
    super()
    this.showToast = showToast
  }

  init() {
    this.meta = loadFiles() || {}
    // TODO get this going again
    // googleApi.checkForReturn()
    // TODO check user login n stuff!
    window.addEventListener('storage', event => {
      if (event.key === LS_KEY) {
        this.meta = loadFiles()
        this.notifyMeta()
        Object.keys(this.meta).forEach(id => {
          // TODO do a diff before & after & only notify for ones that
          // changed.
          this.notifyMetaById(id)
        })
      }
    })
  }

  getFileDb(docid) {
    const db = new PouchDB(id ? `doc_${id}` : 'notablemind_user', {
      adapter: 'idb'
    })
    db.flushAndClose = () => db.close()
    return db
  }

  _updateMeta(id, update) {
    saveMeta(this.meta)
  }
}
