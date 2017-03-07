'use strict';

const path = require('path')
const PouchDB = require('pouchdb')
const {ipcMain} = require('electron')

// docid -> uid -> sender
const mplex = {}

module.exports = (state, sender, uid, docid) => {
  const dbid = docid || 'home'
  const db = new PouchDB(path.join(state.documentsDir, dbid))
  console.log('got request to sync', uid, docid, dbid)
  db.allDocs({
    include_docs: true,
    attachments: true,
  }).then(response => {
    // console.log('sending the stuff', dbid, response.rows.length)
    if (sender.isDestroyed()) {
      return
    }
    sender.send(uid, response.rows.map(row => row.doc))

    console.log('listening for further things', dbid)
    if (!mplex[docid]) {
      mplex[docid] = {}
    }
    mplex[docid][uid] = sender

    sender.on('devtools-reload-page', () => { delete mplex[docid][uid] })
    sender.on('destroyed', () => { delete mplex[docid][uid] })

    const cleanup = () => ipcMain.removeListener(uid, listener)
    const listener = makeListener(db, uid, docid, cleanup)
    ipcMain.on(uid, listener)
  }, err => {
    console.log('failed to get all docs', uid, docid, err)
  })
}

const makeListener = (db, uid, docid, cleanup) => (evt, change) => {
  if (Array.isArray(change)) {
    // flush
    db.bulkDocs({docs: change, new_edits: false}).catch(err => {
      console.error('failed to flush', err)
    })
  } else if (change === null) {
    cleanup()
    delete mplex[docid][uid]
    db.close()
  } else {
    // console.log('got change', change.doc)
    db.bulkDocs({docs: [change.doc], new_edits: false}).catch(err => {
      console.log('failures', err, uid, docid)
    })
    Object.keys(mplex[docid]).forEach(mid => {
      if (mid !== uid) {
        const sender = mplex[docid][mid]
        if (!sender.isDestroyed()) {
          // console.log('sending stuff up', mid, docid)
          sender.send(mid, change.doc)
        }
      }
    })
  }
}
