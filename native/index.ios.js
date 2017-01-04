/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
} from 'react-native';

import PouchDB from 'pouchdb-react-native'
import Treed from 'treed'

import Login from './pages/Login'
import Browse from './pages/Browse'

import {login} from './utils/login'
import {baseURL} from './config'

import Button from './components/Button'

const USER_KEY = 'notablemind:user'
const saveUser = user => AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
const getUser = () => AsyncStorage.getItem(USER_KEY).then(raw => JSON.parse(raw))
const clearUser = () => AsyncStorage.removeItem(USER_KEY)

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

export default class Native extends Component {
  constructor() {
    super()
    this.state = {
      user: null,
      userDb: new PouchDB('notablemind_user'),
      loading: true,
      online: true,
    }
  }

  componentDidMount() {
    getUser()
      .then(
        user => this.checkSavedUser(user),
        err => this.setState({loading: false}),
      )
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

  checkSavedUser = user => {
    const remoteUserDb = new PouchDB(`${baseURL}/user_${user.id}`)
    remoteUserDb.getSession((err, res) => {
      if (err) {
        console.log('network error', err)
        // TODO try to connect periodically.
        this.setState({
          loading: false,
          online: false,
          user,
        })
        return
      }

      if (!res.userCtx || res.userCtx.name !== user.id) {
        clearUser()
        this.setState({
          user: null,
          remoteUserDb: null,
          loading: false,
        })
      }

      ensureUserDb(res => { console.log('ensured') })
      this.setState({
        user,
        remoteUserDb,
        loading: false,
      })
    })
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

  onLogin = (email, pwd, done) => {
    login(email, pwd, (err, id, db) => {
      if (err) return done(err)
      this.getUser(id, db)
    })
  }

  onLogout = () => {
    this.setState({user: null, remoteUserDb: null})
    clearUser()
  }

  openFile = id => {
    // ensureDocDb(
    this.setState({
      openFile: id,
    })
  }

  render() {
    if (this.state.loading) {
      return <View><Text>Loading...</Text></View>
    }
    if (!this.state.user) {
      return (
        <Login
          onLogin={this.onLogin}
        />
      )
    }

    return <Browse
      userDb={this.state.userDb}
      checkForLocalDb={this.checkForLocalDb}
      openFile={this.openFile}
    />

    /*
    return (
      <View style={styles.container}>
        <Button action={this.onLogout}>
          Logout
        </Button>
        <Text style={styles.welcome}>
          Welcome to React Native!
        </Text>
        <Text style={styles.instructions}>
          To get started, edit index.ios.js
        </Text>
        <Text style={styles.instructions}>
          {this.state.remoteUserDb ? 'Yes has user db' : 'No has not user db'}
        </Text>
      </View>
    );
    */
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    paddingTop: 40,
  },

  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('native', () => Native);
