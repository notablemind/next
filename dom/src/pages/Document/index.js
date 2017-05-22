// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'
import {hashHistory} from 'react-router'

import Treed from 'treed'
import treedPouch from 'treed/pouch'
import makeKeyLayer from 'treed/keys/makeKeyLayer'

import Sidebar from './Sidebar'
import Searcher from './Searcher'
import KeyCompleter from './KeyCompleter'
import ViewHeader from './ViewHeader'
import withStore from './withStore'
import Settings from '../Settings/DocumentSettings'
import QuickBar from './QuickBar'

import SyncStatus from '../Settings/Sync/Status'

import Icon from 'treed/views/utils/Icon'

import type {Store, Plugin} from 'treed/types'

const plugins: Array<Plugin<any, any>> = [
  require('../../../../plugins/files').default,
  require('../../../../plugins/minimap').default,
  require('../../../../plugins/themes').default,
  require('../../../../plugins/todos/dom').default,
  require('../../../../plugins/image/dom').default,
  require('../../../../plugins/date/dom').default,
  require('../../../../plugins/scriptures').default,
  require('../../../../plugins/tags').default,
  require('../../../../plugins/browser').default,
  require('../../../../plugins/export').default,
  require('../../../../plugins/basics').default,
  require('../../../../plugins/code').default,
  require('../../../../plugins/text-actions').default,
  require('../../../../plugins/debug').default,
  require('../../../../plugins/ratings').default,
]

const optionalPlugins = ['scriptures', 'browser']
const defaultPlugins = plugins
  .map(pl => pl.id)
  .filter(id => optionalPlugins.indexOf(id) === -1)
// const defaultPlugins = ['minimap', 'themes', 'todos', 'image', 'date', 'tags']
// const alwaysPlugins = ['files', 'themes', 'todos', 'image']

const viewTypes = {
  list: require('treed/views/list').default,
  whiteboard: require('treed/views/whiteboard').default,
  search: require('treed/views/search').default,
  trash: require('treed/views/trash').default,
}

const activeButtons = [] // ['date:newEntry']

type DbT = any

const makeViewTypeQuickActions = (viewTypes, setViewType) => {
  return Object.keys(viewTypes).map(key => ({
    key: 'set_view_type_' + key,
    id: 'set_view_type_' + key,
    title: 'Set view type: ' + viewTypes[key].title,
    action: () => setViewType(key),
  }))
}

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

const viewStateKey = id => `last-view-state:${id}`
const loadLastViewState = id =>
  maybeLoad(viewStateKey(id)) || {
    viewType: 'list',
    root: 'root',
  }
const saveLastViewState = (id, data) =>
  (localStorage[viewStateKey(id)] = JSON.stringify(data))

const DocumentPage = ({params, ...props}: any) => (
  <Document key={params.id || 'root'} id={params.id} {...props} />
)
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
  displayName: 'ViewWrapper',
  events: store => [store.events.viewType()],
  state: store => ({
    viewType: store.getters.viewType(),
  }),
  render({store, viewTypes, viewType}) {
    const Component = viewTypes[viewType].Component
    return (
      <div style={{flex: 1}}>
        <ViewHeader store={store} viewTypes={viewTypes} />
        <Component store={store} />
      </div>
    )
  },
})

type OverlayState =
  | {
      type: 'search',
      tagIds: string[],
      query: string,
    }
  | {
      type: 'list',
      root: string,
    }

class Document extends Component {
  state: {
    db: any,
    treed: ?Treed,
    store: any,
    // sharedViewData: any,
    syncState: string,
    shouldSync: boolean,
    showingSettings: ?string,
    showingSyncSettings: boolean,
    tick: number,
    overlayState: ?OverlayState,
    quick: ?('search' | 'open' | 'command'),
  }
  _unsubs: Array<() => void>

  constructor({id, userSession}: any) {
    super()
    console.log('Document constructor', id)
    this.state = {
      db: null,
      quick: null,
      treed: null,
      store: null,
      // sharedViewData: loadSharedViewData(props.id),
      syncState: 'unsynced',
      shouldSync: false,
      showingSettings: null,
      showingSyncSettings: false,
      tick: 0,
      overlayState: null,
      // panesSetup,
    }
    this._unsubs = []
  }

  componentDidMount() {
    this.props.nm.getFileDb(this.props.id || 'home').then(db => {
      this.setState({db}, () => this.makeTreed('a root you know'))
    })
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('dragover', this.onDrag)
    window.addEventListener('paste', this.onPaste)
    window.addEventListener('drop', this.onDrop)
  }

  goBack = () => {
    if (this.state.treed) {
      const numItems = Object.keys(this.state.treed.db.data).length
      // this.props.updateFile(this.props.id, ['types', 'file', 'size'], numItems)
    }
    hashHistory.push('/')
  }

  quickCommands = [
    {
      id: 'go_home',
      title: 'Go home',
      action: this.goBack,
    },
    {
      id: 'undo',
      title: 'Undo the last action',
      action: () => this.state.treed && this.state.treed.activeView().undo(),
    },
    {
      id: 'redo',
      title: 'Redo the last action',
      action: () => this.state.treed && this.state.treed.activeView().redo(),
    },
    {
      id: 'settings_plugins',
      title: 'Settings: plugins',
      action: () => this.setState({showingSettings: 'Plugins'}),
    },
    {
      id: 'settings_sync',
      title: 'Settings: files & sync',
      action: () => this.setState({showingSettings: 'Files & Sync'}),
    },
    {
      id: 'settings_code',
      title: 'Settings: code, kernels, connections',
      action: () => this.setState({showingSettings: 'Code'}),
    },
  ]

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
      action: () => this.setState({quick: 'search'}),
    },
    open: {
      shortcut: 'cmd+p',
      description: 'Open file',
      action: () => this.setState({quick: 'open'}),
    },
    command: {
      shortcut: 'cmd+P',
      description: 'Quick command',
      action: () => this.setState({quick: 'command'}),
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
    if (this.state.treed) {
      this.state.treed.handleKey(e)
    }
  }

  makeTreed(title: string) {
    if (this.state.treed) {
      this.state.treed.destroy()
      this._unsubs.forEach(f => f())
      this._unsubs = []
    }
    // TODO maybe let other docs have nested docs. could be cool

    const db = this.state.db // treedPouch(this.state.db)

    const treedPlugins = plugins.map(plugin => {
      if (typeof plugin === 'function') {
        return plugin({nm: this.props.nm, db, id: this.props.id, title})
      }
      return plugin
    })

    const treed = (window._treed = new Treed(
      db,
      treedPlugins,
      viewTypes,
      this.props.id,
      {
        sharedViewData: loadSharedViewData(this.props.id),
        defaultRootContents: title,
        defaultPlugins,
        initialClipboard: window.sharedClipboard,
      },
    ))
    this._unsubs.push(
      treed.on(['node:root'], () => {
        this.onTitleChange(treed.db.data.root.content)
      }),
    )
    // TODO actually get the user shortcuts
    const userShortcuts = {}
    const globalLayer = makeKeyLayer(
      {
        ...this.keyLayerConfig,
        ...makeViewTypeLayerConfig(viewTypes, this.setViewType),
      },
      'global',
      userShortcuts,
    )
    treed.addKeyLayer(
      () => (treed.isCurrentViewInInsertMode() ? null : globalLayer),
    )
    treed.ready.then(() => {
      this.onTitleChange(treed.db.data.root.content)
      const viewState = loadLastViewState(this.props.id)
      if (!viewState.viewType) viewState.viewType = 'list'
      const store = treed.registerView(viewState)
      this._unsubs.push(
        store.on([store.events.serializableState()], () => {
          const state = treed.serializeViewState(store.id)
          saveLastViewState(this.props.id, state)
        }),
      )
      this._unsubs.push(
        store.on([store.events.clipboardChanged()], () => {
          window.sharedClipboard = treed.globalStore.globalState.clipboard
        }),
      )
      this._unsubs.push(
        store.on([store.events.sharedViewData()], () => {
          saveSharedViewData(this.props.id, store.sharedViewData)
        }),
      )
      this._unsubs.push(store.onIntent('filter-by-tag', this.onTagFilter))
      this._unsubs.push(
        store.onIntent('navigate-to-file', (_, id) => this.onNavigate(id)),
      )
      this._unsubs.push(
        store.on([store.events.viewType()], () => {
          this.setState({})
        }),
      )
      this.setState({
        treed,
        store,
        tick: this.state.tick + 1,
      })
    })
  }

  onTagFilter = (viewId: string, tagid: string) => {
    // if (viewId !== store.id) return
    this.setState({
      overlayState: {
        type: 'search',
        tagIds: [tagid],
        query: '',
      },
    })
  }

  onNavigate = (fileid: string) => {
    hashHistory.push('/doc/' + fileid)
  }

  onSetPlugins = (ids: string[]) => {
    const {treed} = this.state
    if (!treed) return
    const plugins = treed.config.plugins
    const settings = treed.db.data.settings
    const pluginSettings = defaultPlugins
      .concat(ids)
      .reduce(
        (obj, pid) =>
          ((obj[pid] = settings.plugins[pid] ||
          plugins[pid].defaultGlobalConfig || {}), obj),
        {},
      )
    treed.db
      .save({
        ...settings,
        plugins: pluginSettings,
      })
      .then(() => {
        this.makeTreed('')
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
    const id = this.props.id
    // this.props.updateFile(id, ['content'], title)
  }

  componentWillReceiveProps(nextProps: any) {
    if (
      this.state.shouldSync &&
      nextProps.userSession &&
      !this.props.userSession
    ) {
      this._unsubs.push(
        nextProps.userSession.syncDoc(
          this.state.db,
          nextProps.id,
          syncState => {
            this.setState({syncState})
          },
        ),
      )
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('dragover', this.onDrag)
    window.removeEventListener('paste', this.onPaste)
    window.removeEventListener('drop', this.onDrop)
    if (this.state.treed) {
      this.state.treed.destroy()
    }
    this._unsubs.forEach(f => f())
    if (this.state.db) {
      if (this.state.db.destroy) {
        // give it some time to flush things
        setTimeout(() => {
          this.state.db.destroy()
        }, 500)
      }
    }
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

  renderActionButtons() {
    const {treed} = this.state
    const actionButtons = this.getActionButtons()
    if (!actionButtons.length || !treed) return null
    return (
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
      </div>
    )
  }

  renderHeader() {
    let traffic = null
    // TODO support windows-style windows buttons too?
    if (ELECTRON) {
      traffic = <div style={{flexBasis: 80}} />
    }

    const backButton = this.props.id
      ? // TODO if the last doc wasn't home, indicate that
        <div
          className={css(styles.homeButton)}
          onClick={() => window.history.back()}
        >
          <Icon name="ios-arrow-left" className={css(styles.homeArrow)} />
          <div className={css(styles.homeText)}>
            Home
          </div>
        </div>
      : null

    return (
      <div className={css(styles.top)}>
        {traffic}
        {backButton}
        <Icon name="ios-trash-outline" className={css(styles.trashcan)} />
        <div className={css(styles.title)}>
          {this.state.store.db.data.root.content}
        </div>
        <SyncStatus
          docid={this.props.id}
          nm={this.props.nm}
          onClick={() => this.setState({showingSettings: 'Files & Sync'})}
        />
        <Icon
          name="ios-settings"
          onClick={() => this.setState({showingSettings: 'Plugins'})}
          className={css(styles.settings)}
        />
      </div>
    )
  }

  extraCommands() {
    const config = viewTypes[this.state.store.state.viewType]
    const viewActions = config.quickActions ? config.quickActions(this.state.store, this.state.store.getters.activeNode()) : []
    return this.quickCommands
      .concat(makeViewTypeQuickActions(viewTypes, this.setViewType))
      .concat(viewActions)
  }

  render() {
    const {treed} = this.state
    if (!treed) {
      return (
        <div className={css(styles.container, styles.loading)}>Loading...</div>
      )
    }

    return (
      <div className={css(styles.container)}>
        {this.renderHeader()}
        <div className={css(styles.main)}>
          <Sidebar
            side="left"
            globalStore={treed.globalStore}
            plugins={treed.enabledPlugins}
          />
          <div className={css(styles.treedContainer) + ' Theme_basic'}>
            <ViewWrapper
              key={'view:' + this.state.tick}
              viewTypes={viewTypes}
              store={this.state.store}
            />

            {this.renderActionButtons()}
          </div>
          <Sidebar
            side="right"
            globalStore={treed.globalStore}
            plugins={treed.enabledPlugins}
          />

          <KeyCompleter treed={treed} />
          {this.state.quick &&
            <QuickBar
              treed={treed}
              store={this.state.store}
              nm={this.props.nm}
              extraCommands={this.extraCommands()}
              onOpen={file => this.onNavigate(file.id)}
              initialTab={this.state.quick}
              onClose={() => this.setState({quick: null})}
            />}
          {this.state.showingSettings &&
            <Settings
              treed={treed}
              nm={this.props.nm}
              store={this.state.store}
              initialTab={this.state.showingSettings}
              onClose={() => this.setState({showingSettings: null})}
              onSetPlugins={this.onSetPlugins}
              optionalPlugins={optionalPlugins}
            />}
        </div>
      </div>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  top: {
    WebkitAppRegion: 'drag',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
    height: 76 / 2,
    backgroundColor: '#fafafa',
  },

  title: {
    flex: 1,
    alignItems: 'center',
  },

  trashcan: {
    WebkitAppRegion: 'no-drag',
    cursor: 'pointer',
    fontSize: 20,
    // height: 27,
    padding: '0 4px',
    borderRadius: 4,
    color: '#aaa',
    ':hover': {
      color: 'black',
      backgroundColor: '#eee',
    },
  },

  settings: {
    color: '#aaa',
    WebkitAppRegion: 'no-drag',
    cursor: 'pointer',
    fontSize: 24,
    padding: '0 4px',
    borderRadius: 4,
    marginRight: 5,
    ':hover': {
      color: 'black',
      backgroundColor: '#eee',
    },
  },

  homeButton: {
    WebkitAppRegion: 'no-drag',
    fontSize: 14,
    height: 22,
    fontWeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0 4px',
    marginRight: 4,
    borderRadius: 4,
    color: '#aaa',
    ':hover': {
      color: 'black',
      backgroundColor: '#eee',
    },
  },

  homeArrow: {
    marginRight: 5,
    height: 13,
  },

  main: {
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
