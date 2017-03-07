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

const restoreUser = token => {
  console.log('restoring', token)
  return getProfile(token)
}

const getProfile = token => {
  return fetch(`https://www.googleapis.com/plus/v1/people/me?key=${googleApiKey}`, {
    headers: {
      'Authorization': 'Bearer ' + token.access_token,
    },
  }).then(res => res.json())
    .then(data => {
      if (data.error) {
        console.error('failed to get user', data)
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

const getUser = (documentsDir) => {
  return getSavedData(documentsDir)
    .then(saved => saved ? restoreUser(saved) : null)
}

const signIn = (documentsDir) => {
  return googleLogin.authorize()
    .then(token => (saveData(documentsDir, token), token))
    .then(getProfile)
    // .then(user => { })
}

module.exports = {
  signIn,
  getUser,
}

