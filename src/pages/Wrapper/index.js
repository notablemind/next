// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import {Router, Route, IndexRoute, hashHistory} from 'react-router'

import Header from './Header'
import {baseURL} from './config'

import {login, signup} from './login'

import PouchDB from 'pouchdb'
PouchDB.plugin(require('pouchdb-authentication'))
PouchDB.plugin(require('pouchdb-adapter-idb'))
PouchDB.plugin(require('pouchdb-upsert'))

import type {User} from './types'

window.pouchdb = PouchDB

const USER_KEY = 'notablemind:user'

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

const ensureDocDb = id => {
  return fetch(`${baseURL}/api/create-doc?id=${id}`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
  }).then(
    res => console.log('good', res),
    err => console.log('bad')
  )
}

const getUser = () => {
  let val = localStorage[USER_KEY]
  try {
    return val ? JSON.parse(val) : null
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
  additionalProperties: true,
  title: 'User Doc Schema',
  type: 'object',
  properties: {
    id: {type: 'string', primary: true}
  }
}

type State = {
  user: ?User,
  loading: bool,
  online: bool,
  remoteUserDb: any,
  userDb: any,
  title: string,
  settings: ?any,
  loginError: ?string,
}

export default class Wrapper extends Component {
  state: State

  constructor() {
    super()
    const user = getUser()
    this.state = {
      user,
      loading: !!user,
      loginError: null,
      online: true,
      remoteUserDb: null,
      userDb: new PouchDB('notablemind_user'),
      title: 'Notablemind',
      settings: null, // do I need the settings?
    }

    if (user) {
      const remoteUserDb = new PouchDB(`${baseURL}/user_${user.id}`)
      remoteUserDb.getSession((err, res) => {
        if (err) {
          console.log('network error', err)
          // TODO try to connect periodically.
          this.setState({
            loading: false,
            online: false,
          })
          return
        }

        if (!res.userCtx || res.userCtx.name !== user.id) {
          clearUser()
          this.setState({
            user: null,
            remoteUserDb: null,
          })
        }

        ensureUserDb(res => { console.log('ensured') })
        this.setState({
          loading: false,
          remoteUserDb,
        })
      })
    }
  }

  componentDidUpdate(_: {}, prevState: State) {
    if (this.state.userDb && this.state.remoteUserDb &&
        !(prevState.userDb && prevState.remoteUserDb)) {
      console.log('starting sync')
      this.state.userDb.sync(this.state.remoteUserDb, {
        live: true,
        retry: true,
      })
    }
  }

  getUser = (id: string, remoteUserDb: any) => {
    remoteUserDb.getUser(id, (err, res) => {
      console.log(err, res)
      const user = {
        id,
        email: res.email,
        realName: res.realName,
      }
      saveUser(user)
      ensureUserDb(res => { console.log('ensured') })
      this.setState({user, remoteUserDb})
    })
  }

  onLogin = (email: string, pwd: string) => {
    login(email, pwd, (err, id, remoteUserDb) => {
      if (err) this.setState({loginError: err})
      else this.getUser(id, remoteUserDb)

    })
  }

  onSignUp = (name: string, email: string, pwd: string) => {
    signup(name, email, pwd, (err, id, remoteUserDb) => {
      if (err) this.setState({loginError: err})
      else this.getUser(id, remoteUserDb)
    })
  }

  onLogout = () => {
    if (this.state.remoteUserDb) {
      this.state.remoteUserDb.logout()
    }
    clearUser()
    this.setState({
      user: null,
      remoteUserDb: null,
    })
  }

  setTitle = (title: string) => {
    this.setState({title})
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
        onSignUp={this.onSignUp}
        loginError={this.state.loginError}
      />
      {React.cloneElement(this.props.children, {
        makeRemoteDocDb: this.state.remoteUserDb && (
          id => {
            if (!this.state.user) return
            const doc = `doc_${this.state.user.id}_${id}`
            return ensureDocDb(doc).then(() => new PouchDB(`${baseURL}/${doc}`))
          }
        ),
        remoteUser: this.state.user,
        userDb: this.state.userDb,
        setTitle: this.setTitle,
      })}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
