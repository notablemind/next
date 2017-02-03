// @flow

import PouchDB from 'pouchdb'
import {apiURL, dbURL} from '../../../../shared/config.json'
import uuid from '../../utils/uuid'

import type {User} from './types'

export class UserNotFound extends Error {}
export class NetworkError extends Error {}
export class InvalidPassword extends Error {}

const USER_KEY = 'notablemind:user'

class Session {
  user: User
  db: any
  constructor(user, remoteUserDb) {
    this.user = user
    this.db = remoteUserDb
  }

  sync(userDb: any) {
    userDb.sync(this.db, {
      live: true,
      retry: true,
    })
  }

  syncDoc(docDb: any, id: string, onStateChange: Function) {
    const doc = `doc_${this.user.id}_${id}`
    let sync
    ensureDocDb(doc).then(remoteDb => {
      sync = docDb.sync(remoteDb, {retry: true})
        .on('error', e => onStateChange('error'))
        .on('complete', () => {
          onStateChange('synced')

          sync = docDb.sync(remoteDb, {live: true, retry: true})
            .on('error', e => onStateChange('error'))
        })
    })
    return () => {
      if (sync) {
        sync.cancel()
      }
    }
  }

  logout() {
    this.db.logout()
    clearUser()
  }
}


const getSession = (id, remoteUserDb) => {
  return remoteUserDb.getUser(id).then(
    res => {
      const user = {
        id,
        email: res.email,
        realName: res.realName,
      }
      return new Session(user, remoteUserDb)
    }
  )
}



export const ensureUserDb = (): Promise<void> => {
  return fetch(`${apiURL}/api/ensure-user`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
  }).then(res => {
    if (res.status == 401) {
      throw new Error('failed to login')
    }
  })
}

export const ensureDocDb = (id: string) => {
  return fetch(`${apiURL}/api/create-doc?id=${id}`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
  }).then(res => new PouchDB(`${dbURL}/${id}`))
}

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

export const restoreFromUser = (user: User, done: Function) => {
  const remoteUserDb = new PouchDB(`${dbURL}/user_${user.id}`)
  remoteUserDb.getSession((err, res) => {
    if (err) {
      console.log('network error', err)
      // TODO try to connect periodically.
      done('network')
      return
    }

    if (!res.userCtx || res.userCtx.name !== user.id) {
      clearUser()
      done('invalid')
      return
    }

    ensureUserDb().then(
      res => done(null, new Session(user, remoteUserDb)),
      err => {
        if (err) {
          clearUser()
          done('invalid')
          return
        }
      }
    )
  })
}

const userByEmail = (email: string): Promise<string> => {
  return fetch(`${apiURL}/api/user-by-email?email=${email}`)
    .then(res => {
      if (res.status === 404) {
        throw new Error('User not found')
      }
      return res.json()
    }).then(res => res.id)
}

// This is to establish our auth credentials w/ the api server, in addition to
// the db server
const authWithApiServer = (id: string, pwd: string): Promise<void> => {
  const remoteApiDb = new PouchDB(`${apiURL}/user_${id}`)
  return remoteApiDb.getSession()
    .catch(err => { throw new NetworkError() })
    .then(res => {
      // already have a valid session
      if (res.userCtx && res.userCtx.name === id) { return }
      return remoteApiDb.login(id, pwd)
        .catch(err => {
          if (err && err.name === 'unauthorized') {
            throw new InvalidPassword()
          }
          if (err) {
            throw new NetworkError()
          }
        })
        .then(response => {
          if (response.ok && response.name === id) {
            return
          }
          console.error('unexpected error')
          throw new Error('Unexpected response')
        })
      })
}

export const signup = (
  name: string, email: string, pwd: string
): Promise<any> => {
  const id = uuid()
  const remoteUserDb = new PouchDB(`${dbURL}/user_${id}`, {skipSetup: true})
  return remoteUserDb.signup(id, pwd, {
    metadata: {email, realName: name}
  }).then(res => {
    console.log(res)
    return new Session({id, realName: name, email}, remoteUserDb)
  })
}

type Done = Function // (err: ?string, id: ?string, db: ?any) => void

export const login = (email: string, pwd: string): Promise<any> => {
  return userByEmail(email).then(id => {
    const remoteUserDb = new PouchDB(`${dbURL}/user_${id}`)
    return remoteUserDb.getSession().then(res => {
      // already have a valid session
      if (id && res.userCtx && res.userCtx.name === id) {
        return true
      }

      return remoteUserDb.login(id, pwd)
        .catch(err => {
          if (err.name === 'unauthorized') {
            throw new InvalidPassword()
          }
          throw new NetworkError()
        })
        .then(response => {
          if (id && response.ok && response.name === id) {
            console.log('login response', response)
            return true
          }
          console.error('unexpected response', response)
          throw new Error("Unexpected response")
        })
    })
    .then(() => authWithApiServer(id, pwd))
    .then(() => getSession(id, remoteUserDb))
  })
}
