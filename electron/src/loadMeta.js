const path = require('path')
const fs = require('fs')

const loadMeta = (documentsDir /*: Meta*/) => {
  const metaPath = path.join(documentsDir, 'meta.json')
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'))
  } catch (err) {
    return {
      home: {
        id: 'home',
        lastModified: Date.now(),
        lastOpened: Date.now(),
        size: 1,
        sync: null,
        title: 'Home'
      }
    }
  }
}

module.exports = loadMeta
