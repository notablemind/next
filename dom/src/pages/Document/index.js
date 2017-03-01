// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'
import {hashHistory} from 'react-router'

import Treed from 'treed'
import treedPouch from 'treed/pouch'
import makeKeyLayer from 'treed/keys/makeKeyLayer'
import getFileDb from '../utils/getFileDb'

import Sidebar from './Sidebar'
import Searcher from './Searcher'
import KeyCompleter from './KeyCompleter'
import ViewTypeSwitcher from './ViewTypeSwitcher'
import ViewHeader from './ViewHeader'
import withStore from './withStore'
import Settings from '../Settings/DocumentSettings'

import Icon from 'treed/views/utils/Icon'

import type {Store} from 'treed/types'

const plugins = [
  require('../../../../plugins/files').default,
  require('../../../../plugins/minimap').default,
  require('../../../../plugins/themes').default,
  require('../../../../plugins/todos/dom').default,
  require('../../../../plugins/image/dom').default,
  require('../../../../plugins/date/dom').default,
  require('../../../../plugins/scriptures').default,
  require('../../../../plugins/tags').default,
  require('../../../../plugins/browser').default,
]

const pluginMap = plugins.reduce((obj, pl) => (obj[pl.id] = pl, obj), {})

const optionalPlugins = ['scriptures', 'browser']
const defaultPlugins = plugins.map(pl => pl.id).filter(id => optionalPlugins.indexOf(id) === -1)
// const defaultPlugins = ['minimap', 'themes', 'todos', 'image', 'date', 'tags']
// const alwaysPlugins = ['files', 'themes', 'todos', 'image']

const viewTypes = {
  list: require('treed/views/list').default,
  whiteboard: require('treed/views/whiteboard').default,
  search: require('treed/views/search').default,
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

const DocumentPage = ({params, ...props}: any) => <Document key={params.id || 'root'} id={params.id} {...props} />
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
    shouldSync: boolean,
    showingSettings: boolean,
    tick: number,
    overlayState: ?({
      type: 'search',
      tagIds: string[],
      query: string,
    } | {
      type: 'list',
      root: string,
    }),
  }
  _unsubs: Array<() => void>

  constructor({id, userSession}: any) {
    super()
    console.log('Document constructor', id)
    this.state = {
      db: null, // getFileDb(id),
      searching: false,
      treed: null,
      store: null,
      // sharedViewData: loadSharedViewData(props.id),
      syncState: 'unsynced',
      shouldSync: false,
      showingSettings: false,
      tick: 0,
      overlayState: null,
      // panesSetup,
    }
    this._unsubs = [
    ]
  }

  componentDidMount() {
    getFileDb(this.props.id).then(db => {
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

  makeTreed(title: string) {
    if (this.state.treed) {
      this.state.treed.destroy()
      this._unsubs.forEach(f => f())
      this._unsubs = []
    }
    // TODO maybe let other docs have nested docs. could be cool

    const treed = window._treed = new Treed(
      treedPouch(this.state.db),
      plugins,
      viewTypes,
      this.props.id,
      loadSharedViewData(this.props.id),
      title,
      defaultPlugins,
      // plugins.map(pl => pl.id).filter(id => optionalPlugins.indexOf(id) === -1),
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
      this.onTitleChange(treed.db.data.root.content)
      const viewState = loadLastViewState(this.props.id)
      if (!viewState.viewType) viewState.viewType = 'list'
      const store = treed.registerView(viewState)
      this._unsubs.push(store.on([store.events.serializableState()], () => {
        const state = treed.serializeViewState(store.id)
        saveLastViewState(this.props.id, state)
      }))
      this._unsubs.push(store.on([store.events.sharedViewData()], () => {
        saveSharedViewData(this.props.id, store.sharedViewData)
      }))
      this._unsubs.push(store.onIntent('filter-by-tag', this.onTagFilter))
      this._unsubs.push(store.onIntent('navigate-to-file', this.onNavigate))
      this._unsubs.push(store.on([store.events.viewType()], () => {
        this.setState({})
      }))
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

  onNavigate = (viewId: string, fileid: string) => {
    hashHistory.push('/doc/' + fileid)
  }

  onSetPlugins = (ids: string[]) => {
    const {treed} = this.state
    if (!treed) return
    const plugins = treed.config.plugins
    const settings = treed.db.data.settings
    const pluginSettings = defaultPlugins.concat(ids).reduce((obj, pid) => (
      obj[pid] = settings.plugins[pid] || plugins[pid].defaultGlobalConfig || {}, obj
    ), {})
    treed.db.save({
      ...settings,
      plugins: pluginSettings,
    }).then(() => {
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
    if (this.state.shouldSync &&
        nextProps.userSession &&
        !this.props.userSession) {
      this._unsubs.push(nextProps.userSession.syncDoc(this.state.db, nextProps.id, syncState => {
        this.setState({syncState})
      }))
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
      if (this.state.db._changeStream) {
        // give it some time to flush things
        setTimeout(() => {
          this.state.db._changeStream.cancel()
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
    return <div className={css(styles.actionButtons)}>
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
  }

  renderHeader() {
    let traffic = null
    // TODO support windows-style windows buttons too
    if (ELECTRON) {
      /*
      const {remote} = require('electron')
      // const win = remote.getCurrentWindow()
      traffic = <div className={css(styles.traffic)}>
        <div
          onClick={() => remote.getCurrentWindow().close()}
          className={css(styles.trafficLight, styles.trafficClose)}
        />
        <div
          onClick={() => remote.getCurrentWindow().minimize()}
          className={css(styles.trafficLight, styles.trafficMinimize)}
        />
        <div
          onClick={() => remote.getCurrentWindow().setFullScreen(
            !remote.getCurrentWindow().isFullScreen()
          )}
          className={css(styles.trafficLight, styles.trafficFullScreen)}
        />
      </div>
      */
     traffic = <div style={{flexBasis: 80}} />
    }

    const backButton = this.props.id
      // TODO if the last doc wasn't home, indicate that
      ? <div className={css(styles.homeButton)}
        onClick={() => window.history.back()}
      >
      <Icon
        name="ios-arrow-left"
        className={css(styles.homeArrow)}
      />
        Home
      </div>
      : null

    return <div className={css(styles.top)}>
      {traffic}
      {backButton}
      <Icon
        name="ios-trash-outline"
        className={css(styles.trashcan)}
      />
      <div style={{flex: 1}} />
      <Icon
        name="ios-gear"
        onClick={() => this.setState({showingSettings: true})}
        className={css(styles.settings)}
      />
    </div>
  }

  render() {
    const {treed} = this.state
    if (!treed) {
      return <div className={css(styles.container, styles.loading)}>Loading...</div>
    }

    return <div className={css(styles.container)}>
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

        <KeyCompleter
          treed={treed}
        />
        {this.state.searching &&
          <Searcher
            treed={treed}
            onClose={() => this.setState({searching: false})}
          />}
        {this.state.showingSettings &&
          <Settings
            treed={treed}
            store={this.state.store}
            onClose={() => this.setState({showingSettings: false})}
            onSetPlugins={this.onSetPlugins}
            optionalPlugins={optionalPlugins}
          />}
      </div>
    </div>
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
  },

  trashcan: {
    WebkitAppRegion: 'no-drag',
    cursor: 'pointer',
    fontSize: 24,
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
    ':hover': {
      color: 'black',
      backgroundColor: '#eee',
    },
  },

  homeButton: {
    WebkitAppRegion: 'no-drag',
    height: 27,
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

  traffic: {
    flexDirection: 'row',
    margin: '4px 4px',
  },

  trafficLight: {
    width: 12,
    height: 12,
    border: '1px solid #aaa',
    borderRadius: '50%',
    margin: '0 4px',
    cursor: 'pointer',
  },

  trafficClose: {
    backgroundColor: '#fc605c',
    borderColor: '#df423f',
  },

  trafficMinimize: {
    backgroundColor: '#fdbc40',
    borderColor: '#dea442',
  },

  trafficFullScreen: {
    backgroundColor: '#34c84a',
    borderColor: '#1fa72d',
  },
})
