
export default db => ({
  sync: (onDump, onChange, onError) => {
    db.changes({
      live: true,
      include_docs: true,
      since: 'now',
    }).on('change', change => {
      if (change.doc._deleted) {
        onChange(change.doc._id, null)
      } else {
        onChange(change.doc._id, change.doc)
      }
    }).on('error', onError)

    db.allDocs({include_docs: true}).then(({rows}) => {
      const data = {}
      rows.forEach(({doc}) => {
        if (doc._id === 'settings') return
        data[doc._id] = doc
      })
      onDump(data)
    }, err => onError(err))
  },
  upsert: (id, update) => db.upsert(id, update),
  save: (doc) => db.put(doc),
  saveMany: docs => db.bulkDocs(docs),
  delete: doc => db.remove(doc),
})

