
const {BrowserWindow, ipcMain} = require('electron')

const PLUGIN_ID = 'quick_add'

let quickAdd = null

const openWindow = (nm) => {
  quickAdd = new BrowserWindow({
    width: 500,
    height: 500,
    movable: false,
    resizable: false,
    hasShadow: false,
    // useContentSize: true,
    transparent: true,
    skipTaskBar: true,
    alwaysOnTop: true,
    frame: false,
    title: 'Notablemind Quick Add',
  })
  quickAdd.loadURL('file://' + __dirname + '/doc.html')
  quickAdd.on('close', () => {
    quickAdd = null
  })
  quickAdd.webContents.on('dom-ready', () => {
    quickAdd.webContents.send('meta', nm.meta)
  })
}

const plugin = {
  id: PLUGIN_ID,

  init(state, nm) {
    const {globalShortcut} = require('electron')
    const success = globalShortcut.register('Super+Ctrl+m', () => {
      console.log('global shortcut triggered!')
      openWindow(nm)
    })
    ipcMain.on('quick-add', (event, {text, doc}) => {
      console.log('quicking adding', text, doc)
      // TODO maybe this will be complicated actually tho
    })
  },
}

module.exports = plugin
