// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'
import PouchDB from 'pouchdb'
import {hashHistory} from 'react-router'

import Treed from '../../../treed'
import treedPouch from '../../../treed/pouch'
import makeKeyLayer from '../../../treed/keys/makeKeyLayer'
import KeyManager from '../../../treed/keys/Manager'
import Sidebar from './Sidebar'

import listView from '../../../treed/views/list'

import './themes.less'

export default class Document extends Component {
  state: {
    db: any,
    treed: ?Treed,
  }
  keyManager: KeyManager

  constructor(props: any) {
    super()
    this.state = {
      db: new PouchDB('doc_' + props.params.id),
      treed: null,
    }

    if (props.makeRemoteDocDb) {
      props.makeRemoteDocDb(props.params.id)
      .then(db => this.state.db.sync(db, {live: true, retry: true}))
    }
    // TODO actually get the user shortcuts
    const userShortcuts = {}
    const globalLayer = makeKeyLayer({
      goHome: {
        shortcut: 'g q',
        description: 'Go back to the documents screen',
        action: this.goHome,
      },
      undo: {
        shortcut: 'u',
        description: 'Undo the last action',
        action: () => this.state.treed && this.state.treed.activeView().undo(),
      },
      redo: {
        shortcut: 'R',
        description: 'Redo the last action',
        action: () => this.state.treed && this.state.treed.activeView().redo(),
      },
    }, 'global', userShortcuts)
    // TODO maybe let plugins register "global actions" that aren't tied to a
    // view
    this.keyManager = new KeyManager([
      () => this.state.treed && this.state.treed.isCurrentViewInInsertMode() ?
        null : globalLayer,
      () => this.state.treed && this.state.treed.getCurrentKeyLayer(),
    ])

    this.makeTreed(this.state.db)
    window.addEventListener('keydown', this.onKeyDown)
  }

  goHome = () => {
    hashHistory.push('/')
  }

  onKeyDown = (e: any) => {
    this.keyManager.handle(e)
  }

  makeTreed(db: any) {
    if (this.state.treed) {
      this.state.treed.destroy()
    }
    const treed = window._treed = new Treed(treedPouch(this.state.db), [])
    treed.ready.then(() => this.setState({treed}))
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.params.id !== this.props.params.id) {
      const db = new PouchDB('doc_' + nextProps.params.id)
      if (this.state.treed) {
        this.state.treed.destroy()
      }
      this.setState({
        db: db,
      })
      this.makeTreed(db)
      if (nextProps.makeRemoteDocDb) {
        nextProps.makeRemoteDocDb(nextProps.params.id)
        .then(db => this.state.db.sync(db, {live: true, retry: true}))
      }
    } else if (nextProps.makeRemoteDocDb && !this.props.makeRemoteDocDb) {
      nextProps.makeRemoteDocDb(nextProps.params.id)
      .then(db => this.state.db.sync(db, {live: true, retry: true}))
    }
  }

  componentWillUnmount() {
    this.state.db.close()
    window.removeEventListener('keydown', this.onKeyDown)
    if (this.state.treed) {
      this.state.treed.destroy()
    }
  }

  render() {
    if (!this.state.treed) return <div>Loading...</div>
    return <div className={css(styles.container)}>
      <Sidebar

      />
      <div className={css(styles.document)}>
        <div className={css(styles.treedContainer) + ' Theme_basic'}>
          <listView.Component
            treed={this.state.treed}
          />
        </div>
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },

  document: {
    flex: 1,
    alignItems: 'center',
  },

  treedContainer: {
    width: 1000,
  },
})
