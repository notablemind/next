
let loadFiles
let saveFiles
let updateFile
let onChange

if (ELECTRON) {
  const {ipcRenderer} = require('electron')
  const uid = Math.random().toString(16).slice(2)
  loadFiles = () => {
    return new Promise((res, rej) => {
      setTimeout(() => rej(new Error('timeout')), 500)
      ipcRenderer.once('meta', (evt, files) => {
        res(files)
      })
      ipcRenderer.send('meta:load', uid)
    })
  }
  onChange = (fnupdate, fnall) => {
    ipcRenderer.on('meta:update', (evt, id, update) => {
      console.log('got update', id, update)
      fnupdate(id, update)
    })
    ipcRenderer.on('meta', (evt, newfiles) => {
      console.log('got full meta', newfiles)
      fnall(newfiles)
    })
  }
  /** TODO need to react to changes from other windows
  ipcRenderer.on('meta:changed', (evt, newfiles) => {
    for (let id in newfiles) {
      files[id] = newfiles[id]
    }
  })
  */
  saveFiles = (files) => {
    ipcRenderer.send('meta:saveall', uid, files)
  }
  updateFile = (files, id, update) => {
    files[id] = {...files[id], ...update}
    ipcRenderer.send('meta:update', uid, id, update)
  }
} else {
  const LS_KEY = 'nm:files'
  loadFiles = () => {
    try {
      return JSON.parse(localStorage[LS_KEY] || '')
    } catch (e) {
      return null
    }
  }
  onChange = () => {} // noop
  saveFiles = files => localStorage[LS_KEY] = JSON.stringify(files)
  updateFile = (files, id, update) => {
    files[id] = {...files[id], ...update}
    saveFiles(files)
  }
}

export {loadFiles, saveFiles, updateFile, onChange}
