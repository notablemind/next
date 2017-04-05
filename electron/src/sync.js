
const {VERSION, MIME} = require('./consts')
const createFileData = require('./createFileData')

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
    .then(() => true) // TODO calc whether I got any new info
}

module.exports = (auth, syncConfig, db, api/*: Api*/, dirty)/*: RemoteFile*/ => {
  return api.checkRemote(auth, syncConfig).then(needsRefresh => {
    if (!needsRefresh) return dirty
    console.log('doc needs a refresh')
    return api.getContents(auth, syncConfig).then(
      (data/*: SerializedData*/) => mergeDataIntoDatabase(data, db)
    )
  })
  .then(needsPush => needsPush
    ? createFileData(db)
        .then(data => api.updateContents(auth, syncConfig, data))
    : null)
}

