// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Modal from '../../utils/Modal'
import * as sync from './sync'

import type {User} from './sync'

type File = {
  id: string,
  title: string,
  remote: ?{
    owner: string,
    lastSynced: number,
  },
  local: boolean,
}

export default class SyncSettings extends Component {
  state: {
    user: ?User,
    files: ?File[],
  }

  constructor() {
    super()
    this.state = {
      user: null,
      files: null,
    }
    this.state.user = {
      name: 'Jared Forsyth',
      email: 'jabapyth@gmail.com',
    }
    this.state.files = []
    this._unsub = sync.onUser(user => this.setState({user}))
    sync.getUser()
  }

  componentDidMount() {
    sync.getFiles().then(files => this.setState({files}))
  }

  componentWillUnmount() {
    this._unsub()
  }

  renderLoggedOut() {
    return <div className={css(styles.loggedOut)}>
      <button
        onClick={() => sync.signIn()}
        className={css(styles.loginButton)}
      >
        Login with Google Drive
      </button>
      <div className={css(styles.loginDetails)}>
        Login with Google Drive to sync your documents any computer, device, and the web. You can also share documents and collaborate with other Notablemind users that have signed in with Google Drive.
      </div>
    </div>
  }

  renderLoggedIn(user: User) {
    return <div className={css(styles.loggedIn)}>
      <div className={css(styles.username)}>
        <img src={user.profile} style={{width: 50, height: 50, borderRadius: 25}} />
        {user.name} ({user.email})
      </div>
      {this.state.files
        ? this.renderFiles(this.state.files)
        : 'Fetching files list...'}
    </div>
  }

  renderFiles(files: File[]) {
    return 'Files right here ' + files.length
  }

  render() {
    return <Modal onClose={this.props.onClose}>
      <div className={css(styles.container)}>
        {this.state.user
          ? this.renderLoggedIn(this.state.user)
          : this.renderLoggedOut()}
      </div>
    </Modal>
  }
}

const styles = StyleSheet.create({
  container: {
    width: 600,
    height: 400,
  },

  loggedOut: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  loginButton: {
    padding: '10px 20px',
    border: 'none',
    boxShadow: '0 2px 5px #ccc',
    backgroundColor: 'white',
    fontSize: 20,
    borderRadius: 4,
    marginBottom: 10,
  },

  loginDetails: {
    maxWidth: 300,
  },

})

