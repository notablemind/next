'use strict';

const {BrowserWindow} = require('electron')
const open = require('open')
const path = require('path')

const windows = []

const makeWindow = (state) => {
  const win = new BrowserWindow({
    width: 1200,
    // skipTaskBar: true,
    // alwaysOnTop: true,
    // frame: false,
    titleBarStyle: 'hidden-inset',
    fullscreenable: false,
    title: 'NotableMind',
    height: 800,
    icon: path.join(__dirname, '../icon256.png'),
  });
  win.on('closed', function() {
    windows.splice(windows.indexOf(win), 1)
  });
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
    win.webContents.executeJavaScript(`document.body.innerHTML = "<div style='text-align:center;padding:100px'>Failed to load - you need to start the server</div>"`)
  })

  const localURL = 'http://localhost:4151'
  const localFile = 'file://' + state.publicDir + '/index.html'
  if (process.env.NODE_ENV === 'development') {
    win.loadURL(localURL);
  } else {
    win.loadURL(localFile);
  }
  windows.push(win)
  return win
}

module.exports = makeWindow
