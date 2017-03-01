// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Header from './Header'
import getFileDb from '../utils/getFileDb'

import * as userApi from './googleApi'
// import * as couchApi from './couchApi'

import type {User} from './types'

type State = {
  user: ?User,
  loading: bool,
  online: bool,
  // remoteSession: any,
  title: string,
  settings: ?any,
  loginError: ?string,
}

export default class Wrapper extends Component {
  state: State

  constructor() {
    super()
    const user = userApi.loadUser()
    this.state = {
      user,
      loading: !!user,
      loginError: null,
      online: true,
      title: 'Notablemind',
      settings: null, // do I need the settings?
    }
  }

  onLogin = () => {
    userApi.login()
  }

  /*
  onCouchLogin = (email: string, pwd: string) => {
    userApi.login(email, pwd).then(
      remoteSession => this.setState({remoteSession, user: remoteSession.user}),
      err => this.setState({loginError: err}),
    )
  }

  onSignUp = (name: string, email: string, pwd: string) => {
    userApi.signup(name, email, pwd).then(
      remoteSession => this.setState({remoteSession, user: remoteSession.user}),
      err => this.setState({loginError: err}),
    )
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
  */

  setTitle = (title: string) => {
    this.setState({title})
  }

  render() {
    return <div className={css(styles.container)}>
      {/*<Header
        user={this.state.user}
        title={this.state.title}
        loading={this.state.loading}
        online={this.state.online}
        // onLogin={this.onLogin}
        // onLogout={this.onLogout}
        // onSignUp={this.onSignUp}
        loginError={this.state.loginError}
      />*/}
      {React.cloneElement(this.props.children, {
        // userSession: this.state.remoteSession,
        // remoteUser: this.state.user,
        // updateFile: this.updateFile,
        // setTitle: this.setTitle,
      })}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
