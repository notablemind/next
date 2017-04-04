// @flow

const {BrowserWindow, WebContents, ipcMain} = require('electron')
const PouchDB = require('pouchdb')
const path = require('path')
const fs = require('fs')

const ipcPromise = require('./ipcPromise')
const google = require('./google')

const loadMeta = (documentsDir)/*: Meta*/ => {
  const metaPath = path.join(documentsDir, 'meta.json')
  return JSON.parse(fs.readFileSync(metaPath, 'utf8'))
}

/*
type SyncData = {
    owner: any,
    remoteId: string,
    lastSyncTime: number,
    lastSyncVersion: number,
  }

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

module.exports = class Notablemind {
  /*
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

  constructor(plugins/*: Plugin[]*/, documentsDir/*: string*/) {
    this.documentsDir = documentsDir
    this.plugins = plugins
    this.pluginState = {}

    this.online = true // TODO change this ever
    this.windows = {}
    this.contents = {}
    this.dbs = {}
    this.docConnections = {}
    this.meta = loadMeta(this.documentsDir)

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

  saveMeta() {
    const metaPath = path.join(this.documentsDir, 'meta.json')
    fs.writeFileSync(metaPath, JSON.stringify(this.meta, null, 2), 'utf8')
  }

  broadcast(name/*: string*/, ...args/*: any[]*/) {
    // console.log('>>>> Broadcasting', name, args, Object.keys(this.contents))
    for (let id in this.contents) {
      this.contents[id].send(name, ...args)
    }
  }

  broadrest(oid/*: string*/, name/*: string*/, ...args/*: any[]*/) {
    for (let id in this.contents) {
      if (id === oid) continue
      this.contents[id].send(name, ...args)
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
        meta: this.meta,
      })
      console.log('responded with hello')
    })

    // User stuff
    ipcMain.on('user:login', (evt) => {
      this.broadcast('user:status', LOADING)
      this.login().then(
        user => this.broadcast('user:status', user),
        error => {
          evt.sender.send('toast', {
            type: 'error',
            message: 'Unable to login',
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
      console.log('got update', id, update)
      console.log('current thing', this.meta[id])
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
      return this.setupSyncForFiles(ids)
    })

    /*
    // Sync settings page ops
    ipc.on('sync:download', (evt, files) => {
      return this.setupSyncForRemoteFiles(files)
    })
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

    // Current doc stuff
    ipcMain.on('doc:hello', (evt, docid, chanid) => {
      this.setupDocConnection(evt.sender, docid, chanid)
    })

    ipc.on('doc:import', (evt, data) => {
      // TODO something reasonable here
      // and resolve the promise
    })

    return Promise.all(this.plugins.map(plugin => {
      if (!plugin.init) return
      return Promise.resolve(plugin.init(this))
    }))
  }

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
        max: 30 * 1000,
      })
    }
    this.updaters[docid]()
  }

  doSync(id) {
    if (!this.online || !this.user || this.working[id]) return
    const {sync} = this.meta[id]
    const {token} = this.user
    const start = Date.now() // TODO analyze how long it takes to sync, and better do things
    google.metaForFile(token, id).then(file => {
      if (file.modifiedTime !== sync.lastSyncTime || file.version !== sync.lastSyncVersion) {
        console.log('Different! downloading first', sync, file.modifiedTime, file.version)
        return google.contentsForFile(token, id).then(contents => {
          // TODO check version probably
          if (contents.version !== '2.0' || contents.type !== 'notablemind') { // LOL don't hard code
            throw new Error('unexpected contents: ' + contents.type + ' ' + contents.version)
          }
          if (contents.attachmentMode !== 'inline') {
            throw new Error("dunno how I'm gonna deal with this tbh. lazy-load from the web? probably not, probably gonna download everything at once. But I want to know if I have them first probably")
          }
          return this.ensureDocDb(id)
            .then(db => db.bulkDocs({docs: contents.data, new_edits: false}))
        }).then(() => this.dbs[id].allDocs({include_docs: true, attachments: true}).then(({rows}) => {
          return google.updateContentsForFile(token, sync.contentsId, rows.map(row => row.doc))
        }))
      }
    }).catch(err => {
      console.error('failed during sync!!!')
      console.error(err)
    })
  }

  processDocChange(docid, change, chanid) {
    this.dbs[docid].bulkDocs({
      docs: [change.doc],
      new_edits: false,
    }).catch(err => {
      console.error('failed to process change', err)
      sender.send('toast', {
        type: 'error',
        message: 'Failed to process change',
      })
    })

    if (this.meta[docid].sync && this.user && this.online) {
      this.bouncyUpdate(docid)
    }

    this.sendDocChange(docid, change.doc, chanid)
  }

  sendDocChange(docid, doc, chanid) {
    console.log('sending doc change', docid)
    for (let cid in this.docConnections[docid]) {
      const sender = this.docConnections[docid][cid]
      if (cid !== chanid && !sender.isDestroyed()) {
        console.log('sending up', docid, cid)
        sender.send(cid, doc)
      }
    }
  }

  setupDocConnection(sender/*: WebContents*/, docid/*: string*/, chanid/*: string*/) {
    const cleanup = () => {
      ipcMain.removeListener(chanid, onChange)
      delete this.docConnections[docid][chanid]
      // TODO remove db if no more connections?
    }

    const onChange = (evt, change) => {
      if (!change) return cleanup()
      this.processDocChange(docid, change, chanid)
    }

    this.ensureDocDb(docid).allDocs({include_docs: true}).then(({rows}) => {
      if (sender.isDestroyed()) return
      sender.send(chanid + ':all', rows.map(r => r.doc))

      if (!this.docConnections[docid]) {
        this.docConnections[docid] = {}
      }
      this.docConnections[docid][chanid] = sender

      sender.on('destroyed', cleanup)
      sender.on('devtools-reload-page', cleanup)
      ipcMain.on(chanid, onChange)

    }, err => {
      sender.send('toast', {
        type: 'error',
        message: 'Failed to get document, might need to restart',
      })
      console.error('failed to get docs', err)
    })
  }

  ensureDocDb(docid/*: string*/) {
    if (!this.dbs[docid]) {
      const docPath = path.join(this.documentsDir, docid)
      this.dbs[docid] = new PouchDB(docPath)
    }
    return this.dbs[docid]
  }

  listRemoteFiles() {
    if (!this.userProm) throw new Error('not logged in')
    return this.userProm
      // TODO update meta's w/ sync information
      // TODO TODO TODO WORK HERE NEXT BC I DELETED A BUNCH OF THINGS AND THEY
      // NEED TO UPDATE NOW
      .then(user => google.listFiles(user.token))
      .then(remoteFiles => (this.processRemoteFiles(remoteFiles), remoteFiles))
  }

  processRemoteFiles(remoteFiles) {
    let changed = false
    const remotesById = {}
    remoteFiles.forEach(file => remotesById[file.appProperties.nmId] = file)
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

  setupSyncForFiles(ids/*: string[]*/) {
    if (!this.userProm) throw new Error('not logged in')
    return Promise.all(ids.map(id => {
      return this.ensureDocDb(id).allDocs({include_docs: true, attachments: true}).then(({rows}) => {
        console.log('lookin for', id)
        console.log('gettin root')
        // TODO maybe cache
        return google.getRootDirectory(this.user.token)
          .catch(err => {
            console.error('no root tho')
            console.error(err)
            throw err
          })
          .then(rootDirectory => google.createFile(this.user.token, rootDirectory.id, {
            id,
            data: rows.map(row => row.doc),
            title: this.meta[id].title,
          }).catch(err => {
            console.error('cannot create tile tho', rootDirectory.id, id, this.meta[id].title)
            console.error(err)
            throw err
          }))
      }).then(({folder, meta, contents}) => {
        const sync = {
          folderId: folder.id,
          contentsId: contents.id,
          lastSyncTime: contents.modifiedTime, // TODO check attr name
          lastSyncVersion: contents.version,
          owner: {
            me: true,
            email: this.user.email,
            profile: this.user.profile,
          },
        }
        this.meta[id].sync = sync
        this.saveMeta()
        this.broadcast('meta:update', id, {sync})
      }, err => {
        console.log('failing to do the things for', id, err)
      })
    }))
  }

  setupSyncForRemoteFiles(files/*: any[]*/) { // TODO type file
    if (!this.userProm) throw new Error('not logged in')
    return Promise.all(files.map(file => {
      const nmId = file.appProperties.nmId // TODO check
      return google.contentsForFile(this.user.token, file.id).then(data => { // TODO impl
        return this.ensureDocDb(nmId).bulkDocs({
          docs: data,
          new_edits: false,
        }).then(() => {
          this.meta[nmId] = {
            id: nmId,
            title: file.name, // TODO check attr
            lastOpened: Date.now(),
            lastModified: file.lastModified, // TODO check attr
            size: data.length,
            sync: {
              // TODO fill in
            },
          }
          this.saveMeta()
          this.broadcast('meta:update', nmId, this.meta[nmId])
        })
      })
    }))
  }

  trashFiles(files/*: any[]*/) {
    // TODO will get to later
  }

  makeCopies(ids/*: string[]*/) {
    // TODO will also get to later
    // will probably return a list of the newly created files?
    // And I'll want to select & scroll to them in the UI somehow
  }

  reallyDelete(files/*: any[]*/) {
    // TODO also do later
  }

  attachWindow(browserWindow/*: BrowserWindow*/) {
    const id = browserWindow.id
    this.windows[browserWindow.id] = browserWindow
    browserWindow.on('closed', () => {
      delete this.windows[id]
    })
    const contents = browserWindow.webContents
    this.contents[contents.id] = contents
  }

  // managing file metadata

  // login n user management

  // syncing documents w/ google drive

  // syncing w/ connected peers through webRTC
}
module.exports.LOGGED_OUT = LOGGED_OUT
module.exports.LOADING = LOADING

