
const ext = (a, b) => {
  const c = {}
  for (let n in a) c[n] = a[n]
  for (let n in b) c[n] = b[n]
  return c
}

const PLUGIN_ID = 'files'

const plugin = {
  id: PLUGIN_ID,

  init: ({baseDir, documentsDir, ipcMain}) => {
    const path = require('path')
    const fs = require('fs')

    const META = path.join(documentsDir, 'meta.json')
    let meta = JSON.parse(fs.readFileSync(META, 'utf8'))
    const saveFiles = () => fs.writeFileSync(META, JSON.stringify(meta, null, 2), 'utf8')

    ipcMain.on('meta:load', evt => {
      evt.sender.send('meta', meta)
    })
    ipcMain.on('meta:saveall', (evt, newfiles) => {
      for (let id in newfiles) {
        meta[id] = newfiles[id]
      }
      saveFiles()
    })
    ipcMain.on('meta:update', (evt, id, update) => {
      meta[id] = ext(meta[id], update)
      saveFiles()
    })
    return {meta}
  },
}

module.exports = plugin
