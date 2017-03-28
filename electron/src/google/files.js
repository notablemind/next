// @flow

const fetch = require('isomorphic-fetch')
const upload = require('./upload')

const kwds = obj => Object.keys(obj).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k].toString())}`).join('&')

const listFiles = (token/*: {access_token: string}*/) => {
  const query = kwds({
    pageSize: 1000,
    fields: 'files(id, name, appProperties, version, size, trashed)',
    q: `appProperties has { key='nmType' and value='doc' }`,
  })
  return fetch(`https://www.googleapis.com/drive/v3/files?${query}`, {
    headers: {
      'Authorization': 'Bearer ' + token.access_token,
    },
  }).then(res => res.json())
    .then(data => {
      if (data.error) {
        throw new Error('Error getting files: ' + JSON.stringify(data.error))
      }
      return data.files
    })
}

// file setup:
// My Fancy Document // a folder w/ nmType=doc, nmId=the doc id
//   contents.json // nmType=contents, nmId=the doc id
//   meta.json // nmType=meta, nmId=the doc id, this just has {id: the doc id, owner: email address}
//     this is just so that documents that are exported out of google drive
//     can retain their identity
//   attachments/
//     {uuid}_{contents sanitized and chopped to ~50 chars}.{png/jpg/pdf/etc}

const getRootFolder = (token) => {
}

const createDocFolder = (token, root, id) => {
  return fetch(`https://www.googleapis.com/drive/v3/files`, {
    headers: {
      'Authorization': 'Bearer ' + token.access_token,
      'Content-type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      appProperties: {nmId: id, nmType: 'doc'},
      mimeType: 'application/vnd.google-apps.folder',
      parents: [root],
      name: name,
    }),
  }).then(res => res.json())
}

const createFile = (token/*: {access_token: string}*/, root/*: string*/, {id, data, title}/*: {id: string, title: string, data: Array<{}>}*/) => {
  return findDoc(token, id).then(doc => {
    if (doc) throw new Error(`Trying to create ${id} but it already exists`)
    return createDocFolder(token, root, id).then(folderId => {
      return Promise.all([
        createMeta(token, folderId, id),
        createContents(token, folderId, id, data)
      ]).then(([metaId, contentsId]) => {
        return {folderId, metaId}
      })
    })
  })
}

const contentsForFile = (token/*: {access_token: string}*/, id/*: string*/) => {
  // TODO implement
  debugger
  throw new Error('not impl')
}

module.exports = {
  listFiles,
  createFile,
  contentsForFile,
}

