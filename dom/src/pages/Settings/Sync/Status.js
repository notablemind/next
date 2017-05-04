// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import Modal from '../../utils/Modal'

import type {User} from './sync'

class LiveSince extends Component {
  constructor(props) {
    super()
    this.state = {tick: 0}
  }
  componentDidMount() {
    this._int = setInterval(
      () => this.setState({tick: this.state.tick + 1}),
      1000
    )
  }
  componentWillUnmount() {
    clearInterval(this._int)
  }
  render() {
    const since = Date.now() - this.props.time
    let contents
    if (since < 60 * 60 * 1000) {
      const minutes = (since / 60 / 1000) | 0
      if (minutes === 0) contents = 'synced just now'
      else contents = `synced ${minutes} minutes ago`
    } else {
      contents = `synced at ${new Date(this.props.time).toLocaleString()}`
    }
    return <span>{contents}</span>
  }
}

export default class SyncStatus extends Component {
  _unsub: () => void
  state: {
    user: ?User
  }

  constructor({nm}) {
    super()
    this.state = {user: nm.user}
  }

  componentWillMount() {
    this._unsubs = [
      this.props.nm.onUser(user => this.setState({user})),
      this.props.nm.onMetaById(this.props.docid, meta => this.setState({meta}))
    ]
  }

  componentWillUnmount() {
    this._unsubs.map(f => f())
  }

  renderUnsaved() {
    if (!this.state.meta) return
    const sync = this.state.meta.sync
    if (!sync) return
    return sync.dirty
      ? <div className={css(styles.unsaved)}>Unsaved changes</div>
      : ''
  }

  renderSyncTime() {
    if (this.state.offline) {
      return 'offline'
    }
    if (!this.state.meta) return
    const sync = this.state.meta.sync
    if (!sync || !sync.lastSynced) return
    return (
      <div
        className={css(styles.syncTime)}
        onClick={() => this.props.nm.syncNow(this.props.docid)}
      >
        <LiveSince time={sync.lastSynced} />
      </div>
    )
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
    return (
      <div className={css(styles.container)}>
        {this.renderUnsaved()}
        {this.renderSyncTime()}
        <div className={css(styles.button)} onClick={this.props.onClick}>
          {contents}
        </div>
      </div>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row'
  },

  button: {
    WebkitAppRegion: 'no-drag',
    fontSize: 12,
    padding: '5px',
    cursor: 'pointer',
    marginRight: 5,

    ':hover': {
      backgroundColor: '#eee',
      borderRadius: 3
    }
  },

  syncTime: {
    WebkitAppRegion: 'no-drag',
    marginRight: 5,
    fontSize: 12,
    padding: '5px'
  },

  unsaved: {
    marginRight: 5,
    fontSize: 12,
    padding: '5px'
  }
})
