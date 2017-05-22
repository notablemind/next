'use strict';

const path = require('path')
const PouchDB = require('pouchdb')
const electron = require('electron')
const {ipcMain, app} = electron

const makeWindow = require('./src/makeWindow')
const NotableMind = require('./src/NotableMind')
const setupMenu = require('./src/menu')

const state = {
  documentsDir: process.env.ALT_DOCS
    ? path.join(__dirname, 'alt_docs')
    : path.join(__dirname, 'documents'),
  publicDir: path.join(__dirname, 'public'),
  baseDir: __dirname,
  ipcMain,
  plugins: {},
  actions: {},
  createNewWindow: () => null,
}

app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  // require('./src/meta')(state);

  const plugins = [
    require('../plugins/quick-add/electron'),
    require('../plugins/code/sources/electron/back'),
    // require('../dom/src/pages/Document/Sync/electron'),
  ]

  const nm = new NotableMind([], state.documentsDir)
  nm.init()

  state.createNewWindow = (docid = 'home', root = null, sticky = false) => nm.attachWindow(makeWindow(state, docid, root, sticky))

  plugins.forEach(plugin => {
    state.plugins[plugin.id] = plugin.init(state, nm)
  })

  setupMenu({
    createNewWindow: state.createNewWindow,
  })

  // makeWindow(state)
  state.createNewWindow()
});

