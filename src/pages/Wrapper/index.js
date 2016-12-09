// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import {Router, Route, IndexRoute, hashHistory} from 'react-router'

import Header from './Header'

import PouchDB from 'pouchdb'
PouchDB.plugin(require('pouchdb-authentication'))

const RxDB = require('rxdb')
RxDB.plugin(require('pouchdb-adapter-idb'))
RxDB.plugin(require('pouchdb-replication'))

window.pouchdb = PouchDB
window.rxdb = RxDB

const USER_KEY = 'notablemind:user'
const baseURL = 'http://localhost:6102'

const ensureUserDb = (done) => {
  fetch(`${baseURL}/api/ensure-user`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
  }).then(
    res => console.log('good', res),
    err => console.log('bad')
  )
}

const userByEmail = (email, done) => {
  fetch(`${baseURL}/api/user-by-email?email=${email}`)
    .then(res => res.json())
    .then(
      res => done(null, res.id),
      err => done(err)
    )
}

const getUser = () => {
  try {
    return JSON.parse(localStorage[USER_KEY])
  } catch (e) {
    return null
  }
}

const saveUser = (user) => {
  localStorage[USER_KEY] = JSON.stringify(user)
}

const clearUser = () => {
  localStorage[USER_KEY] = ''
}

const userSchema = {
  title: 'User Doc Schema',
  type: 'object',
  properties: {
    id: {type: 'string', primary: true}
  }
}

export default class Wrapper extends Component {
  constructor() {
    super()
    const user = getUser()
    this.state = {
      user,
      loading: user,
      loginError: null,
      online: true,
      remoteDb: null,
      title: 'Notablemind',
      settings: null,
    }

    RxDB.create('notablemind', 'idb', null, true).then(db => {
      this.setState({localDb: db})
      return db.collection('user', userSchema).then(userCol => {
        this.setState({userCol})
        userCol.query().$.subscribe(items => {
          if (!items) return
          let settings = {}
          let docs = items.filter(item => {
            if (item.id === 'settings') {
              settings = item
              return false
            }
            return true
          })
          this.setState({
            settings,
            docs,
          })
        })
      })
    }, err => console.log('er', err))

    if (user) {
      const remoteDb = new PouchDB(`${baseURL}/user_${user.id}`)
      remoteDb.getSession((err, res) => {
        if (err) {
          console.log('network error', err)
          // TODO try to connect periodically.
          this.setState({
            loading: false,
            online: false,
          })
          // maybe network error? It's fine to leave things
          return
        }
        if (!res.userCtx || res.userCtx.name !== user.id) {
          clearUser()
          this.setState({
            user: null,
            remoteDb: null,
          })
        }
        ensureUserDb(res => {
          console.log('ensured')
        })
        console.log(res)
        this.setState({
          loading: false,
          remoteDb,
        })
      })
    }
  }

  componentDidUpdate(_, prevState) {
    if (this.state.userCol && this.state.remoteDb && !(prevState.userCol && prevState.remoteDb)) {
      this.state.userCol.sync(this.state.remoteDb)
    }
  }

  onLogin = (email, pwd) => {
    userByEmail(email, (err, id) => {
      if (err) {
        console.error(err)
        return Toast.show('Unable to log you in - you might be offline')
      }
      if (!id) {
        // this is a new user, or a different email address
        return this.setState({
          loginError: 'No user found for that email',
        })
      }
      const remoteDb = new PouchDB(`${baseURL}/user_${id}`)
      remoteDb.getSession((err, res) => {
        if (err) {
          return this.setState({
            loginError: 'No user found for that email',
          })
        }
        if (res.userCtx && res.userCtx.name === id) {
          ensureUserDb(res => {
            console.log('ensured')
          })
          return this.setState({
            user: {
              id,
              metadata: {email}, // TODO name
            },
            remoteDb,
          })
        }
        remoteDb.login(id, pwd, (err, response) => {
          if (err && err.name === 'unauthorized') {
            return this.setState({
              loginError: 'Wrong password',
            })
          }
          if (err) {
            return this.setState({
              loginError: 'Unable to communicate with headquarters',
            })
          }
          if (response.ok && response.name === id) {
            ensureUserDb(res => {
              console.log('ensured')
            })
            const user = {
              id,
              metadata: {email},
            }
            saveUser(user)
            this.setState({
              user: user,
              remoteDb,
            })
          }
        })
      })
    })
  }

  onLogout = () => {
    if (this.state.remoteDb) {
      this.state.remoteDb.logout()
    }
    clearUser()
    this.setState({
      user: null,
      remoteDb: null,
    })
  }

  render() {
    return <div className={css(styles.container)}>
      <Header
        user={this.state.user}
        title={this.state.title}
        loading={this.state.loading}
        online={this.state.online}
        onLogin={this.onLogin}
        onLogout={this.onLogout}
        loginError={this.state.loginError}
      />
      {this.props.children}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
