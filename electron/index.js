'use strict';

const electron = require('electron');
const {ipcMain} = electron;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const fs = require('fs')
const path = require('path')
const PouchDB = require('pouchdb')

let mainWindow = null;

const {session} = require('electron')

app.on('window-all-closed', function() {
  app.quit();
});

const windows = []

const makeWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    // skipTaskBar: true,
    // alwaysOnTop: true,
    // frame: false,
    title: 'NotableMind',
    height: 800,
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:4151');
  } else {
    win.loadURL('file://' + __dirname + '/public/index.html');
  }
  windows.push(win)
  win.on('closed', function() {
    windows.splice(windows.indexOf(win), 1)
  });
}


// docid -> uid -> sender
const mplex = {}

ipcMain.on('sync', (evt, uid, docid) => {
  const dbid = docid || 'home'
  const db = new PouchDB(path.join(__dirname, 'documents', dbid))
  console.log('got request to sync', uid, docid, dbid)
  db.allDocs({
    include_docs: true,
    attachments: true,
  }).then(response => {
    console.log('sending the stuff', dbid, response.rows.length)
    if (!evt.sender.isDestroyed()) {
      evt.sender.send(uid, response.rows.map(row => row.doc))

      console.log('listening for further things', dbid)
      if (!mplex[docid]) {
        mplex[docid] = {}
      }
      mplex[docid][uid] = evt.sender
      const listener = (evt, change) => {
        if (Array.isArray(change)) {
          // flush
          db.bulkDocs({docs: change, new_edits: false}).catch(err => {
            console.error('failed to flush', err)
          })
        } else if (change === null) {
          console.log('removing listener', uid)
          ipcMain.removeListener(uid, listener)
          delete mplex[docid][uid]
          db.close()
        } else {
          Object.keys(mplex[docid]).forEach(mid => {
            if (mid !== uid) {
              const sender = mplex[docid][mid]
              if (!sender.isDestroyed()) {
                console.log('sending stuff up', mid, docid)
                sender.send(mid, change.doc)
              }
            }
          })
          db.bulkDocs({docs: [change.doc], new_edits: false}).catch(err => {
            console.log('failures', err, uid, docid)
          })
        }
      }
      ipcMain.on(uid, listener)
    }
  }, err => {
    console.log('failed to get all docs', uid, docid, err)
  })

})

app.on('ready', function() {
  const plugins = [
    require('../plugins/files/electron'),
    require('../plugins/quick-add/electron'),
  ]

  const state = {
    documentsDir: path.join(__dirname, 'documents'),
    baseDir: __dirname,
    ipcMain,
    plugins: {},
  }

  plugins.forEach(plugin => {
    state.plugins[plugin.id] = plugin.init(state)
  })

  makeWindow()
  // makeWindow()

});

