// @flow

const fetch = require('isomorphic-fetch')
const path = require('path')
const fs = require('fs')

const {googleApiKey} = require('../../../shared/secret.json')
const googleLogin = require('./login')
const files = require('./files')

/*
type User = {
  name: string,
  email: string,
  profile: string,
  token: {
    access_token: string,
    refresh_token: string,
    expires_at: number,
  }
}
*/

const saveData = (documentsDir/*: string*/, token/*: any*/) => {
  const savedPath = path.join(documentsDir, 'user.json')
  fs.writeFileSync(savedPath, JSON.stringify(token))
}

const getSavedData = (documentsDir) => {
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

const addExpiresAt = token => (token.expires_at = Date.now() + token.expires_in * 1000, token)

const getProfile = token => {
  return fetch(`https://www.googleapis.com/plus/v1/people/me?key=${googleApiKey}`, {
    headers: {
      'Authorization': 'Bearer ' + token.access_token,
    },
  }).then(res => res.json())
    .then(data => {
      if (data.error) {
        console.error('failed to get user', data, googleApiKey, token)
        throw new Error('Unable to login w/ google')
      }
      return {
        name: data.displayName,
        profile: data.image.url,
        email: data.emails[0] && data.emails[0].value,
        token,
      }
    })
}

const login = (documentsDir/*: string*/) => {
  return googleLogin.authorize()
    .then(addExpiresAt)
    .then(token => (saveData(documentsDir, token), token))
    .then(getProfile)
}

const restoreUser = (documentsDir/*: string*/) => {
  return getSavedData(documentsDir)
    .then(saved => saved ? getOrRefreshUser(saved, documentsDir) : null)
}

const getOrRefreshUser = (token/*: {expires_at: number, access_token: string, refresh_token: string}*/, documentsDir/*: string*/) => {
  console.log('restoring', token)
  if (token.expires_at > Date.now()) {
    return getProfile(token)
  } else {
    return refreshToken(token, documentsDir)
  }
}

const refreshToken = (token, documentsDir) => {
  return googleLogin.refresh(token)
    .then(token => {if (!token) {throw new Error('unable to refresh')} return token})
    .then(addExpiresAt)
    .then(token => (saveData(documentsDir, token), token))
    .then(getProfile)
}

module.exports = Object.assign({
  restoreUser,
  refreshToken,
  login,
}, files)

