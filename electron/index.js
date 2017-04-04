'use strict';

const path = require('path')
const PouchDB = require('pouchdb')
const electron = require('electron')
const {ipcMain, app} = electron

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

app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  require('./src/meta')(state);

  const plugins = [
    require('../plugins/quick-add/electron'),
    // require('../dom/src/pages/Document/Sync/electron'),
  ]

  const nm = new NotableMind([], state.documentsDir)
  nm.init()

  plugins.forEach(plugin => {
    state.plugins[plugin.id] = plugin.init(state, nm)
  })

  setupMenu({
    createNewWindow: () => {
      nm.attachWindow(makeWindow(state))
    },
  })

  // makeWindow(state)
  nm.attachWindow(makeWindow(state))
});

