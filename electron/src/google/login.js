// @flow

const {googleClientId} = require('../../../shared/config.json')
const {googleClientSecret} = require('../../../shared/secret.json')

const qs = require('querystring')
const {parse: urlParse} = require('url')
const extend = require('extend')

const {BrowserWindow} = require('electron')

const checkNotNull = function(/*<T>*/ val /*: ?T*/) /*: T*/ {
  if (val == null) throw new Error('Not null assertion')
  return val
}

var config = {
  clientId: googleClientId,
  clientSecret: googleClientSecret,
  authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://www.googleapis.com/oauth2/v4/token',
  useBasicAuthorizationHeader: false,
  redirectUri: 'http://localhost:4150/'
}

const scopes = [
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata'
]

const windowParams = {
  alwaysOnTop: true,
  autoHideMenuBar: true,
  'use-content-size': true,
  useContentSize: true,
  webPreferences: {
    nodeIntegration: false
  }
}

const getAuthCode = () => {
  const authUrl =
    config.authorizationUrl +
    '?' +
    qs.stringify({
      response_type: 'code',
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes.join(' ')
    })
  return new Promise((res, rej) => {
    const win = new BrowserWindow(windowParams)

    win.on('closed', () => rej(new Error('window was closed')))

    const done = () => {
      win.removeAllListeners('closed')
      setImmediate(() => win.close())
    }

    const nav = url => {
      const {code, error} = checkNotNull(urlParse(url, true).query)

      if (error) {
        rej(error)
        done()
      } else if (code) {
        res(code)
        done()
      }
    }

    win.webContents.on('will-navigate', (_, url) => nav(url))
    win.webContents.on('did-get-redirect-request', (_, old, url) => nav(url))

    win.loadURL(authUrl)
    win.show()
  })
}

const getToken = data => {
  const query = extend(
    {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri
    },
    data
  )

  return fetch(config.tokenUrl, {
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/x-www-form-urlencoded'
    },
    method: 'POST',
    body: qs.stringify(query)
  })
    .then(res => res.json())
    .then(data => {
      // console.log('got token DATA >>> ', data)
      return data
    })
}

const getNewToken = code => {
  return getToken({
    code,
    grant_type: 'authorization_code'
  })
}

const authorize = () =>
  getAuthCode().then(getNewToken).then(token => {
    if (token.error || !token.access_token) throw new Error(token.error)
    return token
  })

const refresh = (token /*: {refresh_token: string, access_token: string}*/) =>
  getToken({
    refresh_token: token.refresh_token,
    grant_type: 'refresh_token'
  }).then(ntoken => {
    if (ntoken.error || !ntoken.access_token) throw new Error(ntoken.error)
    ntoken.refresh_token = token.refresh_token
    return ntoken
  })

module.exports = {authorize, refresh}
