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
    this._unsubs = [
      this.props.nm.onUser(user => this.setState({user})),
      this.props.nm.onMetaById(this.props.docid, meta => this.setState({meta})),
    ]
  }

  componentWillUnmount() {
    this._unsubs.map(f => f())
  }

  renderSyncTime() {
    if (this.state.offline) {
      return 'offline'
    }
    if (!this.state.meta) return
    const sync = this.state.meta.sync
    if (!sync || !sync.lastSynced) return
    const since = Date.now() - sync.lastSynced
    if (since < 60 * 60 * 1000) {
      const minutes = since / 60 / 1000 | 0
      return <div className={css(styles.syncTime)}>
        synced {minutes} minutes ago
      </div>
    }
    return <div className={css(styles.syncTime)}>
      synced at {new Date(sync.lastSynced).toLocaleString()}
    </div>
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
    return <div className={css(styles.container)}>
      {this.renderSyncTime()}
      <div
        className={css(styles.button)}
        onClick={this.props.onClick}
      >
        {contents}
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },

  button: {
    fontSize: 12,
    padding: '5px',
    cursor: 'pointer',
    marginRight: 5,

    ':hover': {
      backgroundColor: '#eee',
      borderRadius: 3,
    },
  },

  syncTime: {
    marginRight: 5,
    fontSize: 12,
    padding: '5px',
  },
})


