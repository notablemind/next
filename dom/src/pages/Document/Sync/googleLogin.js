
const electronOauth2 = require('electron-oauth2');

const {googleClientId} = require('../../../../../shared/config.json')
const {googleClientSecret} = require('../../../../../shared/secret.json')

const electronGoogleOauth = require('electron-google-oauth')

const scopes = [
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
]

const authorize = () => {

  var config = {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://www.googleapis.com/oauth2/v4/token',
      useBasicAuthorizationHeader: false,
      redirectUri: 'http://localhost:4150/'
  };

  const windowParams = {
    alwaysOnTop: true,
    autoHideMenuBar: true,
    webPreferences: {
        nodeIntegration: false
    }
  }

  const options = {
    scope: scopes.join(' '),
    accessType: 'offline',
  };

  const myApiOauth = electronOauth2(config, windowParams);

  return myApiOauth.getAccessToken(options)
}

const refresh = (token) => {

  var config = {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://www.googleapis.com/oauth2/v4/token',
      useBasicAuthorizationHeader: false,
      redirectUri: 'http://localhost:4150/'
  };

  const windowParams = {
    alwaysOnTop: true,
    autoHideMenuBar: true,
    webPreferences: {
        nodeIntegration: false
    }
  }

  const myApiOauth = electronOauth2(config, windowParams);
  return myApiOauth.refreshToken(token.refresh_token)
}

module.exports = {authorize, refresh}
