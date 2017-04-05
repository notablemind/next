
// Synchronize w/ google drive or somewhere
const VERSION = '2.0'
const MIME = 'notablemind/serialized-db'

/*

type SerializedData = {
  docs: Array<{
    _id: string,
    _rev: string,
    _revisions: {}, // something pouch uses internally
    // Also the rest of the stuff for a node
  }>,
}

type Api = {
  checkRemote: (syncConfig: SyncConfig) => Promise<boolean>,
  getContents: (syncConfig: SyncConfig) => Promise<SerializedData>,
  updateContents: (syncConfig: SyncConfig, data: SerializedData) => Promise<void>,
}
*/

const migrateData = data => {
  // TODO
  debugger
  throw new Error('data migration not impl')
}

const flatten = arr => [].concat(...arr)

const getAllDocs = db => {
  return db.allDocs({include_docs: false}).then(({rows}) => db.bulkGet({
    docs: rows.map(row => ({id: row.id, rev: row.value.rev})),
    attachments: true, // TODO maybe handle attachments differently
    latest: true,
    revs: true,
  })).then(({results}) => {
    return flatten(results.map(bulkGetInfo => (
      // TODO why would there be multiple docs for an id?
      bulkGetInfo.docs.map(doc => doc.ok)
    ))).filter(Boolean)
  })
}

// I want revision history is what I want I think
const createFileDataWithDocs = docs => {
  return {
    type: MIME,
    version: VERSION,
    attachmentMode: 'inline',
    docs,
  }
}

// TODO TODO TODO
const resolveConflicts = db => {
  console.log('lol not resolving conflicts')
  return null
}

const mergeDataIntoDatabase = (data/*: SerializedData*/, db) => {
  if (data.type !== MIME) throw new Error('wrong notablemind type: ' + MIME)
  if (data.version !== VERSION) data = migrateData(data)
  return db.bullkDocs({docs: data.docs, new_edits: false})
    .then(db => resolveConflicts(db))
}

module.exports = (auth, syncConfig, db, api/*: Api*/)/*: RemoteFile*/ => {
  return api.checkRemote(auth, syncConfig).then(needsRefresh => {
    if (!needsRefresh) return
    return api.getContents(auth, syncConfig).then(
      (data: SerializedData) => mergeDataIntoDatabase(data, db)
    )
  })
  .then(() => getAllDocs(db))
  .then(createFileDataWithDocs)
  .then(data => api.updateContents(auth, syncConfig, data))
}

