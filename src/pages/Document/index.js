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
// import ThemeManager, {defaultThemeSettings} from './ThemeManager'

import listView from '../../../treed/views/list'

const plugins = [
  require('../../plugins/themes').default,
  // todos: require('../../plugins/todos'),
]

type DbT = any

export default class Document extends Component {
  state: {
    db: any,
    treed: ?Treed,
  }
  // themeManager: ThemeManager
  keyManager: KeyManager
  _unsub: () => void

  constructor(props: any) {
    super()
    this.state = {
      db: new PouchDB('doc_' + props.params.id),
      treed: null,
    }

    if (props.makeRemoteDocDb) {
      this.setupSync(props.makeRemoteDocDb, props.params.id)
    }
    // TODO actually get the user shortcuts
    const userShortcuts = {}
    const globalLayer = makeKeyLayer(this.keyLayerConfig, 'global', userShortcuts)
    // TODO maybe let plugins register "global actions" that aren't tied to a
    // view
    this.keyManager = new KeyManager([
      () => this.state.treed && this.state.treed.isCurrentViewInInsertMode() ?
        null : globalLayer,
      () => this.state.treed && this.state.treed.getCurrentKeyLayer(),
    ])
  }

  componentDidMount() {
    window.addEventListener('keydown', this.onKeyDown)
    this.makeTreed(this.state.db)
  }

  keyLayerConfig = {
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
      this._unsub && this._unsub()
    }
    const treed = window._treed = new Treed(treedPouch(this.state.db), plugins)
    this._unsub = treed.on(['node:root'], () => {
      document.title = treed.db.data.root.content
      this.onTitleChange(treed.db.data.root.content)
    })
    treed.ready.then(() => {
      if (treed.db.data.root) {
        document.title = treed.db.data.root.content
        this.onTitleChange(treed.db.data.root.content)
      }
      // this.themeManager = new ThemeManager((treed.db.data.settings || {}).theme || defaultThemeSettings)
      this.setState({treed})
    })
  }

  onTitleChange(title: string) {
    const id = this.props.params.id
    this.props.userDb.get(id).then(doc => {
      if (doc.title !== title) {
        console.log('saving title')
        this.props.userDb.put({
          ...doc,
          title,
        })
      }
    })
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
        this.setupSync(nextProps.makeRemoteDocDb, nextProps.params.id)
      }
    } else if (nextProps.makeRemoteDocDb && !this.props.makeRemoteDocDb) {
      this.setupSync(nextProps.makeRemoteDocDb, nextProps.params.id)
    }
  }

  setupSync(makeRemoteDocDb: () => Promise<DbT>, id: string) {
    makeRemoteDocDb(id).then(
      db => this.state.db.sync(db, {live: true, retry: true})
        .on('error', e => console.error('sync fail', e))
    )
  }

  componentWillUnmount() {
    this.state.db.close()
    window.removeEventListener('keydown', this.onKeyDown)
    if (this.state.treed) {
      this.state.treed.destroy()
    }
    if (this._unsub) {
      this._unsub()
    }
  }

  render() {
    if (!this.state.treed) return <div>Loading...</div>
    return <div className={css(styles.container)}>
      <Sidebar
        treed={this.state.treed}
        plugins={this.state.treed.config.plugins}
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
    flex: 1,
  },

  document: {
    flex: 1,
    alignItems: 'center',
    overflow: 'auto',
  },

  treedContainer: {
    width: 1000,
  },
})
