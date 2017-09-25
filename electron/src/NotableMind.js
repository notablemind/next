// @_flow

const {BrowserWindow, WebContents, ipcMain} = require('electron')
const PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-upsert'))
const path = require('path')
const fs = require('fs')

const ipcPromise = require('./ipcPromise')
const google = require('./google')
const sync = require('./sync')
const createFileData = require('./createFileData')
const mergeDataIntoDatabase = require('./mergeDataIntoDatabase')
const importers = require('./importers')
const searcher = require('./searcher')
const loadMeta = require('./loadMeta')

const tryParse = data => {
  try {
    return JSON.parse(data)
  } catch (e) {}
}

// TODO in order to handle binary formats, I'll want to pass a buffer around
const importData = (id, filename, data) => {
  const json = tryParse(data.toString('utf8'))
  if (json) {
    console.log('was json')
    for (let importer of importers.json) {
      const result = importer(id, filename, json)
      if (result) return result
    }
    console.log('but nothing worked')
  } else {
    console.log('not json tho')
    for (let importer of importers.text) {
      const result = importer(id, filename, data)
      if (result) return result
    }
    console.log('and nothing worked')
  }
}

/*:

type FileMeta = {
  id: string,
  title: string,
  lastOpened: number,
  lastModified: number,
  size: number,
  sync: ?any,
}

type User = any
type Meta = {[docid: string]: FileMeta}

type RemoteFile = {
  id: string,
  modifiedTime: number,
  version: number,
}

type Auth = {access_token: string}

type SyncConfig = {
  // owner: {
    // email: string,
    // profile: string,
    // me: boolean,
  // },
  remoteFiles: {
    meta: RemoteFile,
    contents: RemoteFile,
    folder: RemoteFile,
  },
  // idk
}
*/

const LOGGED_OUT = 'logged-out'
const LOADING = 'loading'

const debounce = (fn, {min, max}) => {
  let last = Date.now()
  let wait
  return () => {
    let diff = Date.now() - last
    if (diff > max) {
      clearTimeout(wait)
      last = Date.now()
      fn()
    } else {
      wait = setTimeout(() => {
        last = Date.now()
        fn()
      }, Math.min(min, max - diff))
    }
  }
}

const noisy = message => err => {
  console.log(message, err)
  throw err
}

const googleSyncApi = {
  checkRemote: (auth /*: Auth*/, syncConfig /*: SyncConfig*/) => {
    return google
      .metaForFile(auth, syncConfig.remoteFiles.contents)
      .then(
        file =>
          file.headRevisionId !== syncConfig.remoteFiles.contents.headRevisionId
      )
      .catch(noisy('failed to get meta for file'))
  },

  updateContents(
    auth /*: Auth*/,
    syncConfig /*: SyncConfig*/,
    data /*: SerializedData*/
  ) {
    return google
      .updateContents(auth, syncConfig.remoteFiles.contents, data)
      .catch(noisy('failed to update contents'))
  },

  getContents(auth /*: Auth*/, syncConfig /*: SyncConfig*/) {
    return google
      .contentsForFile(auth, syncConfig.remoteFiles.contents)
      .catch(noisy('failed to get contents'))
  }
}

module.exports = class Notablemind {
  /*:
  documentsDir: string
  plugins: any[]
  pluginState: {[id: string]: {}}
  windows: {[id: string]: BrowserWindow}
  contents: {[id: string]: WebContents}
  dbs: {[docid: string]: PouchDB}
  docConnections: {[docid: string]: {[chanid: string]: WebContents}}
  meta: {[docid: string]: FileMeta}

  userProm: ?Promise<User>
  user: User
  */

  constructor(plugins /*: Plugin[]*/, documentsDir /*: string*/) {
    this.documentsDir = documentsDir
    this.plugins = plugins
    this.pluginState = {}

    this.online = true // TODO change this ever
    this.working = {}
    this.windows = {}
    this.contents = {}
    this.dbs = {}
    this.docConnections = {}
    this.meta = loadMeta(this.documentsDir)
    this.updaters = {}
    this.periods = {}

    this.searcher = searcher(this.documentsDir)

    this.user = null
    this.userProm = google.restoreUser(this.documentsDir).then(user => {
      if (user) {
        this.user = user
        this.broadcast('user:status', user)
        return user
      } else {
        this.userProm = null
        this.broadcast('user:status', LOGGED_OUT)
      }
    })
  }

  search(text/*: string*/, doc/*: ?string*/ = null) {
    return this.searcher.search(text, doc)
  }

  saveMeta() {
    const metaPath = path.join(this.documentsDir, 'meta.json')
    fs.writeFileSync(metaPath, JSON.stringify(this.meta, null, 2), 'utf8')
  }

  broadcast(name /*: string*/, ...args /*: any[]*/) {
    // console.log('>>>> Broadcasting', name, args, Object.keys(this.contents))
    for (let id in this.contents) {
      this.contents[id].send(name, ...args)
    }
  }

  broadrest(oid /*: string*/, name /*: string*/, ...args /*: any[]*/) {
    for (let id in this.contents) {
      if (id === oid) continue
      if (!this.contents[id].isDestroyed()) {
        this.contents[id].send(name, ...args)
      }
    }
  }

  init() {
    const ipc = ipcPromise(ipcMain)

    // TODO TODO handle offline well

    // TODO what other data does the window need?
    ipcMain.on('hello', evt => {
      console.log('got hello')
      evt.sender.send('hello', {
        user: this.user || (this.userProm ? LOADING : LOGGED_OUT),
        meta: this.meta
      })
      console.log('responded with hello')
    })

    // User stuff
    ipcMain.on('user:login', evt => {
      this.broadcast('user:status', LOADING)
      this.login().then(
        user => this.broadcast('user:status', user),
        error => {
          evt.sender.send('toast', {
            type: 'error',
            message: 'Unable to login'
          })
        }
      )
    })

    ipcMain.on('user:logout', () => {
      this.userProm = null
      this.user = null
      this.broadcast('user:status', 'logged-out')
    })

    // Files metadata stuff
    ipcMain.on('meta:update', (evt, id, update) => {
      // console.log('got update', id, update)
      // console.log('current thing', this.meta[id])
      this.broadrest(evt.sender.id, 'meta:update', id, update)
      if (!this.meta[id]) this.meta[id] = update
      else Object.assign(this.meta[id], update)
      this.saveMeta()
    })

    ipc.on('sync:list-remote', () => this.listRemoteFiles())
    ipc.on('sync:upload', (evt, ids) => {
      // TODO it would be nice to report upload status
      // so to have an observable-like thing
      // really I want a state machine observable.
      // So an observable
      console.log('uploading probably', ids)
      if (!this.userProm) throw new Error('not logged in')
      return Promise.all(ids.map(id => this.setupSyncForFile(id)))
    })

    // Sync settings page ops
    ipc.on('sync:download', (evt, files) => {
      return Promise.all(files.map(file => this.downloadRemoteFile(file)))
    })
    /*
    // might be remote or local
    ipc.on('sync:trash', (evt, files) => {
      return this.trashFiles(files)
    })
    // this'll be only local
    ipc.on('sync:copy', (evt, ids) => {
      return this.makeCopies(ids)
    })
    // must be in trash
    ipc.on('sync:delete', (evt, files) => {
      return this.reallyDelete(files)
    })
    */

    ipcMain.on('doc:new', (evt, docid, title) => {
      this.meta[docid] = {
        id: docid,
        title: title,
        lastOpened: Date.now(),
        lastModified: Date.now(),
        size: 1,
        sync: null // TODO maybe auto-setup sync if that setting is set? Also once I get more confidant about it :P
      }
      this.saveMeta()
      this.broadcast('meta:update', docid, this.meta[docid])
    })

    ipc.on('doc:hello', (evt, docid, chanid) => {
      return this.setupDocConnection(evt.sender, docid, chanid)
    })

    ipc.on('doc:action', (evt, action, docid, data) => {
      return this.processDocAction(action, docid, data).catch(err => {
        console.error('failed to process doc action', err)
        throw err
      })
    })

    ipcMain.on('doc:sync-now', (evt, docid) => {
      this.doSync(docid)
    })

    ipc.on('doc:import', (evt, docid, filename, data) => {
      const result = importData(docid, filename, data)
      if (!result) {
        throw new Error('Invalid data format')
      }
      const {meta, docs} = result
      console.log('imported', docid, meta, docs.length)
      this.meta[docid] = meta
      this.saveMeta()
      const db = this.ensureDocDb(docid)
      console.log(docs[0], docs[1])
      return db.bulkDocs({docs}).then(() => meta)
    })

    ipc.on('doc:delete', (evt, files) => this.deleteFiles(files))

    return Promise.all(
      this.plugins.map(plugin => {
        if (!plugin.init) return
        return Promise.resolve(plugin.init(this))
      })
    )
  }

  deleteFiles(files) {
    console.log('want to delete', files)
    return Promise.all(files.map(file => {
      if (typeof file !== 'string') {
        console.log(file)
        throw new Error('wat not aa local file')
      }
      console.log('removing')
      delete this.meta[file]
      this.saveMeta()
      this.broadcast('meta:delete', file)
      return this.ensureDocDb(file).destroy()
    }))
  }

  getToken() {
    if (!this.userProm) return Promise.reject(new Error('not logged in'))
    return this.userProm.then(({token}) => {
      if (token.expires_at <= Date.now()) {
        return google.refreshToken(token, this.documentsDir).then(user => {
          this.user = user
          return user.token
        })
      }
      return Promise.resolve(token)
    })
  }

  processDocAction(action, docid, data) {
    // console.log('process action', action, docid, data)
    const db = this.ensureDocDb(docid)
    if (action === 'saveMany') {
      this.searcher.batch(docid, data.docs)
    } else if (action === 'delete') {
      this.searcher.delete(docid, data.doc._id)
    }
    const updateSearch = node => (this.searcher.update(docid, node), node)
    // const updateSearch = node => node
    return docActions[action](db, data, updateSearch).then(res => {
      this.meta[docid].lastModified = Date.now()
      if (this.meta[docid].sync) {
        this.meta[docid].sync.dirty = true
        this.saveMeta()
        this.broadcast('meta:update', docid, {
          sync: this.meta[docid].sync,
          lastModified: this.meta[docid].lastModified,
        })
        this.bouncyUpdate(docid)
      } else {
        this.saveMeta()
        this.broadcast('meta:update', docid, {
          lastModified: this.meta[docid].lastModified
        })
      }
      return res
    }).catch(err => {
      console.error('Failed to rpocess doc action!!', err)
      console.error(err)
    })
  }

  /*
  updateSearchForDocAction(action, docid, data) {
    return searchDocActions[action](this.searcher, docid, data)
  }
  */

  login() {
    if (this.userProm) return this.userProm
    this.userProm = google.login(this.documentsDir).then(
      user => {
        if (!this.userProm) throw new Error('login cancelled')
        this.user = user
        return user
      },
      err => {
        this.userProm = null
        throw err
      }
    )
    return this.userProm
  }

  bouncyUpdate(docid) {
    if (!this.updaters[docid]) {
      this.updaters[docid] = debounce(() => this.doSync(docid), {
        min: 10 * 1000,
        max: 30 * 1000
      })
    }
    this.updaters[docid]()
  }

  syncPeriodically(docid) {
    clearTimeout(this.periods[docid])
    this.periods[docid] = setTimeout(() => {
      this.doSync(docid)
    }, 60 * 1000)
  }

  doSync(id) {
    console.log('want to do a sync', this.working[id], !!this.user)
    if (!this.online || !this.user || this.working[id])
      return console.log('but not ready')
    if (!this.meta[id].sync) return console.log('but no meta.sync')
    clearTimeout(this.periods[id])
    const db = this.ensureDocDb(id)
    this.working[id] = true
    console.log('> ok actually syncing')
    this.getToken()
      .then(token =>
        sync(token, this.meta[id].sync, {
          db,
          api: googleSyncApi,
          dirty: this.meta[id].sync.dirty,
          pullOnly: false
        })
      )
      .then(
        contents => {
          // TODO update searcher w/ synced results
          console.log('> did the stuff')
          if (!contents) {
            const meta = this.meta[id]
            meta.sync.lastSynced = Date.now()
            meta.sync.dirty = false
            this.saveMeta()
            this.broadcast('meta:update', meta.id, {
              sync: meta.sync
            })
            this.working[id] = false
            return console.log('no push') // didn't need push
          }
          console.log('updating n stuff')
          const meta = this.meta[id]
          meta.sync.lastSynced = Date.now()
          meta.sync.dirty = false
          meta.sync.remoteFiles.contents = contents
          meta.lastModified = contents.modifiedTime
          this.saveMeta()
          this.broadcast('meta:update', meta.id, {
            sync: meta.sync,
            lastModified: meta.lastModified
          })
          this.working[id] = false
        },
        err => {
          console.error('> failed to sync', err)
          this.working[id] = false
        }
      )
      .then(() => {
        this.syncPeriodically(id)
      }, err => {
        console.error('failing in  things', err)
      })
  }

  ensureDocDb(docid /*: string*/) {
    if (!this.dbs[docid]) {
      const docPath = path.join(this.documentsDir, docid)
      this.dbs[docid] = new PouchDB(docPath)
    }
    return this.dbs[docid]
  }

  setupDocConnection(sender, docid, chanid) {
    this.syncPeriodically(docid)
    if (!this.docConnections[docid]) {
      this.docConnections[docid] = {}
      // sync at the start if we're the first connection
      this.doSync(docid)
    }
    this.docConnections[docid][chanid] = sender
    const db = this.ensureDocDb(docid)

    const changes = db
      .changes({
        live: true,
        since: 'now',
        include_docs: true,
        attachments: true
      })
      .on('change', change => {
        const id = change.doc._id
        const doc = change.doc._deleted ? null : change.doc
        sender.send(chanid, id, doc)
      })
      .on('complete', () => {
        console.log('done w/ changes I guess', docid, chanid)
      })
      .on('error', err => {
        console.error('failed to sync', err)
      })

    let cleanedUp = false
    const cleanup = () => {
      if (cleanedUp) return
      cleanedUp = true
      if (changes) {
        changes.cancel()
      }
      delete this.docConnections[docid][chanid]
      if (!Object.keys(this.docConnections[docid]).length) {
        delete this.docConnections[docid]
      }
    }

    sender.on('destroyed', cleanup)
    sender.on('devtools-reload-page', cleanup)
    BrowserWindow.fromWebContents(sender).on('close', cleanup)

    return db
      .allDocs({include_docs: true, attachments: true})
      .then(({rows}) => {
        const data = {}
        rows.forEach(({doc}) => (data[doc._id] = doc))
        return data
      })
  }

  listRemoteFiles() {
    return (
      this.getToken()
        // TODO update meta's w/ sync information
        // TODO TODO TODO WORK HERE NEXT BC I DELETED A BUNCH OF THINGS AND THEY
        // NEED TO UPDATE NOW
        .then(token => google.listFiles(token))
        .then(
          remoteFiles => (this.processRemoteFiles(remoteFiles), remoteFiles)
        )
    )
  }

  processRemoteFiles(remoteFiles) {
    let changed = false
    const remotesById = {}
    remoteFiles.forEach(file => (remotesById[file.appProperties.nmId] = file))
    Object.keys(this.meta).forEach(id => {
      const meta = this.meta[id]
      if (meta.sync && !remotesById[id]) {
        // the file was remotely deleted
        changed = true
        meta.sync = null
        this.broadcast('meta:update', id, {sync: null})
        // this.notifyMetaById(id)
      } else if (!meta.sync && remotesById[id]) {
        console.error('found a file I was not expecting')
        // TODO process this well, populate sync n stuff
        fail
      }
    })
    if (changed) {
      this.saveMeta()
    }
  }

  setupSyncForFile(id) {
    if (!this.userProm) throw new Error('not logged in')
    const db = this.ensureDocDb(id)
    const {title} = this.meta[id]
    return this.getToken()
      .then(token =>
        createFileData(db).then(data => {
          return google
            .getRootDirectory(token)
            .then(({id: rootId}) =>
              google.createFile(token, rootId, {id, data, title})
            )
        })
      )
      .then(remoteFiles => {
        const sync = {
          remoteFiles,
          owner: {
            me: true,
            email: this.user.email,
            profile: this.user.profile
          }
        }
        this.meta[id].sync = sync
        this.saveMeta()
        this.broadcast('meta:update', id, {sync})
      })
  }

  downloadRemoteFile(
    file /*: {id: string, name: string, appProperties: {nmId: string}}*/
  ) {
    return this.getToken()
      .then(token => google.downloadRemoteFile(token, file))
      .then(({sync, data, id}) => {
        this.meta[id] = {
          id,
          title: file.name,
          // TODO dirty check?
          lastModified: 0,
          lastOpened: Date.now(),
          size: data.docs.length,
          sync
        }
        this.saveMeta()
        const db = this.ensureDocDb(id)
        // TODO search contents
        return mergeDataIntoDatabase(data, db).then(
          () => {
            this.broadcast('meta:update', id, this.meta[id])
          },
          err => {
            console.error('failed to merge data into new database?')
            throw err
          }
        )
      })
  }

  setupSyncForRemoteFiles(files /*: any[]*/) { // TODO type file
    if (!this.userProm) throw new Error('not logged in')
    return this.getToken().then(token =>
      Promise.all(
        files.map(file => {
          const nmId = file.appProperties.nmId // TODO check
          return google.contentsForFile(token, file.id).then(data => {
            // TODO impl
            return this.ensureDocDb(nmId)
              // TODO setup full text search
              .bulkDocs({
                docs: data,
                new_edits: false
              })
              .then(() => {
                this.meta[nmId] = {
                  id: nmId,
                  title: file.name, // TODO check attr
                  lastOpened: Date.now(),
                  lastModified: file.lastModified, // TODO check attr
                  size: data.length,
                  sync: {
                    // TODO fill in
                  }
                }
                this.saveMeta()
                this.broadcast('meta:update', nmId, this.meta[nmId])
              })
          })
        })
      )
    )
  }

  trashFiles(files /*: any[]*/) {
    // TODO will get to later
  }

  makeCopies(ids /*: string[]*/) {
    // TODO will also get to later
    // will probably return a list of the newly created files?
    // And I'll want to select & scroll to them in the UI somehow
  }

  reallyDelete(files /*: any[]*/) {
    // TODO also do later
  }

  attachWindow(browserWindow /*: BrowserWindow*/) {
    const id = browserWindow.id
    const contents = browserWindow.webContents
    const cid = contents.id
    this.windows[browserWindow.id] = browserWindow
    this.contents[cid] = contents
    browserWindow.on('closed', () => {
      console.log('closed', id)
      delete this.windows[id]
      delete this.contents[cid]
    })
  }

  // managing file metadata

  // login n user management

  // syncing documents w/ google drive

  // syncing w/ connected peers through webRTC
}
module.exports.LOGGED_OUT = LOGGED_OUT
module.exports.LOADING = LOADING

const docActions = {
  set: (db, {id, attr, value, modified}, updateSearch) => {
    return db.upsert(id, doc => 
      updateSearch(Object.assign({}, doc, {[attr]: value, modified}))
    )
  },
  setNested: (db, {id, attrs, last, value, modified}, updateSearch) => {
    return db.upsert(id, doc => {
      doc = Object.assign({}, doc, {modified})
      const lparent = attrs.reduce(
        (o, a) => (o[a] = Object.assign({}, o[a])),
        doc
      )
      lparent[last] = value
      return updateSearch(doc)
    })
  },
  updateNested: (db, {id, attrs, last, update, modified}, updateSearch) => {
    // console.log('updating nested', id, attrs, last, update, modified)
    return db.upsert(id, doc => {
      doc = Object.assign({}, doc, {modified})
      const lparent = attrs.reduce(
        (o, a) => (o[a] = Object.assign({}, o[a])),
        doc
      )
      lparent[last] = Object.assign({}, lparent[last], update)
      return updateSearch(doc)
    })
  },
  update: (db, {id, update, modified}, updateSearch) => {
    return db.upsert(id, doc => updateSearch(Object.assign({}, doc, update, {modified})))
  },
  save: (db, {doc}, updateSearch) => db.put(updateSearch(doc)), // .then(r => (console.log('save', r), r)),
  saveMany: (db, {docs}) => db.bulkDocs(docs), // .then(r => (console.log('savemany', r), r)),
  delete: (db, {doc}) => db.remove(doc)
}
