
const {BrowserWindow, ipcMain} = require('electron')
const uuid = require('../../../treed/uuid')
const newNode = require('../../../treed/newNode')

const PLUGIN_ID = 'quick_add'

// let quickAdd = null

const openWindow = (nm, options, onClose) => {
  const quickAdd = new BrowserWindow(Object.assign({
    width: 500,
    height: 22 + 99 + 5,
    movable: false,
    resizable: false,
    // hasShadow: false,
    // useContentSize: true,
    // transparent: true,
    show: false,
    skipTaskBar: true,
    alwaysOnTop: true,
    frame: false,
    title: 'Notablemind Quick Add',
  }, options))
  quickAdd.loadURL('http://localhost:4154')
  // quickAdd.loadURL('file://' + __dirname + '/doc.html')
  quickAdd.on('close', () => {
    if (onClose) onClose()
    // quickAdd = null
  })
  quickAdd.webContents.on('dom-ready', () => {
    quickAdd.webContents.send('meta', nm.meta)
  })
  return quickAdd
}

const addItem = (nm, docid, rootId, text) => {
  const db = nm.ensureDocDb(docid)
  const start = Date.now()
  const id = uuid()
  return db.get(rootId).then(root => {
    return db.bulkDocs([
      Object.assign({}, root, {children: root.children.concat([id])}),
      newNode(id, rootId, start, text),
    ])
  }).then(() => Promise.all([db.get(rootId), db.get(id)]))
  .then(([root, nnode]) => {
    console.log('sending doc change', root, nnode)
    nm.sendDocChange(docid, nnode, null)
    nm.sendDocChange(docid, root, null)
    return id
  })
}

const plugin = {
  id: PLUGIN_ID,

  init(state, nm) {
    const {globalShortcut} = require('electron')
    let window = openWindow(nm, {}, () => window = null)
    const success = globalShortcut.register('Super+Ctrl+m', () => {
      console.log('global shortcut triggered!')
      if (window) {
        window.show()
      }
    })
    ipcMain.on('quick-add', (event, {text, doc, root, sticky}) => {
      console.log('quicking adding', text, doc, root)
      // hmmm so I feel like I need some indirection here anyways

      addItem(nm, doc, root || 'root', text).then(id => {
        if (sticky) {
          state.createNewWindow(doc, id, true)
        }
      })
      // TODO if sticky, open a sticky window right there
      // TODO maybe this will be complicated actually tho
    })
    ipcMain.on('quick-open', (event, {doc, root, sticky}) => {
      console.log('quickly opening', doc, root, sticky)
      state.createNewWindow(doc, root, sticky)
      if (window) {
        window.hide()
      }
    })
    state.ipcPromise.on('full-search', (event, text) => {
      return nm.search(text).then(results => results.map(({key, score, value}) => {
        const [docid, id] = key.split(':')
        return {
          title: value.content.slice(0, 100),
          subtitle: nm.meta[docid].title,
          type: value.type,
          id: docid,
          root: id,
        }
      })).then(results => {
        console.log('got search results', results.length)
        return results
      }) // TODO sort by score?
      /*
      return [{
        title: 'full text: ' + text,
        id: 'home',
        root: 'root',
        subtitle: 'Home',
      }]
      */
    })
  },
  _openWindow: openWindow
}

module.exports = plugin
