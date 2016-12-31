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
import Searcher from './Searcher'
import KeyCompleter from './KeyCompleter'
import ViewTypeSwitcher from './ViewTypeSwitcher'

import listView from '../../../treed/views/list'

/*
const textImporters = [
  {
    name: 'opml',
    types: ['text/plain'],
    action(text) {
      // try to import
      return false
    },
  },
  {
    name: 'html',
    types: ['text/plain', 'text/html'],
    action(text, store) {
      const tree = makeATree(text)
      store.actions.importTree(tree)
      // parse the html, find any lists n stuff
      return false
    },
  },
  {
    name: 'markdown',
    types: ['text/plain'],
    action(text) {
      return false
    },
  },
]

const fileImporters = [
  {
    name: 'image',
    types: ['image/png', 'image/jpeg'],
    action(blob, store) {
      store.createImageThing(blob)
    },
  },
]
*/

const plugins = [
  require('../../plugins/themes').default,
  require('../../plugins/todos').default,
  require('../../plugins/image').default,
]

type DbT = any

export default class Document extends Component {
  state: {
    db: any,
    treed: ?Treed,
    searching: bool,
  }
  _unsub: () => void

  constructor(props: any) {
    super()
    this.state = {
      db: new PouchDB('doc_' + props.params.id),
      searching: false,
      treed: null,
    }

    if (props.makeRemoteDocDb) {
      this.setupSync(props.makeRemoteDocDb, props.params.id)
    }
  }

  componentDidMount() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('dragover', this.onDrag)
    window.addEventListener('paste', this.onPaste)
    window.addEventListener('drop', this.onDrop)
    this.makeTreed(this.state.db)
  }

  keyLayerConfig = {
    goHome: {
      shortcut: 'g q',
      description: 'Go back to the documents screen',
      action: () => hashHistory.push('/'),
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
    search: {
      shortcut: '/, cmd+f',
      description: 'Search',
      action: () => this.setState({searching: true}),
    },
  }

  onDrag = (e: any) => {
    e.preventDefault()
  }

  onDrop = (e: any) => {
    if (e.target.nodeName === 'INPUT' && e.target.type === 'file') {
      return // dropping on a file input, it'll pick it up
    }
    e.preventDefault()
    debugger
  }

  onPaste = (e: any) => {
    if (this.state.treed) {
      this.state.treed.handlePaste(e)
    }
  }

  onKeyDown = (e: any) => {
    if (this.state.searching) return
    if (this.state.treed) {
      this.state.treed.handleKey(e)
    }
    // this.keyManager.handle(e)
  }

  makeTreed(db: any) {
    if (this.state.treed) {
      this.state.treed.destroy()
      this._unsub && this._unsub()
    }
    const treed = window._treed = new Treed(
      treedPouch(this.state.db),
      plugins,
      this.props.params.id,
    )
    this._unsub = treed.on(['node:root'], () => {
      this.onTitleChange(treed.db.data.root.content)
    })
    // TODO actually get the user shortcuts
    const userShortcuts = {}
    const globalLayer = makeKeyLayer(this.keyLayerConfig, 'global', userShortcuts)
    treed.addKeyLayer(() => treed.isCurrentViewInInsertMode() ? null : globalLayer)
    treed.ready.then(() => {
      this.props.setTitle(<ViewTypeSwitcher
        globalStore={treed.globalStore}
      />)
      if (treed.db.data.root) {
        this.onTitleChange(treed.db.data.root.content)
      }
      // this.themeManager = new ThemeManager((treed.db.data.settings || {}).theme || defaultThemeSettings)
      this.setState({treed})
    })
  }

  onTitleChange(title: string) {
    document.title = title
    // this.props.setTitle(title)
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
    window.removeEventListener('dragover', this.onDrag)
    window.removeEventListener('paste', this.onPaste)
    window.removeEventListener('drop', this.onDrop)
    if (this.state.treed) {
      this.state.treed.destroy()
    }
    if (this._unsub) {
      this._unsub()
    }
  }

  render() {
    if (!this.state.treed) return <div className={css(styles.container, styles.loading)}>Loading...</div>
    return <div className={css(styles.container)}>
      <Sidebar
        globalStore={this.state.treed.globalStore}
        plugins={this.state.treed.config.plugins}
      />
      <div className={css(styles.treedContainer) + ' Theme_basic'}>
        <listView.Component
          treed={this.state.treed}
        />
      </div>
      <KeyCompleter
        treed={this.state.treed}
      />
      {this.state.searching &&
        <Searcher
          treed={this.state.treed}
          onClose={() => this.setState({searching: false})}
        />}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
  },

  loading: {
    padding: 100,
    alignItems: 'center',
    flexDirection: 'column',
    fontSize: '2em',
    color: '#ccc',
  },

  treedContainer: {
    flex: 1,
  },
})
