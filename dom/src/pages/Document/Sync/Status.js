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
    return <div
      className={css(styles.container)}
      onClick={this.props.onClick}
    >
      {this.state.user ? this.state.user.name : 'Login'}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    fontSize: 12,
    padding: '5px',
    cursor: 'pointer',
    marginRight: 5,

    ':hover': {
      backgroundColor: '#eee',
      borderRadius: 3,
    },
  },
})


