'use strict'

const {BrowserWindow} = require('electron')
const open = require('open')
const path = require('path')

const windows = []

const makeWindow = (state/*: any*/, docid/*: string*/ = 'home', root/*: ?string*/ = null, sticky/*: boolean*/ = false) => {
  console.log('making window', docid, root)
  const win = new BrowserWindow(Object.assign({
    width: 1200,
    titleBarStyle: 'hidden-inset',
    fullscreenable: false,
    title: 'NotableMind',
    height: 800,
    icon: path.join(__dirname, '../icon256.png'),
    webPreferences: {
      webSecurity: false
    },

    skipTaskBar: false,
    alwaysOnTop: false,
    frame: true,
  }, sticky ? {
    titleBarStyle: undefined,
    frame: false,
    skipTaskBar: true,
    alwaysOnTop: true,
    width: 500,
    height: 300,
  } : {}))
  win.on('closed', function() {
    windows.splice(windows.indexOf(win), 1)
  })
  win.webContents.on('will-navigate', (event, url) => {
    if (url.indexOf(localURL) === 0) return
    if (url.indexOf(localFile) === 0) return
    event.preventDefault()
  })
  win.webContents.on('new-window', (event, url) => {
    event.preventDefault()
    open(url)
  })
  win.webContents.on('did-fail-load', (event, code, description, url) => {
    console.error('failed to load', url)
    win.webContents.executeJavaScript(
      `document.body.innerHTML = "<div style='text-align:center;padding:100px'>Failed to load - you need to start the server</div>"`
    )
  })

  const localURL = 'http://localhost:4151'
  const localFile = 'file://' + state.publicDir + '/index.html'
  let suffix = '#/doc/' + docid
  if (root) suffix += '/' + root
  if (sticky) suffix += '?sticky=true'
  if (process.env.NODE_ENV === 'development') {
    win.loadURL(localURL + suffix)
  } else {
    win.loadURL(localFile + suffix)
  }
  windows.push(win)
  return win
}

module.exports = makeWindow
