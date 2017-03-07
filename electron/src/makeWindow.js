'use strict';

const {BrowserWindow} = require('electron')

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
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:4151');
  } else {
    win.loadURL('file://' + state.publicDir + '/index.html');
  }
  windows.push(win)
  win.on('closed', function() {
    windows.splice(windows.indexOf(win), 1)
  });
}

module.exports = makeWindow
