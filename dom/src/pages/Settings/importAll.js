// @flow

import JSZip from 'jszip'

type File = any
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
    // We expect to be 2-nested
    zip.forEach((relPath, file) => {
      const pathParts = relPath.split('/')
      if (pathParts.length !== 3 || pathParts[2] !== '') return
      console.log('folder', relPath)
      const byName = {}
      zip.folder(relPath).forEach((name, file) => {
        byName[name] = file
      })
      const parts = pathParts[1].split(' - ')
      const id = parts[parts.length - 1]
      const title = parts.slice(0, -1).join(' - ')
      console.log('got', title, id, byName)
      docs.push({byName, title, id})
    })

    return Promise.all(docs.map(doc => {
      console.log('processing', doc.title)
      const contents = doc.byName['contents.nm']
        ? doc.byName['contents.nm'].async('string')
        : Promise.resolve('{}')
      return contents.then(text => {
        console.log('have contents for', doc.title)
        let contents
        try {
          contents = JSON.parse(text)
        } catch (e) {
          console.log('Failed to parse', {text})
          throw new Error('Failed to parse ' + doc.title)
        }
        const attachmentsById = {}
        Object.keys(doc.byName).forEach(name => {
          const [id, ext] = name.split('.')
          if (id !== 'contents') {
            attachmentsById[id] = doc.byName[name]
          }
        })

        const rootText = contents.root ? contents.root.content : doc.title
        return {
          file: {
            title: rootText,
            size: Object.keys(contents).length,
            modified: Date.now(),
            opened: Date.now(),
            _id: doc.id,
          },
          getContents() {
            const withAttachments = []
            const withoutAttachments = []
            Object.keys(contents).forEach(nid => {
              if (!contents[nid]._attachments) {
                withoutAttachments.push(contents[nid])
                return
              } else {
                withAttachments.push(() => {
                  // Umm so I really hope this lets us cleanup memory?
                  const node = {...contents[nid]}
                  node._attachments = {...node._attachments}
                  return Promise.all(Object.keys(node._attachments).map(aid => {
                    const att = node._attachments[aid] = {...node._attachments[aid]}
                    if (attachmentsById[aid]) {
                      return attachmentsById[aid].async('base64').then(array => {
                        att.data = array // new Blob([array], {type: att.content_type})
                        // uint8array
                        // att.data = new Blob(array, {type: att.content_type})
                        return true
                      })
                    } else {
                      console.log('missing an attachment', doc.title, aid)
                      return null
                    }
                  })).then(() => node)
                })
              }
            })
            return {withAttachments, withoutAttachments}
          },
        }

      })
    }))
  })
}

