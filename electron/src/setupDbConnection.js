
// This is used after importing. I think I want a better way to do this?
const flushAndClose = (db, remote, connectionId) => {
  db.allDocs({
    include_docs: true,
    attachments: true, // TODO better attachment handling?
  }).then(results => {
    remote.send(connectionId, results.rows.map(row => row.doc))
    db.close()
  }, err => {
    console.error('failed to get all contents', id, err)
  })
}

const setupDbConnection = (id, remote, db) => {
  return new Promise((res, rej) => {
    const connectionId = Math.random().toString(16).slice(2)
    const gotChanges = {}

    db.flushAndClose = () => flushAndClose(db, remote, connectionId)

    const startSyncing = () => {
      remote.on(connectionId, listener)
      db._changeStream = db.changes({
        live: true,
        since: 'now',
        include_docs: true,
        attachments: true,
      }).on('change', change => {
        if (!gotChanges[change.doc._rev]) {
          remote.send(connectionId, change)
        } else {
          delete gotChanges[change.doc._rev]
        }
      }).on('complete', info => {
        remote.send(connectionId, null) // closing this one
        remote.removeListener(connectionId, listener)
      }).on('error', err => {
        console.error('error syncing', connectionId, err)
      })
    }

    const listener = (evt, doc) => {
      gotChanges[doc._rev] = true
      console.log('got a change from the server', doc)
      db.bulkDocs({docs: [doc], new_edits: false}).catch(
        err => console.log('failed to update in response to server', err)
      )
    }

    remote.once(connectionId, (evt, docs) => {
      db.bulkDocs({docs, new_edits: false}).then(() => {
        startSyncing()
        res(db)
      })
    })

    remote.send('sync', connectionId, id)
  })
}

export default setupDbConnection
