// @flow

const fetch = require('isomorphic-fetch')
const upload = require('./upload')

const kwds = obj => obj ? Object.keys(obj).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k].toString())}`).join('&') : ''

const apiCall = (token, api, query=null) => {
  return fetch(`https://www.googleapis.com/drive/v3/${api}?${kwds(query)}`, {
    headers: {
      'Authorization': 'Bearer ' + token.access_token,
    },
  }).then(res => res.json())
}

const queryFiles = (token, query) => {
  return fetch(`https://www.googleapis.com/drive/v3/files?${kwds(query)}`, {
    headers: {
      'Authorization': 'Bearer ' + token.access_token,
    },
  }).then(res => res.json())
    .then(data => {
      if (data.error) {
        console.log('Failing query w/ error!!', query, data.error)
        throw new Error('Error getting files: ' + JSON.stringify(data.error))
      }
      return data.files
    }, err => {
      console.log('Failing query!!', query)
      throw err
    })
}

const listFiles = (token/*: {access_token: string}*/) => {
  return queryFiles(token, {
    pageSize: 1000,
    fields: 'files(id, name, appProperties, version, size, trashed)',
    q: `appProperties has { key='nmType' and value='doc' }`,
  })
}

const findDoc = (token, id) => {
  return queryFiles(token, {
    pageSize: 1,
    fields: 'files(id, name, appProperties, version, size, trashed)',
    q: `appProperties has { key='nmId' and value='${id}' } and appProperties has { key='nmType' and value='doc' }`,
  }).then(files => files.length ? files[0] : null)
}


// file setup:
// My Fancy Document // a folder w/ nmType=doc, nmId=the doc id
//   contents.json // nmType=contents, nmId=the doc id
//   meta.json // nmType=meta, nmId=the doc id, this just has {id: the doc id, owner: email address}
//     this is just so that documents that are exported out of google drive
//     can retain their identity
//   attachments/
//     {uuid}_{contents sanitized and chopped to ~50 chars}.{png/jpg/pdf/etc}

const ROOT_NAME = 'Notablemind Files'

const getRootDirectory = (token) => {
  return queryFiles(token, {
    pageSize: 1,
    fields: 'files(id, name, appProperties, version, size, trashed)',
    q: `name = '${ROOT_NAME}' and appProperties has { key='nmType' and value='root' } and trashed = false`,
  }).then(files => {
    if (!files.length) {
      return createRootDirectory(token)
    }
    return files[0]
  })
}

const createFileSimple = (token, config) => {
  return fetch(`https://www.googleapis.com/drive/v3/files`, {
    headers: {
      'Authorization': 'Bearer ' + token.access_token,
      'Content-type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(config),
  }).then(res => res.json())
}

const createRootDirectory = (token) => {
  return createFileSimple(token, {
    appProperties: {nmType: 'root'},
    mimeType: 'application/vnd.google-apps.folder',
    parents: [],
    name: ROOT_NAME,
  })
}

const createDocFolder = (token, root, id, title) => {
  return createFileSimple(token, {
    appProperties: {nmId: id, nmType: 'doc'},
    mimeType: 'application/vnd.google-apps.folder',
    parents: [root],
    name: title,
  })
}

const createMeta = (token, folder, id) => {
  return upload(token, {
    appProperties: {nmId: id, nmType: 'meta'},
    mimeType: 'application/json',
    parents: [folder],
    name: 'meta.json',
  }, JSON.stringify({id}))
}

const VERSION = '2.0'

const createContents = (token, folder, id, data) => {
  return upload(token, {
    appProperties: {nmId: id, nmType: 'contents'},
    mimeType: 'application/json',
    parents: [folder],
    name: 'contents.json',
  }, JSON.stringify({
    type: 'notablemind',
    version: VERSION,
    attachmentMode: 'inline', // or 'separate', in which case they're in files in the same dir
    data,
  }))
}

const createFile = (token/*: {access_token: string}*/, root/*: string*/, {id, data, title}/*: {id: string, title: string, data: Array<{}>}*/) => {
  return findDoc(token, id).then(doc => {
    // TODO don't throw here tho - I should be able to just roll with it.
    if (doc) throw new Error(`Trying to create ${id} but it already exists`)
    return createDocFolder(token, root, id, title).then(folder => {
      return Promise.all([
        createMeta(token, folder.id, id),
        createContents(token, folder.id, id, data)
      ]).then(([meta, contents]) => {
        return {meta, contents, folder}
      })
    })
  })
}

const contentsForFile = (token/*: {access_token: string}*/, file/*: {id: string}*/) => {
  // TODO implement
  debugger
  throw new Error('not impl')
}

const metaForFile = (token, file/*: {id: string}*/) => {
  return apiCall(token, 'files/' + file.id)
}

const updateContents = (token, file, data) => {
  return fetch(`https://www.googleapis.com/upload/drive/v3/files/${file.id}?uploadType=media`, {
    method: 'PATH',
    body: JSON.stringify(data),
    headers: {
      'Content-type': 'application/json',
      'Authorization': 'Bearer ' + token.access_token,
    },
  }).then(r => r.json())
}

/*
const createFile = (token, parent, data) => {
  return upload(token, {
    appProperties: {nmId: id, nmType: 'contents'},
    mimeType: 'application/json',
    parents: [folder],
    name: 'contents.json',
  }, JSON.stringify(data))
}
*/

module.exports = {
  listFiles,
  createFile,
  getRootDirectory,

  metaForFile,
  contentsForFile,
  updateContents,
}

