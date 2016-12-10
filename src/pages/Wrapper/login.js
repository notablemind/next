// @flow

import {baseURL} from './config'
import PouchDB from 'pouchdb'

const userByEmail = (email, done) => {
  fetch(`${baseURL}/api/user-by-email?email=${email}`)
    .then(res => res.status === 404 ? {id: null} : res.json())
    .then(
      res => done(null, res.id),
      err => done(err)
    )
}

export default (email: string, pwd: string, done: Function) => {
    userByEmail(email, (err, id) => {
      if (err) {
        console.error(err)
        return done('Unable to connect to syncing server')
      }
      if (!id) {
        // this is a new user, or a different email address
        return done('No user found for that email')
      }
      const remoteDb = new PouchDB(`${baseURL}/user_${id}`)
      remoteDb.getSession((err, res) => {
        if (err) {
          return done('Unable to connect to syncing server')
        }
        // already have a valid session
        if (res.userCtx && res.userCtx.name === id) {
          return done(null, {id, metadata: {email}}, remoteDb)
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
            done(null, {id, metadata: {email}}, remoteDb)
          }
        })
      })
    })
}
