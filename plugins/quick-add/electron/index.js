
const {BrowserWindow, ipcMain} = require('electron')
const uuid = require('../../../treed/uuid')
const newNode = require('../../../treed/newNode')

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
  quickAdd.loadURL('http://localhost:4154')
  // quickAdd.loadURL('file://' + __dirname + '/doc.html')
  quickAdd.on('close', () => {
    quickAdd = null
  })
  quickAdd.webContents.on('dom-ready', () => {
    quickAdd.webContents.send('meta', nm.meta)
  })
}

const addItem = (nm, docid, text) => {
  const db = nm.ensureDocDb(docid)
  const start = Date.now()
  const id = uuid()
  return db.get('root').then(root => {
    return db.bulkDocs([
      Object.assign({}, root, {children: root.children.concat([id])}),
      newNode(id, 'root', start, text),
    ])
  }).then(() => Promise.all([db.get('root'), db.get(id)]))
  .then(([root, nnode]) => {
    console.log('sending doc change', root, nnode)
    nm.sendDocChange(docid, nnode, null)
    nm.sendDocChange(docid, root, null)
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
      // hmmm so I feel like I need some indirection here anyways

      addItem(nm, doc, text)
      // TODO maybe this will be complicated actually tho
    })
  },
  _openWindow: openWindow
}

module.exports = plugin
