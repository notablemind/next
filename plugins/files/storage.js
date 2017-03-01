
let loadFiles
let saveFiles
let updateFile

if (ELECTRON) {
  const {ipcRenderer} = require('electron')
  loadFiles = () => {
    return new Promise((res, rej) => {
      setTimeout(() => rej(new Error('timeout')), 500)
      ipcRenderer.once('meta', (evt, files) => {
        res(files)
      })
      ipcRenderer.send('meta:load')
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
    ipcRenderer.send('meta:saveall', files)
  }
  updateFile = (files, id, update) => {
    files[id] = {...files[id], ...update}
    ipcRenderer.send('meta:update', id, update)
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
  saveFiles = files => localStorage[LS_KEY] = JSON.stringify(files)
  updateFile = (files, id, update) => {
    files[id] = {...files[id], ...update}
    saveFiles(files)
  }
}

export {loadFiles, saveFiles, updateFile}
