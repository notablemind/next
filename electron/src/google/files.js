// @flow

const fetch = require('isomorphic-fetch')

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

const createFile = (token/*: {access_token: string}*/, {id, data}/*: {id: string, data: any}*/) => {
  // TODO implement
  debugger
  throw new Error('not impl')
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

