
const PLUGIN_ID = 'quick_add'

let quickAdd = null

const openWindow = () => {
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
}

const plugin = {
  id: PLUGIN_ID,

  init() {
    const {globalShortcut} = require('electron')
    const success = globalShortcut.register('Super+Ctrl+m', () => {
      console.log('global shortcut triggered!')
      openWindow()
    })
  },
}

module.exports = plugin
