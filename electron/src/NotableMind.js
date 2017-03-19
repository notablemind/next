// @flow

const {BrowserWindow, WebContents, ipcMain} = require('electron')
const PouchDB = require('pouchdb')
const path = require('path')
const fs = require('fs')

const ipcPromise = require('./ipcPromise')
const google = require('./google')

const loadMeta = (documentsDir): Meta => {
  const metaPath = path.join(documentsDir, 'meta.json')
  return JSON.parse(fs.readFileSync(metaPath, 'utf8'))
}

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

module.exports = class Notablemind {
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

  constructor(plugins: Plugin[], documentsDir: string) {
    this.documentsDir = documentsDir
    this.plugins = plugins
    this.pluginState = {}

    this.windows = {}
    this.contents = {}
    this.dbs = {}
    this.docConnections = {}
    this.meta = loadMeta(this.documentsDir)

    this.user = null
    this.userProm = null
  }

  saveMeta() {
    const metaPath = path.join(this.documentsDir, 'meta.json')
    fs.writeFileSync(metaPath, JSON.stringify(this.meta, null, 2), 'utf8')
  }

  broadcast(name: string, ...args: any[]) {
    for (let id in this.contents) {
      this.contents[id].send(id, ...args)
    }
  }

  broadrest(oid: string, name: string, ...args: any[]) {
    for (let id in this.contents) {
      if (id === oid) continue
      this.contents[id].send(id, ...args)
    }
  }

  init() {
    const ipc = ipcPromise(ipcMain)

    // TODO TODO handle offline well

    // TODO what other data does the window need?
    ipcMain.on('hello', evt => {
      evt.sender.send('hello', {
        user: this.user || (this.userProm ? 'loading' : 'logged-out'),
        meta: this.meta,
      })
    })

    // User stuff
    ipcMain.on('user:login', (evt) => {
      this.broadcast('user:status', 'loading')
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
      this.broadcast('user:status', 'logged-out')
      this.userProm = null
      this.user = null
    })

    // Files metadata stuff
    ipcMain.on('meta:update', (evt, id, update) => {
      this.broadrest(evt.sender.id, 'meta:update', id, update)
      Object.assign(this.meta[id], update)
      this.saveMeta()
    })

    // Sync settings page ops
    ipc.on('sync:list-remote', () => this.listRemoteFiles())
    ipc.on('sync:upload', (evt, ids) => {
      // TODO it would be nice to report upload status
      // so to have an observable-like thing
      // really I want a state machine observable.
      // So an observable
      return this.setupSyncForFiles(ids)
    })
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

    // Current doc stuff
    ipcMain.on('doc:hello', (evt, docid, chanid) => {
      this.setupDocConnection(evt.sender, docid, chanid)
    })

    return Promise.all(this.plugins.map(plugin => {
      if (!plugin.init) return
      return Promise.resolve(plugin.init(this))
    }))
  }

  login() {
    if (this.userProm) return this.userProm
    this.userProm = google.login().then(
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

  setupDocConnection(sender: WebContents, docid: string, chanid: string) {
    const cleanup = () => {
      ipcMain.removeListener(chanid, onChange)
      delete this.docConnections[docid][chanid]
    }

    const onChange = (evt, change) => {
      if (!change) cleanup()
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

      for (let cid in this.docConnections[docid]) {
        if (cid !== chanid) {
          this.docConnections[docid][cid].send(cid, change.doc)
        }
      }
    }

    sender.on('destroyed', cleanup)

    ipcMain.on(chanid, onChange)
    if (!this.docConnections[docid]) {
      this.docConnections[docid] = {}
    }
    this.docConnections[docid][chanid] = sender

    this.ensureDocDb(docid).allDocs({include_docs: true}).then(({rows}) => {
      sender.send(chanid + ':all', rows.map(r => r.doc))
    }, err => {
      console.error('failed to get docs')
      // TODO error
    })
  }

  ensureDocDb(docid: string) {
    if (!this.dbs[docid]) {
      const docPath = path.join(this.documentsDir, docid)
      this.dbs[docid] = new PouchDB(docPath)
    }
    return this.dbs[docid]
  }

  listRemoteFiles() {
    if (!this.userProm) throw new Error('not logged in')
    return this.userProm
      .then(user => google.listFiles(user.token))
  }

  setupSyncForFiles(ids: string[]) {
    if (!this.userProm) throw new Error('not logged in')
    return Promise.all(ids.map(id => {
      return this.ensureDocDb(id).allDocs({include_docs: true}).then(({rows}) => {
        return google.createFile({ // TODO impl
          id,
          data: rows,
          user: this.user,
        })
      }).then(file => {
        const sync = {
          remoteId: file.id,
          lastSyncTime: file.lastModified, // TODO check attr name
          lastSyncVersion: file.version,
          owner: {
            me: true,
            // TODO fill in
          },
        }
        this.meta[id].sync = sync
        this.saveMeta()
        this.broadcast('meta:update', id, {sync})
      })
    }))
  }

  setupSyncForRemoteFiles(files: any[]) { // TODO type file
    if (!this.userProm) throw new Error('not logged in')
    return Promise.all(files.map(file => {
      const nmId = file.appProperties.nmId // TODO check
      return google.contentsForFile(file.id).then(data => { // TODO impl
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

  trashFiles(files: any[]) {
    // TODO will get to later
  }

  makeCopies(ids: string[]) {
    // TODO will also get to later
    // will probably return a list of the newly created files?
    // And I'll want to select & scroll to them in the UI somehow
  }

  reallyDelete(files: any[]) {
    // TODO also do later
  }

  attachWindow(browserWindow: BrowserWindow) {
    this.windows[browserWindow.id] = browserWindow
    browserWindow.on('closed', () => {
      delete this.windows[browserWindow.id]
    })
    const contents = browserWindow.webContents
    this.contents[contents.id] = contents
  }

  // managing file metadata

  // login n user management

  // syncing documents w/ google drive

  // syncing w/ connected peers through webRTC
}

