// electron-main

const path = require('path')
const fs = require('fs')

const fetch = require('isomorphic-fetch')

const {googleApiKey} = require('../../../../../shared/secret.json')
const googleLogin = require('./googleLogin')

const saveData = (documentsDir, token) => {
  const savedPath = path.join(documentsDir, 'user.json')
  fs.writeFileSync(savedPath, JSON.stringify(token))
}

const getSavedData = documentsDir => {
  const savedPath = path.join(documentsDir, 'user.json')
  return new Promise((res, rej) => {
    fs.readFile(savedPath, 'utf8', (err, data) => {
      if (err) {
        console.log('nope load', err)
        return res(null) // assume not there
      }
      try {
        res(JSON.parse(data))
      } catch (e) {
        console.error('restoring user')
        console.error(e)
        return res(null)
      }
    })
  })
}

const restoreUser = (token, documentsDir) => {
  // console.log('restoring', token)
  if (token.expires_at > Date.now()) {
    return getProfile(token)
  } else {
    return googleLogin
      .refresh(token)
      .then(token => {
        if (!token) {
          throw new Error('unable to refresh')
        }
        return token
      })
      .then(addExpiresAt)
      .then(token => (saveData(documentsDir, token), token))
      .then(getProfile)
  }
}

const kwds = obj =>
  Object.keys(obj)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
    .join('&')

const listFiles = token => {
  const query = kwds({
    pageSize: 1000,
    fields: 'files(id, name, appProperties, version, size, trashed)',
    q: `appProperties has { key='nmType' and value='doc' }`
  })
  return fetch(`https://www.googleapis.com/drive/v3/files?${query}`, {
    headers: {
      Authorization: 'Bearer ' + token.access_token
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        throw new Error('Error getting files: ' + JSON.stringify(data.error))
      }
      return data.files
    })
}

const getProfile = token => {
  return fetch(
    `https://www.googleapis.com/plus/v1/people/me?key=${googleApiKey}`,
    {
      headers: {
        Authorization: 'Bearer ' + token.access_token
      }
    }
  )
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        console.error('failed to get user', data, googleApiKey, token)
        throw new Error('Unable to login w/ google')
      }
      return {
        name: data.displayName,
        profile: data.image.url,
        email: data.emails[0] && data.emails[0].value,
        token
      }
    })
}

const getUser = documentsDir => {
  return getSavedData(documentsDir).then(
    saved => (saved ? restoreUser(saved, documentsDir) : null)
  )
}

const addExpiresAt = token =>
  ((token.expires_at = Date.now() + token.expires_in * 1000), token)

const signIn = documentsDir => {
  return (
    googleLogin
      .authorize()
      // .then(token => (console.log('SIGN IN TOKEN', token), token))
      .then(addExpiresAt)
      .then(token => (saveData(documentsDir, token), token))
      .then(getProfile)
  )
}

module.exports = {
  signIn,
  getUser,
  listFiles
}
