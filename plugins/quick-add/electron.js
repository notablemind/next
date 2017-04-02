
const PLUGIN_ID = 'quick_add'

let quickAdd = null

const openWindow = (nm) => {
  const {BrowserWindow} = require('electron')
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
  quickAdd.webContents.on('load', () => {
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
  },
}

module.exports = plugin
