// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import {Router, Route, IndexRoute, hashHistory} from 'react-router'

import Header from './Header'

import * as couchApi from './couchApi'

import PouchDB from 'pouchdb'
PouchDB.plugin(require('pouchdb-authentication'))
PouchDB.plugin(require('pouchdb-adapter-idb'))
PouchDB.plugin(require('pouchdb-upsert'))

import type {User} from './types'

window.pouchdb = PouchDB

type State = {
  user: ?User,
  loading: bool,
  online: bool,
  remoteSession: any,
  userDb: any,
  title: string,
  settings: ?any,
  loginError: ?string,
}

export default class Wrapper extends Component {
  state: State

  constructor() {
    super()
    const user = couchApi.getUser()
    this.state = {
      user,
      loading: !!user,
      loginError: null,
      online: true,
      remoteSession: null,
      userDb: new PouchDB('notablemind_user'),
      title: 'Notablemind',
      settings: null, // do I need the settings?
    }

    if (user) {
      couchApi.restoreFromUser(user, (err, remoteSession) => {
        if (err === 'network') {
          this.setState({
            loading: false,
            online: false,
          })
          return
        } else if (err === 'invalid') {
          this.setState({
            user: null,
            remoteSession: null,
            loading: false,
          })
        } else if (remoteSession) {
          this.setState({
            loading: false,
            remoteSession,
          })
        }
      })
    }
  }

  componentDidUpdate(_: {}, prevState: State) {
    if (this.state.userDb && this.state.remoteSession &&
        !(prevState.userDb && prevState.remoteSession)) {
      console.log('starting sync')
      this.state.remoteSession.sync(this.state.userDb)
    }
  }

  getUser = (id: string, remoteSession: any) => {
    remoteSession.getUser(id).then(
      user => this.setState({user, remoteSession}),
      err => {
        console.log('failed to get user :(')
        this.setState({user: null, remoteSession: null, loading: false})
      }
    )
  }

  onLogin = (email: string, pwd: string) => {
    couchApi.login(email, pwd).then(
      ({id, remoteSession}) => this.getUser(id, remoteSession),
      err => this.setState({loginError: err}),
    )
  }

  onSignUp = (name: string, email: string, pwd: string) => {
    couchApi.signup(name, email, pwd, (err, id, remoteSession) => {
      if (err) this.setState({loginError: err})
      else this.getUser(id, remoteSession)
    })
  }

  onLogout = () => {
    if (this.state.remoteSession) {
      this.state.remoteSession.logout()
    }
    this.setState({
      user: null,
      remoteSession: null,
    })
  }

  setTitle = (title: string) => {
    this.setState({title})
  }

  updateFile = (id: string, attr: string, value: any) => {
    if (!this.state.userDb) {
      return console.error('No user db - unable to update file')
    }

    this.state.userDb.get(id).then(doc => {
      if (doc[attr] !== value) {
        console.log(`saving doc ${id}: ${attr}`)
        this.state.userDb.upsert(id, doc => ({...doc, [attr]: value}))
      }
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
        onSignUp={this.onSignUp}
        loginError={this.state.loginError}
      />
      {React.cloneElement(this.props.children, {
        makeRemoteDocDb: this.state.remoteSession && (
          id => {
            if (!this.state.user) return Promise.reject(new Error('no user'))
            const doc = `doc_${this.state.user.id}_${id}`
            return couchApi.ensureDocDb(doc)
          }
        ),
        remoteUser: this.state.user,
        userDb: this.state.userDb,
        updateFile: this.updateFile,
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
