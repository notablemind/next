
import {googleClientId} from '../../../../shared/config.json'
import type {User} from './types'
import googleWrapper from './googleWrapper'

const USER_KEY = 'notablemind:user:google'
const scopes = [
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
]


export const loadUser = () => {
  let val = localStorage[USER_KEY]
  try {
    return val ? JSON.parse(val) : null
  } catch (e) {
    return null
  }
}

const saveUser = (user: User) => {
  localStorage[USER_KEY] = JSON.stringify(user)
}

const clearUser = () => {
  localStorage[USER_KEY] = ''
}

let returning = null

export const getSession = (done: Function) => {
  console.log('getting session')
  googleWrapper({
    clientId: googleClientId,
    scopes,
  }).then(
    user => {
      done(null, new Session(user))
    },
    err => done(err)
  )
}






export const _getSession = (done: Function) => {
  if (returning) {
    return finishLogin(returning, done)
  }
  const user = loadUser()
  if (!user) return setTimeout(() => done('logged out'), 0)
  // ummmm what do I do with this then... maybe check the profile or sth
  console.log('gots a user')
}

const finishLogin = (data, done) => {
  console.log('finishing login I think', data)
}

// called on return to the page from google oauth
export const checkForReturn = () => {
  if (location.hash.indexOf('access_token') !== -1) {
    const args = location.hash.slice(1).split('&')
    const data = args.reduce((obj, item) => {
      const [name, val] = item.split('=')
      obj[name] = decodeURIComponent(val)
      return obj
    }, {})

    console.log('got it', data)
    location.hash = data.state
    returning = data
  }
}

const oauthUrl = ({clientId, redirectUri, scopes}) =>
  `https://accounts.google.com/o/oauth2/v2/auth?
    response_type=token&
    state=${encodeURIComponent(location.hash)}&
    scope=${encodeURIComponent(scopes.join(' '))}&
    redirect_uri=${encodeURIComponent(redirectUri)}&
    client_id=${encodeURIComponent(clientId)}`.replace(/\n\s*/g, '')

export const login = () => {
  const uri = oauthUrl({
    clientId: googleClientId,
    scopes: scopes,
    redirectUri: 'http://localhost:4150/',
  })
  window.location = uri
}

class Session {
  user: User
  constructor(user) {
    this.user = user
  }

  sync(userDb: any) {
    gapi.client.files.list({
      spaces: 'appDataFolder',
    }).then(res => {
      console.log('list files', res)
    })
  }

  syncDoc(docDb: any, id: string, onStateChange: Function): () => void {
  }

  logout() {
    this.db.logout()
    clearUser()
  }
}

