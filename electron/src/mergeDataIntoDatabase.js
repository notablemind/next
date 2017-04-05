
const {VERSION, MIME} = require('./consts')

const migrateData = data => {
  // TODO
  debugger
  throw new Error('data migration not impl')
}


// TODO TODO TODO
const resolveConflicts = db => {
  console.log('lol not resolving conflicts')
  return null
}

const mergeDataIntoDatabase = (data/*: SerializedData*/, db) => {
  if (data.type !== MIME) throw new Error('wrong notablemind type: ' + MIME)
  if (data.version !== VERSION) data = migrateData(data)
  return db.bulkDocs({docs: data.docs, new_edits: false})
    .then(db => resolveConflicts(db))
    .then(() => true) // TODO calc whether I got any new info
}

module.exports = mergeDataIntoDatabase
