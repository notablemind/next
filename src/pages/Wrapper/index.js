// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import {Router, Route, IndexRoute, hashHistory} from 'react-router'

import Header from './Header'
import {baseURL} from './config'

import login from './login'

import PouchDB from 'pouchdb'
PouchDB.plugin(require('pouchdb-authentication'))
PouchDB.plugin(require('pouchdb-adapter-idb'))

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
    user: User,
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

    /**
     * This will contain
     * - the settings blob
     * - entries for all of your documents
     *   {id: docid,
     *    folder: ?folderid,
     *    title: string,
     *    type: 'doc',
     *    size: number,
     *    last_modified: number(date),
     *    last_updated: number(date),
     *    }
     *   on the server, document ids will be `doc_userid_docid`, but locally,
     *   they will be `doc_docid` b/c you don't intrinsically have a userid
     *   anyway, these things will be a little denormalized between the doc
     *   db and this list, but I don't think we can avoid that.
     * - entries for all of your folders
     *   {id: string, title: string, folder: string, type: 'folder'} // anything else? don't think so
     * - what are the kinds of configuration things that files can have?
     *   these will live *in* the collection, under a special key, like
     *   `settings`
     *    view configuration (windows, panes, etc)
     *    plugin config
     *    - OOhh maybe this will need to be readable too
     *    - orr actually maybe it'll just be a document in the doc collection.
     *      yeah!
     * - how about system-wide settings?
     * - themes!
     *   if you're using a custom theme, you'll have to share the theme
     *   but the default will be to use a built-in theme & make small
     *   modifications. A custom theme could be a single document that you
     *   fetch from a user's db; and others who are listed in the document
     *   would have read-only access to it. I think that will work.
     *   so I can probably worry about themes later.
     *
    const db = new PouchDB('notablemind_user', 'idb')
    RxDB.create('notablemind', 'idb', null, true).then(db => {
      this.setState({localDb: db})
      return db.collection('user', userSchema).then(userCol => {
        this.setState({userCol})
        // TODO do I need the settings here?
      })
    }, err => console.log('er', err))
     */

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
          // maybe network error? It's fine to leave things
          return
        }
        if (!res.userCtx || res.userCtx.name !== user.id) {
          clearUser()
          this.setState({
            user: null,
            remoteUserDb: null,
          })
        }
        ensureUserDb(res => {
          console.log('ensured')
        })
        console.log(res)
        this.setState({
          loading: false,
          remoteUserDb,
        })
      })
    }
  }

  componentDidUpdate(_: {}, prevState: State) {
    if (this.state.userDb && this.state.remoteUserDb && !(prevState.userDb && prevState.remoteUserDb)) {
      console.log('starting sync')
      this.state.userDb.sync(this.state.remoteUserDb)
    }
  }

  onLogin = (email: string, pwd: string) => {
    login(email, pwd, (err, user, remoteUserDb) => {
      if (err) this.setState({loginError: err})
      else {
        saveUser(user)
        ensureUserDb(res => { console.log('ensured') })
        this.setState({user, remoteUserDb})
      }
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
        loginError={this.state.loginError}
      />
      {React.cloneElement(this.props.children, {
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
