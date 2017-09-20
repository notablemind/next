'use strict';

const path = require('path')
const PouchDB = require('pouchdb')
const electron = require('electron')
const {ipcMain, app, Tray, BrowserWindow} = electron
const fs = require('fs')

const ipcPromise = require('./src/ipcPromise')
const makeWindow = require('./src/makeWindow')
const NotableMind = require('./src/NotableMind')
const setupMenu = require('./src/menu')

const userData = app.getPath('userData')
const state = {
  documentsDir: 
    process.env.ALT_DOCS
    ? path.join(userData, 'alt_docs')
    : path.join(userData, 'documents'),
  publicDir: path.join(__dirname, 'public'),
  baseDir: userData,
  ipcMain,
  ipcPromise: ipcPromise(ipcMain),
  plugins: {},
  actions: {},
  createNewWindow: () => null,
}

if (!fs.existsSync(state.documentsDir)) {
  fs.mkdirSync(state.documentsDir)
}

app.on('window-all-closed', function() {
  app.quit();
});

let tray = null

app.on('ready', function() {
  // require('./src/meta')(state);

  const plugins = [
    // require('./src/plugins/quick-add/electron'),
    // require('./src/plugins/code/sources/electron/back'),
    // require('../dom/src/pages/Document/Sync/electron'),
  ]

  const nm = new NotableMind([], state.documentsDir)
  nm.init()

  state.createNewWindow = (docid = 'home', root = null, sticky = false) => nm.attachWindow(makeWindow(state, docid, root, sticky))

  ipcMain.on('toggle-sticky', (evt, {docid, sticky, root}) => {
    BrowserWindow.fromWebContents(evt.sender).close()
    state.createNewWindow(docid, root, sticky)
  })

  plugins.forEach(plugin => {
    state.plugins[plugin.id] = plugin.init(state, nm)
  })

  setupMenu({
    createNewWindow: state.createNewWindow,
  })

  tray = new Tray(path.join(__dirname, 'icon_16.png'))
  tray.setToolTip('Notablemind')

  // makeWindow(state)
  state.createNewWindow()
});
