// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import {Router, Route, IndexRoute, hashHistory} from 'react-router'

import Header from './Header'

import PouchDB from 'pouchdb'
PouchDB.plugin(require('pouchdb-authentication'))
PouchDB.plugin(require('pouchdb-adapter-idb'))
// PouchDB.plugin(require('pouchdb-replication'))

/*
const RxDB = require('rxdb')
try {
RxDB.plugin(require('pouchdb-adapter-idb'))
RxDB.plugin(require('pouchdb-replication'))
} catch(e) {
  // HMR fix
}
*/

window.pouchdb = PouchDB
// window.rxdb = RxDB

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
  additionalProperties: true,
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
    if (this.state.userDb && this.state.remoteDb && !(prevState.userDb && prevState.remoteDb)) {
      this.state.userDb.sync(this.state.remoteDb)
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

  setTitle = title => {
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
