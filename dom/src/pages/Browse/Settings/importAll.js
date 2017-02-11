
type File: any
type Result = {
  file: {
    _id: string,
    title: string,
    type: string,
    parent: string,
    size: number,
    modified: number,
    opened: number,
  },
  contents: {[key: string]: any},
}

export default (file: File): Promise<Result[]> => {
  const zip = new JSZip()
  return zip.loadAsync(file).then(zip => {
    const docs = []
    zip.forEach((relPath, file) => {
      const pathParts = relPath.split('/')
      if (pathParts.length > 1) return
      const byName = {}
      zip.folder(relPath).forEach((name, file) => {
        byName[name] = file
      })
      const parts = relPath.split(' - ')
      const id = parts[parts.length - 1]
      const title = parts.slice(0, -1).join(' - ')
      docs.push({byName, title, id})
    })

    return Promise.all(docs.map(doc => {
      return doc.byName['contents.nm'].async('string').then(text => {
        let contents
        try {
          contents = JSON.parse(text)
        } catch (e) {
          console.log('Failed to parse', {text})
        }
        const attachmentsById = {}
        Object.keys(doc.byName).forEach(name => {
          const [id, ext] = name.split('.')
          if (id !== 'contents') {
            attachmentsById[id] = doc.byName[name]
          }
        })
        const rootText = contents.root.content
        return Promise.all(Object.keys(contents).map(nid => {
          if (!contents[nid]._attachments) return null
          return Promise.all(Object.keys(contents[nid]._attachments).map(aid => {
            const att = contents[nid]._attachments[aid]
            if (attachmentsById[aid]) {
              return attachmentsById[aid].async('uint8array').then(array => {
                att.data = new Blob(array, {type: att.content_type})
                return true
              })
            } else {
              console.log('missing an attachment')
              return null
            }
          }))
        })).then(() => {
          return {
            file: {
              title: rootText,
              type: 'doc',
              parent: 'root',
              size: Object.keys(contents).length,
              modified: Date.now(),
              opened: Date.now(),
              _id: id,
            },
            contents,
          }
        })
      })
    }))
  })
}

