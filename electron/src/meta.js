const path = require('path')
const fs = require('fs')
const child_process = require('child_process')

module.exports = ({documentsDir, actions}) => {
  const META = path.join(documentsDir, 'meta.json')
  const saveFiles = () =>
    fs.writeFileSync(META, JSON.stringify(meta, null, 2), 'utf8')
  let meta = JSON.parse(fs.readFileSync(META, 'utf8'))

  Object.assign(actions, {
    deleteFiles(ids) {
      ids.forEach(id => {
        delete meta[id]
      })
      saveFiles()
      ids.forEach(id => {
        const cmd = `rm -rf ${documentsDir}/${id}`
        console.log('deleting file', cmd)
        child_process.execSync(cmd)
      })
    },

    syncFiles(ids) {
      // TODO figure out what to do here.
      return Promise.resolve()
    },

    getMeta() {
      return meta
    },

    importMeta() {
      for (let id in newfiles) {
        meta[id] = newfiles[id]
      }
      saveFiles()
    },

    updateMeta(id, update) {
      console.log('update meta', id, update)
      meta[id] = Object.assign({}, meta[id], update)
      saveFiles()
    },
  })
}

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
