
export default db => ({
  sync: (onDump, onChange, onError) => {
    db.changes({
      live: true,
      include_docs: true,
      // attachments: true,
      since: 'now',
    }).on('change', change => {
      if (change.doc._deleted) {
        onChange(change.doc._id, null)
      } else {
        onChange(change.doc._id, change.doc)
      }
    }).on('error', onError)

    db.allDocs({
      include_docs: true,
      // attachments: true,
    }).then(({rows}) => {
      const data = {}
      rows.forEach(({doc}) => {
        data[doc._id] = doc
      })
      onDump(data)
    }, err => onError(err))
  },
  upsert: (id, update) => db.upsert(id, update), // .then(r => (console.log('upsert', r))),
  save: (doc) => db.put(doc), // .then(r => (console.log('save', r), r)),
  saveMany: docs => db.bulkDocs(docs), // .then(r => (console.log('savemany', r), r)),
  delete: doc => db.remove(doc),
})

