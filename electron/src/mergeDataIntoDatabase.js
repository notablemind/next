const {VERSION, MIME} = require('./consts')

const migrateData = data => {
  // TODO
  debugger
  throw new Error('data migration not impl')
}

const findConflictingDocs = (newDocsById, db) => {
  return db.allDocs({include_docs: false}).then(({rows}) => {
    const myConflictingRevs = []
    const maybeConflicting = []
    rows.forEach(row => {
      const [number, hash] = row.value.rev.split('-')
      if (!newDocsById[row.id]) return
      if (newDocsById[row.id]._revisions.start < +number) {
        // we're larger, so I don't know if history is shared - will have to
        // fetch revisions list
        maybeConflicting.push(row)
      } else if (newDocsById[row.id]._revisions.ids.indexOf(hash) === -1) {
        // we're smaller, and not in their revs list -- definite conflict
        myConflictingRevs.push(row)
      }
    })
    console.log(
      'checked for conflicts',
      myConflictingRevs.length,
      'definite',
      maybeConflicting.length,
      'maybe'
    )

    const prom = maybeConflicting.length === 0
      ? Promise.resolve([])
      : db.bulkGet({docs: maybeConflicting, revs: true}).then(({results}) => {
          const conflictingDocs = []
          results.forEach(result => {
            result.docs.forEach(item => {
              const doc = item.ok
              if (!doc) return
              const newDoc = newDocsById[doc._id]
              if (doc._revisions.ids.indexOf(newDoc._revisions.ids[0]) === -1) {
                // not shared history!
                conflictingDocs.push(doc)
              }
            })
          })
          return conflictingDocs
        })

    return prom
      .then(conflictingDocs => {
        if (!myConflictingRevs.length) return conflictingDocs
        return db.bulkGet({docs: myConflictingRevs}).then(({results}) => {
          results.forEach(({docs}) =>
            docs.forEach(({ok}) => {
              if (ok) conflictingDocs.push(ok)
            })
          )
          return conflictingDocs
        })
      })
      .then(conflictingDocs => ({
        conflictingDocs,
        dirty: myConflictingRevs.length || maybeConflicting.length
      }))
  })
}

// TODO this is super basic, want a more interesting algo than "longest text
// wins"
// TODO also I want a way to preserve in history the pre-conflict doc :/
// Maybe commit the old docs on top of the new docs and then commit the merged
// docs on top of that? That would at least preserve some history, although it
// would be somewhat complicated.
const mergeDocs = (myDoc, theirDoc) => {
  console.log('WOOOT merge', myDoc, theirDoc)
  return Object.assign({}, theirDoc, {
    content: myDoc.content.length > theirDoc.content.length
      ? myDoc.content
      : theirDoc.content
  })
}

// TODO TODO TODO test this all up in here
const mergeDataIntoDatabase = (data /*: SerializedData*/, db) => {
  if (data.type !== MIME) {
    console.log(data)
    throw new Error('wrong notablemind type: ' + data.type)
  }
  if (data.version !== VERSION) data = migrateData(data)

  const newDocsById = {}
  data.docs.forEach(doc => (newDocsById[doc._id] = doc))

  return findConflictingDocs(
    newDocsById,
    db
  ).then(({conflictingDocs, dirty}) => {
    // # Delete docs that will conflict
    return (
      (conflictingDocs.length
        ? db.bulkDocs({
            docs: [
              ...conflictingDocs.map(doc =>
                Object.assign({}, doc, {_deleted: true})
              )
            ]
          })
        : Promise.resolve())
        // # Merge in new data
        .then(() => db.bulkDocs({docs: data.docs, new_edits: false}))
        // # Commit merged docs
        .then(() => {
          if (!conflictingDocs.length) return
          // merge each conflicting doc & commit the result
          return db.bulkDocs({
            docs: [
              ...conflictingDocs.map(doc =>
                mergeDocs(doc, newDocsById[doc._id])
              )
            ]
          })
        })
        .then(() => (console.log('from merge, dirty is', dirty), dirty))
    )
  })

  /*
  return db.bulkDocs({docs: data.docs, new_edits: false})
    // .then(db => resolveConflicts(db))
    .then(() => true) // TODO calc whether I got any new info
  */
}

module.exports = mergeDataIntoDatabase
