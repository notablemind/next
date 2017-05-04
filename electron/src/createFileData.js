const {VERSION, MIME} = require('./consts')

// Synchronize w/ google drive or somewhere

const flatten = arr => [].concat(...arr)

const getAllDocs = db => {
  return db
    .allDocs({include_docs: false})
    .then(({rows}) =>
      db.bulkGet({
        docs: rows.map(row => ({id: row.id, rev: row.value.rev})),
        attachments: true, // TODO maybe handle attachments differently
        latest: true,
        revs: true,
      }),
    )
    .then(({results}) => {
      return flatten(
        results.map(bulkGetInfo =>
          // TODO why would there be multiple docs for an id?
          bulkGetInfo.docs.map(doc => doc.ok),
        ),
      ).filter(Boolean)
    })
}

const createFileDataWithDocs = docs => {
  return {
    type: MIME,
    version: VERSION,
    attachmentMode: 'inline',
    docs,
  }
}

module.exports = db => getAllDocs(db).then(createFileDataWithDocs)
