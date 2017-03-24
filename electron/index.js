'use strict';

const path = require('path')
const PouchDB = require('pouchdb')
const electron = require('electron')
const {ipcMain, app} = electron

const startSync = require('./src/sync')
const makeWindow = require('./src/makeWindow')
const NotableMind = require('./src/NotableMind')
const setupMenu = require('./src/menu')

const state = {
  documentsDir: path.join(__dirname, 'documents'),
  publicDir: path.join(__dirname, 'public'),
  baseDir: __dirname,
  ipcMain,
  plugins: {},
  actions: {},
}

ipcMain.on('sync', (evt, uid, docid) => {
  startSync(state, evt.sender, uid, docid)
})

app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  require('./src/meta')(state);

  const plugins = [
    require('../plugins/quick-add/electron'),
    require('../dom/src/pages/Document/Sync/electron'),
  ]

  plugins.forEach(plugin => {
    state.plugins[plugin.id] = plugin.init(state)
  })

  const nm = new NotableMind([], state.documentsDir)
  nm.init()

  setupMenu({
    createNewWindow: () => {
      nm.attachWindow(makeWindow(state))
    },
  })

  // makeWindow(state)
  nm.attachWindow(makeWindow(state))
});

