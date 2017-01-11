
import PouchDB from 'pouchdb-react-native'
import {apiURL, dbURL} from '../../shared/config.json'
PouchDB.plugin(require('pouchdb-authentication'))
PouchDB.plugin(require('pouchdb-adapter-idb'))
PouchDB.plugin(require('pouchdb-upsert'))

const userByEmail = (email, done) => {
  fetch(`${apiURL}/api/user-by-email?email=${email}`)
    .then(res => res.status === 404 ? {id: null} : res.json())
    .then(
      res => done(null, res.id),
      err => done(err)
    )
}


type Done = Function // (err: ?string, id: ?string, db: ?any) => void

const authWithApiServer = (id: string, pwd: string, done: Function) => {
  const remoteDb = new PouchDB(`${apiURL}/user_${id}`)
  remoteDb.getSession((err, res) => {
    if (err) {
      return done('Unable to connect to syncing server')
    }
    // already have a valid session
    if (res.userCtx && res.userCtx.name === id) {
      return authWithApiServer(id, pwd, () => {
        done(null, id, remoteDb)
      })
    }
    remoteDb.login(id, pwd, (err, response) => {
        if (err && err.name === 'unauthorized') {
          return done('Wrong password')
        }
        if (err) {
          return done('Unable to connect to syncing server')
        }
        if (response.ok && response.name === id) {
          done()
        }
    })
  })
}


export const login = (email: string, pwd: string, done: Done) => {
  userByEmail(email, (err, id) => {
    if (err) {
      console.error(err)
      return done('Unable to connect to syncing server')
    }
    if (!id) {
      // this is a new user, or a different email address
      return done('No user found for that email')
    }
    const remoteDb = new PouchDB(`${dbURL}/user_${id}`)
    remoteDb.getSession((err, res) => {
      if (err) {
        return done('Unable to connect to syncing server')
      }
      // already have a valid session
      if (res.userCtx && res.userCtx.name === id) {
        return authWithApiServer(id, pwd, err => {
          if (err) console.error(err)
          done(null, id, remoteDb)
        })
      }
      remoteDb.login(id, pwd, (err, response) => {
        if (err && err.name === 'unauthorized') {
          return done('Wrong password')
        }
        if (err) {
          return done('Unable to connect to syncing server')
        }
        if (response.ok && response.name === id) {
          console.log('login response', response)
          authWithApiServer(id, pwd, err => {
            if (err) console.error(err)
            done(null, id, remoteDb)
          })
        }
      })
    })
  })
}
