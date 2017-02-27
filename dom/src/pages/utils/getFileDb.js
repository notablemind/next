
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
      console.log('getFileDb', id, uid)
      const {ipcRenderer} = require('electron')

      const gotChanges = {}

      ipcRenderer.once(uid, (evt, docs) => {
        db.bulkDocs({docs, new_edits: false}).then(
          () => {
            db.flushAndClose = () => {
              db.allDocs({
                include_docs: true,
                attachments: true,
              }).then(results => {
                ipcRenderer.send(uid, results.rows.map(row => row.doc))
                db.close()
              }, err => {
                console.error('failed to get all contents', id, err)
              })
            }
            res(db)
            ipcRenderer.on(uid, listener)
            console.log('got', docs.length, 'from back', id, uid)
            db.changes({
              live: true,
              since: 'now',
              include_docs: true,
              attachments: true,
            }).on('change', change => {
              if (!gotChanges[change.doc._rev]) {
                console.log('sending change back home', id)
                ipcRenderer.send(uid, change) // YOLO
              } else {
                console.log('saw this one already', id, change.doc._rev)
                // keep this tidy
                delete gotChanges[change.doc._rev]
              }
            }).on('complete', info => {
              console.warn("closing", id, uid)
              ipcRenderer.send(uid, null) // closing this one
              ipcRenderer.removeListener(uid, listener)
            }).on('error', err => {
              console.error('error syncing', uid, err)
            })
          },
          err => console.log('failed to update in response to server', err)
        ).catch(err => {
          console.error('failed to set things up', err)
        })
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
  getFileDb = id => {
    const db = new PouchDB(id ? `doc_${id}` : 'notablemind_user', {adapter: 'idb'})
    db.flushAndClose = () => db.close()
    Promise.resolve(db)
  }
}

export default getFileDb

