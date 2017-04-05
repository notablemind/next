
const createFileData = require('./createFileData')
const mergeDataIntoDatabase = require('./mergeDataIntoDatabase')

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

