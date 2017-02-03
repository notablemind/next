// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'
import PouchDB from 'pouchdb'
import {hashHistory} from 'react-router'

import Treed from 'treed'
import treedPouch from 'treed/pouch'
import makeKeyLayer from 'treed/keys/makeKeyLayer'

import Sidebar from './Sidebar'
import Searcher from './Searcher'
import KeyCompleter from './KeyCompleter'
import ViewTypeSwitcher from './ViewTypeSwitcher'
import ViewHeader from './ViewHeader'
import withStore from './withStore'

import type {Store} from 'treed/types'

const plugins = [
  require('../../../../plugins/minimap').default,
  require('../../../../plugins/themes').default,
  require('../../../../plugins/todos/dom').default,
  require('../../../../plugins/image/dom').default,
  require('../../../../plugins/date/dom').default,
  require('../../../../plugins/scriptures').default,
]

const viewTypes = {
  list: require('treed/views/list').default,
  whiteboard: require('treed/views/whiteboard').default,
}

const activeButtons = [] // ['date:newEntry']

type DbT = any

const makeViewTypeLayerConfig = (viewTypes, setViewType) => {
  const layer = {}
  Object.keys(viewTypes).forEach(key => {
    layer['setViewType' + key] = {
      shortcut: `alt+v ${viewTypes[key].shortcut}`,
      description: `Change view type to ${viewTypes[key].title}`,
      action: () => setViewType(key),
    }
  })
  return layer
}

const maybeLoad = key => { try { return JSON.parse(localStorage[key] || '') } catch (e) { return null } }

const sharedViewDataKey = id => `shared-view-data:${id}`
const loadSharedViewData = id => maybeLoad(sharedViewDataKey(id)) || null
const saveSharedViewData = (id, data) => localStorage[sharedViewDataKey(id)] = JSON.stringify(data)

const viewStateKey = id => `last-view-state:${id}`
const loadLastViewState = id => maybeLoad(viewStateKey(id)) || {
  viewType: 'list',
  root: 'root',
}
const saveLastViewState = (id, data) => localStorage[viewStateKey(id)] = JSON.stringify(data)

const DocumentPage = ({params, ...props}: any) => <Document key={params.id} id={params.id} {...props} />
export default DocumentPage

type ViewState = {
  leaf: boolean,
  viewType: string,
  custom: any,
  initialState: {
    root: string,
  },
}

const ViewWrapper = withStore({
  events: store => [store.events.viewType()],
  state: store => ({
    viewType: store.getters.viewType(),
  }),
  render({store, viewTypes, viewType}) {
    const Component = viewTypes[viewType].Component
    return <div style={{flex: 1}}>
      <ViewHeader store={store} viewTypes={viewTypes} />
      <Component store={store} />
    </div>
  }
})

class Document extends Component {
  state: {
    db: any,
    treed: ?Treed,
    store: any,
    searching: bool,
    // sharedViewData: any,
    syncState: string,
  }
  _unsubs: Array<() => void>

  constructor({id, userSession}: any) {
    super()
    this.state = {
      db: new PouchDB('doc_' + id),
      searching: false,
      treed: null,
      store: null,
      // sharedViewData: loadSharedViewData(props.id),
      syncState: 'unsynced',
      // panesSetup,
    }
    this._unsubs = [
    ]

    if (userSession) {
      this._unsubs.push(userSession.syncDoc(this.state.db, id, syncState => {
        this.setState({syncState})
      }))
    }
  }

  componentDidMount() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('dragover', this.onDrag)
    window.addEventListener('paste', this.onPaste)
    window.addEventListener('drop', this.onDrop)
    this.makeTreed(this.state.db)
  }

  goBack = () => {
    if (this.state.treed) {
      const numItems = Object.keys(this.state.treed.db.data).length
      this.props.updateFile(this.props.id, 'size', numItems)
    }
    hashHistory.push('/')
  }

  keyLayerConfig = {
    goHome: {
      shortcut: 'g q',
      description: 'Go back to the documents screen',
      action: this.goBack,
    },
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
  }

  makeTreed(db: any) {
    if (this.state.treed) {
      this.state.treed.destroy()
      this._unsubs.forEach(f => f())
      this._unsubs = []
    }
    this.props.updateFile(this.props.id, 'last_opened', Date.now())
    const treed = window._treed = new Treed(
      treedPouch(this.state.db),
      plugins,
      viewTypes,
      this.props.id,
      loadSharedViewData(this.props.id),
      // (this.state.sharedViewData || {})
    )
    this._unsubs.push(treed.on(['node:root'], () => {
      this.onTitleChange(treed.db.data.root.content)
    }))
    // TODO actually get the user shortcuts
    const userShortcuts = {}
    const globalLayer = makeKeyLayer({
      ...this.keyLayerConfig,
      ...makeViewTypeLayerConfig(viewTypes, this.setViewType),
    }, 'global', userShortcuts)
    treed.addKeyLayer(() => treed.isCurrentViewInInsertMode() ? null : globalLayer)
    treed.ready.then(() => {
      this.props.setTitle(<ViewTypeSwitcher
        globalStore={treed.globalStore}
      />)

      this.onTitleChange(treed.db.data.root.content)
      const viewState = loadLastViewState(this.props.id)
      if (!viewState.viewType) viewState.viewType = 'list'
      const store = treed.registerView(viewState)
      this._unsubs.push(store.on([store.events.serializableState()], () => {
        const state = treed.serializeViewState(store.id)
        // TODO debounce
        saveLastViewState(this.props.id, state)
      }))
      this._unsubs.push(store.on([store.events.sharedViewData()], () => {
        saveSharedViewData(this.props.id, store.sharedViewData)
      }))
      this._unsubs.push(store.on([store.events.viewType()], () => {
        this.setState({})
      }))
      this.setState({
        treed,
        store,
      })
    })
  }

  setViewType = (type: string) => {
    if (this.state.store.state.viewType === type) return
    if (this.state.treed) {
      this.state.treed.changeViewType(
        this.state.treed.globalState.activeView,
        type,
      )
    }
  }

  onTitleChange(title: string) {
    document.title = title
    // this.props.setTitle(title)
    const id = this.props.id
    this.props.updateFile(id, 'title', title)
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.userSession && !this.props.userSession) {
      this._unsubs.push(nextProps.userSession.syncDoc(this.state.db, nextProps.id, syncState => {
        this.setState({syncState})
      }))
    }
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
    this._unsubs.forEach(f => f())
  }

  getActionButtons() {
    const allButtons = {}
    this.state.store.plugins.actionButtons.forEach(plugin => {
      Object.keys(plugin.buttons).forEach(key => {
        const id = plugin.id + ':' + key
        allButtons[id] = {...plugin.buttons[key], id}
      })
    })
    return activeButtons.map(key => allButtons[key])
  }

  render() {
    const {treed} = this.state
    if (!treed) {
      return <div className={css(styles.container, styles.loading)}>Loading...</div>
    }

    const actionButtons = this.getActionButtons()

    return <div className={css(styles.container)}>
      <Sidebar
        side="left"
        globalStore={treed.globalStore}
        plugins={treed.config.plugins}
      />
      <div className={css(styles.treedContainer) + ' Theme_basic'}>
        <ViewWrapper
          viewTypes={viewTypes}
          store={this.state.store}
        />

        {actionButtons.length > 0 &&
          <div className={css(styles.actionButtons)}>
            {actionButtons.map(button => (
              <div
                key={button.id}
                onClick={() => button.action(treed.activeView())}
                className={css(styles.actionButton)}
              >
                {button.title}
              </div>
            ))}
          </div>}
      </div>
      <Sidebar
        side="right"
        globalStore={treed.globalStore}
        plugins={treed.config.plugins}
      />

      <KeyCompleter
        treed={treed}
      />
      {this.state.searching &&
        <Searcher
          treed={treed}
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

  actionButtons: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    zIndex: 100000,
  },

  actionButton: {
    padding: '10px 20px',
    backgroundColor: '#80edff',
    borderRadius: 20,
  },

  syncState: {
    position: 'absolute',
    // top: 100,
    right: 10,
    fontSize: 10,
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
    //  position: 'relative',
  },
})
