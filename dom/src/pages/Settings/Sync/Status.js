// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Modal from '../../utils/Modal'

import type {User} from './sync'

export default class SyncStatus extends Component {
  _unsub: () => void
  state: {
    user: ?User,
  }

  constructor({nm}) {
    super()
    this.state = { user: nm.user }
  }

  componentWillMount() {
    this._unsub = this.props.nm.onUser(user => this.setState({user}))
  }

  componentWillUnmount() {
    this._unsub()
  }

  render() {
    let contents
    const {LOGGED_OUT, LOADING} = this.props.nm
    switch (this.state.user) {
      case LOGGED_OUT:
        contents = 'Login'
        break
      case LOADING:
        contents = 'Loading...'
        break
      default:
        contents = this.state.user.name
    }
    return <div
      className={css(styles.container)}
      onClick={this.props.onClick}
    >
      {contents}
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


