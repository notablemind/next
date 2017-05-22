// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'
import uuid from '../../utils/uuid'
import {hashHistory} from 'react-router'

import Treed from 'treed'
import treedPouch from 'treed/pouch'
import KeyManager from 'treed/keys/Manager'
import makeKeyLayer from 'treed/keys/makeKeyLayer'
import SettingsModal from '../Settings/SettingsModal'
import Searcher from '../Document/Searcher'
import KeyCompleter from '../Document/KeyCompleter'

import ContextMenu from 'treed/views/context-menu/ContextMenu'

import type {MenuItem} from 'treed/types'

const plugins = [
  require('../../../../plugins/files').default,
  require('../../../../plugins/minimap').default,
  require('../../../../plugins/themes').default,
  require('../../../../plugins/todos/dom').default,
  require('../../../../plugins/image/dom').default,
  require('../../../../plugins/date/dom').default,
  require('../../../../plugins/tags').default,
  // require('../../../../plugins/themes').default,
  // require('../../../../plugins/todos/dom').default,
  // require('../../../../plugins/image/dom').default,
  // require('../../../../plugins/date/dom').default,
  // require('../../../../plugins/scriptures').default,
]

const viewTypes = {
  // table: require('treed/views/table').default,
  list: require('treed/views/list').default,
  // whiteboard: require('treed/views/whiteboard').default,
}

type FolderT = {
  _id: string,
  _rev: string,
  type: 'folder',
  folder: ?string,
  title: string,
}

type DocT = {
  _id: string,
  _rev: string,
  type: 'doc',
  folder: ?string,
  title: string,
  last_opened: number,
  size: number,
}

type Props = {
  userDb: any,
}

type PouchChange = any // TODO can be polymorphic

// TODO I need this to be abstracted
const maybeLoad = key => {
  try {
    return JSON.parse(localStorage[key] || '')
  } catch (e) {
    return null
  }
}

const sharedViewDataKey = id => `shared-view-data:${id}`
const loadSharedViewData = id => maybeLoad(sharedViewDataKey(id)) || null
const saveSharedViewData = (id, data) =>
  (localStorage[sharedViewDataKey(id)] = JSON.stringify(data))

export default class Browse extends Component {
  keyManager: KeyManager
  state: {
    store: any,
    treed: any,
    menu: any,
    showSettings: boolean,
    searching: boolean,
  }
  _unsubs: Array<() => void>

  constructor(props: any) {
    super()
    this.state = {
      showSettings: false,
      searching: false,
      treed: null,
      store: null,
      menu: null,
    }
    this._unsubs = []
  }

  keyLayerConfig = {
    undo: {
      shortcut: 'u, cmd+z',
      description: 'Undo the last action',
      action: () => this.state.treed && this.state.treed.activeView().undo(),
    },
    redo: {
      shortcut: 'R, cmd+shift+z',
      description: 'Redo the last action',
      action: () => this.state.treed && this.state.treed.activeView().redo(),
    },
    search: {
      shortcut: '/, cmd+f',
      description: 'Search',
      action: () => this.setState({searching: true}),
    },
  }

  makeTreed() {
    const treed = (window._treed = new Treed(
      treedPouch(this.props.userDb),
      plugins,
      viewTypes,
      'notablemind_user',
      loadSharedViewData('notablemind_user') || {},
    ))
    const userShortcuts = {}
    const globalLayer = makeKeyLayer(
      {
        ...this.keyLayerConfig,
      },
      'global',
      userShortcuts,
    )
    treed.addKeyLayer(
      () => (treed.isCurrentViewInInsertMode() ? null : globalLayer),
    )
    treed.ready.then(() => {
      const store = treed.registerView({viewType: 'list'})
      this._unsubs.push(
        store.on(['file:setup sync'], () => {
          const node = store.getters.activeNode()
          if (node.type !== 'file') {
            return console.error(
              "Can't setup sync for something that's not a file",
            )
          }
          this.props.userSession.setupSyncing(node._id)
          // TODO sync it then
        }),
      )
      this._unsubs.push(
        store.on(['navigate-to-current-active'], () => {
          console.log('want to navigate to', store.state.active)
          const node = store.getters.activeNode()
          if (node.type !== 'file') {
            return console.error(
              "Can't navigate to something that's not a file",
            )
          }
          hashHistory.push('/doc/' + store.state.active)
        }),
      )
      this._unsubs.push(
        store.on([store.events.sharedViewData()], () => {
          saveSharedViewData('notablemind_user', store.sharedViewData)
        }),
      )
      this.setState({
        treed,
        store,
      })
    })
  }

  componentDidMount() {
    window.addEventListener('keydown', this.onKeyDown)
    // window.addEventListener('dragover', this.onDrag)
    // window.addEventListener('paste', this.onPaste)
    // window.addEventListener('drop', this.onDrop)
    this.makeTreed()
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onKeyDown)
    // window.removeEventListener('dragover', this.onDrag)
    // window.removeEventListener('paste', this.onPaste)
    // window.removeEventListener('drop', this.onDrop)
    this._unsubs.forEach(f => f())
    if (this.state.treed) {
      this.state.treed.destroy()
    }
  }

  onKeyDown = (e: any) => {
    if (this.state.searching) return
    if (this.state.treed) {
      this.state.treed.handleKey(e)
    }
  }

  render() {
    const {store, treed} = this.state
    const ListView = viewTypes.list.Component
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.buttons)}>
          <button
            className={css(styles.settingsButton)}
            onClick={() => this.setState({showSettings: true})}
          >
            Settings
          </button>
        </div>
        {store && <ListView store={store} />}
        {this.state.menu &&
          <ContextMenu
            pos={this.state.menu.pos}
            menu={this.state.menu.items}
            onClose={() => this.setState({menu: null})}
          />}
        {this.state.showSettings &&
          <SettingsModal
            onClose={() => this.setState({showSettings: false})}
            store={store}
          />}
        {treed && <KeyCompleter treed={treed} />}
        {treed &&
          this.state.searching &&
          <Searcher
            treed={treed}
            onClose={() => this.setState({searching: false})}
          />}
      </div>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsButton: {
    padding: '5px 10px',
    border: '1px solid #aaa',
    backgroundColor: 'white',
    borderRadius: 4,
    alignSelf: 'flex-end',
    marginRight: 10,
    cursor: 'pointer',
  },
})
