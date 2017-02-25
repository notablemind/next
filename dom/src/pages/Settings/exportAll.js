// @flow

// import Treed from 'treed'
import Database from 'treed/Database'
import JSZip from 'jszip'
import getFileDb from '../utils/getFileDb'

type File = {id: string, title: string}

const pouchFromJsonAndBlobs = (pouch, json, blobs) => {
  const docs = Object.keys(json).map(id => {
    const doc = json[id]
    if (doc._attachments) {
      Object.keys(doc._attachments).forEach(aid => {
        doc._attachments[aid].data = blobs[aid]
      })
    }
    return doc
  })
  return pouch.bulkDocs({docs, new_edits: false})
}

const pouchToJsonAndBlobs = (pouch) => {
  return pouch.allDocs({
    include_docs: true,
    attachments: true,
    binary: true,
  }).then(({rows}) => {
    const blobs = {}
    const json = {}
    rows.forEach(({doc}) => {
      if (doc._attachments) {
        Object.keys(doc._attachments).forEach(id => {
          blobs[id] = doc._attachments[id].data
          doc._attachments[id].data = null
        })
      }
      json[doc._id] = doc
    })
    return {json, blobs}
  })
}

const extForMime = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'text/plain': 'txt',
  'text/html': 'html',
  'application/json': 'json',
  'text/javascript': 'js',
  // TODO flesh this out?
}

export default (files: Array<File>) => {
  return Promise.all(files.map(file => {
    return getFileDb(file.id).then(pdb => {
      return pouchToJsonAndBlobs(pdb).then(({json, blobs}) => {
        pdb.close()
        return {
          id: file.id,
          title: file.title,
          json,
          blobs,
        }
      })
    })
  })).then(dumped => {
    const zip = new JSZip()
    const dir = zip.folder('ExportedDocuments')
    dumped.forEach(dump => {
      const sub = dir.folder(`${dump.title.replace('/', '-')} - ${dump.id}`)
      sub.file(`contents.nm`, JSON.stringify(dump.json))
      Object.keys(dump.blobs).forEach(aid => {
        // TODO maybe prepend w/ the original file name if we have it?
        const ext = extForMime[dump.blobs[aid].type] || '.attachment'
        sub.file(`${aid}.${ext}`, dump.blobs[aid])
      })
    })
    console.log('ok', zip)
    return zip.generateAsync({type: 'blob'})
  })
}

