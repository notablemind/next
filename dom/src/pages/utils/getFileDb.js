
import PouchDB from 'pouchdb'
PouchDB.plugin(require('pouchdb-authentication'))
if (ELECTRON) {
  PouchDB.plugin(require('pouchdb-adapter-memory'))
} else {
  PouchDB.plugin(require('pouchdb-adapter-idb'))
}
PouchDB.plugin(require('pouchdb-upsert'))

let getFileDb

if (ELECTRON) {
  getFileDb = id => {
    return new Promise((res, rej) => {
      const db = new PouchDB(id ? `doc_${id}` : 'home', {adapter: 'memory'})
      const uid = Math.random().toString(16).slice(2)
      const {ipcRenderer} = require('electron')

      const gotChanges = {}

      ipcRenderer.once(uid, (evt, docs) => {
        db.bulkDocs({docs, new_edits: false}).then(
          () => {
            res(db)
            ipcRenderer.on(uid, listener)
            db.changes({
              live: true,
              since: 'now',
              include_docs: true,
              attachments: true,
            }).on('change', change => {
              if (!gotChanges[change.doc._rev]) {
                ipcRenderer.send(uid, change) // YOLO
              } else {
                // keep this tidy
                delete gotChanges[change.doc._rev]
              }
            }).on('complete', info => {
              console.log("closing", uid)
              ipcRenderer.send(uid, null) // closing this one
              ipcRenderer.removeListener(uid, listener)
            }).on('error', err => {
              console.log('error eith', uid, err)
            })
          },
          err => console.log('failed to update in response to server', err)
        )
      })

      let first = true
      const listener = (evt, doc) => {
        gotChanges[doc._rev] = true
        console.log('listen folks', doc)
        db.bulkDocs({docs: [doc], new_edits: false}).catch(
          err => console.log('failed to update in response to server', err)
        )
      }

      ipcRenderer.send('sync', uid, id)
    })

  }
} else {
  getFileDb = id => Promise.resolve(new PouchDB(id ? `doc_${id}` : 'notablemind_user', {adapter: 'idb'}))
}

export default getFileDb

