
const ext = (a, b) => {
  const c = {}
  for (let n in a) c[n] = a[n]
  for (let n in b) c[n] = b[n]
  return c
}

const PLUGIN_ID = 'files'

const uuid = () => Math.random().toString(16).slice(2)

const plugin = {
  id: PLUGIN_ID,

  init: ({baseDir, documentsDir, ipcMain}) => {
    console.log('files electron')
    const path = require('path')
    const fs = require('fs')
    const listeners = {}

    const META = path.join(documentsDir, 'meta.json')
    let meta = JSON.parse(fs.readFileSync(META, 'utf8'))
    const saveFiles = () => fs.writeFileSync(META, JSON.stringify(meta, null, 2), 'utf8')

    ipcMain.on('meta:load', (evt, uid) => {
      listeners[uid] = evt.sender
      evt.sender.on('destroyed', () => {
        delete listeners[uid]
      })
      evt.sender.send('meta', meta)
    })
    ipcMain.on('meta:saveall', (evt, uid, newfiles) => {
      for (let id in newfiles) {
        meta[id] = newfiles[id]
      }
      saveFiles()
      Object.keys(listeners).forEach(mid => {
        if (mid !== uid) listeners[mid].send('meta', meta)
      })
    })
    ipcMain.on('meta:update', (evt, uid, id, update) => {
      console.log('update meta', id, update)
      meta[id] = ext(meta[id], update)
      saveFiles()
      Object.keys(listeners).forEach(mid => {
        if (mid !== uid) listeners[mid].send('meta:update', id, update)
      })
    })
    return {meta, listeners}
  },
}

module.exports = plugin

    /*
    if (files === null) {
      let files = {}
      const nodes = globalStore.db.data
      const ids = []
      const updates = []
      Object.keys(nodes).forEach(id => {
        if (nodes[id].type === 'file') {
          files[id] = {
            id,
            title: nodes[id].content,
            lastOpened: Date.now(),
            lastModified: Date.now(),
            size: 0,
            sync: null,
            / *
            {
              owner: 'xxuseridxx',
              latestVersion: 2,
              lastUploaded: Date.now(),
            }
            * /
          }
          updates.push({types: {
            ...nodes[id].types,
            file: {
              fileid: id,
            }
          }})
          ids.push(id)
        }
      })
      globalStore.actions.updateMany(ids, updates)
      storage.saveFiles(files)
      return {files, addFile: addFile.bind(null, files)}
    }*/
