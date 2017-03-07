// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Modal from '../../utils/Modal'
import * as sync from './sync'

import type {User} from './sync'

export default class SyncStatus extends Component {
  _unsub: () => void
  state: {
    user: ?User,
  }

  constructor() {
    super()
    this.state = {
      user: null,
    }
    this._unsub = sync.onUser(user => this.setState({user}))
    sync.getUser()
  }

  componentWillUnmount() {
    this._unsub()
  }

  render() {
    return <div onClick={this.props.onClick}>
      {this.state.user ? this.state.user.name : 'Login'}
    </div>
  }
}

