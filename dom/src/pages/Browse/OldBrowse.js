// @-flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'
import uuid from '../../utils/uuid'
import {hashHistory} from 'react-router'

import KeyManager from 'treed/keys/Manager'
import makeKeyLayer from 'treed/keys/makeKeyLayer'
import SettingsModal from './Settings/SettingsModal'

import ContextMenu from 'treed/views/context-menu/ContextMenu'

import type {MenuItem} from 'treed/types'

const organizeFolders = rows => {
  const map = {}
  const children = {root: []}
  let settings = null
  rows.forEach(({doc}) => {
    if (doc._id === 'settings') {
      settings = doc
    } else {
      map[doc._id] = doc
      if (doc.folder) {
        if (!children[doc.folder]) {
          children[doc.folder] = []
        }
        children[doc.folder].push(doc._id)
      } else {
        children.root.push(doc._id)
      }
    }
  })
  return {map, children, settings}
}

type FolderT = {
  _id: string,
  _rev: string,
  type: 'folder',
  folder: ?string,
  title: string
}

type DocT = {
  _id: string,
  _rev: string,
  type: 'doc',
  folder: ?string,
  title: string,
  last_opened: number,
  size: number
}

type Props = {
  userDb: any
}

type PouchChange = any // TODO can be polymorphic

export default class Browse extends Component {
  keyManager: KeyManager
  state: {
    // sortBy: string,
    // sortReverse: bool,
    settings: ?Object,
    // children: {[key: string]: Array<string>},
    // map: {[key: string]: FolderT | DocT},
    data: {[key: string]: any},
    menu?: ?{
      pos: {left: number, top: number},
      items: Array<MenuItem>
    },
    local?: any,
    remote?: any,
    showSettings?: boolean
  }

  changes: any

  constructor(props: Props) {
    super()
    this.state = {
      // sortBy: 'title',
      // sortReverse: false,
      settings: null,
      // children: {},
      // map: {},
      data: {
        root: {
          _id: 'root',
          title: 'Root',
          children: []
        }
      },
      selected: 0,
      local: null,
      remote: null
    }

    window.browse = this

    if (props.userDb) this.listen(props.userDb)
  }

  componentDidMount() {
    this.keyManager = new KeyManager([
      makeKeyLayer(
        {
          goDown: {
            shortcut: 'j, down',
            action: this.goDown,
            description: 'go down'
          }
        },
        'browse.',
        {}
      )
    ])
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.userDb && !this.props.userDb) {
      this.listen(nextProps.userDb)
    }
  }

  goDown = () => {
    // TODO
  }

  onChange = ({doc}: PouchChange) => {
    console.log('on change!', doc)
    const id = doc._id
    if (doc._deleted) {
      console.log('IGNORING DELETION')
      // ignoring for the moment
      return
    }

    const data = {...this.state.data, [doc._id]: doc}
    this.setState({data})
  }

  listen(userDb: any) {
    this.changes = userDb
      .changes({
        include_docs: true,
        live: true,
        since: 'now'
      })
      .on('change', this.onChange)
      .on('error', err => {
        console.log('error syncing', err)
      })

    userDb.allDocs({include_docs: true}).then(
      result => {
        console.log('alldocs', result.rows)
        const data = {
          root: {_id: 'root', children: [], title: 'Root', type: 'folder'}
        }
        result.rows.forEach(({doc}) => {
          doc.children = doc.children || []
          data[doc._id] = doc
        })
        result.rows.forEach(({doc}) => {
          if (doc._id === 'root') return
          if (!doc.parent) {
            doc.parent = 'root'
            data.root.children.push(doc._id)
          } else if (data[doc.parent].children.indexOf(doc._id)) {
            data[doc.parent].children.push(doc._id)
          }
        })
        this.setState({data})
        // TODO: backfill
        // this.setState(organizeFolders(result.rows))
      },
      err => {
        console.log('failed to get docs list', err)
      }
    )
  }

  componentWillUnmount() {
    this.changes.cancel()
  }

  onNewFile = () => {
    this.props.userDb.put({
      _id: uuid(),
      type: 'doc',
      title: 'New document',
      parent: 'root',
      size: 0,
      modified: Date.now(),
      opened: Date.now()
    })
    // TODO add to children
    // but really, let's just use treed, for reals
  }

  onNewFolder = () => {
    this.props.userDb.put({
      _id: uuid(),
      type: 'folder',
      title: 'New folder',
      folder: null,
      size: 0,
      modified: Date.now(),
      opened: Date.now()
    })
  }

  onOpen = (id: string) => {
    hashHistory.push('/doc/' + id)
  }

  onDelete = (id: string) => {
    return console.error('not deleting')
    /*
    if (!this.props.userDb) return
    if (!confirm('Really delete?')) {
      // TODO ditch the alert
      return
    }
    const map = {...this.state.map}
    delete map[id]
    const children = {...this.state.children}
    delete children[id]
    this.setState({map, children})
    this.props.userDb.put({
      _id: id,
      _rev: this.state.map[id]._rev,
      _deleted: true,
    })
    */
  }

  startSyncing = (doc: any) => {
    this.props.userSession.setupSyncing(doc._id).then(
      () => {
        this.props.userDb.put({
          ...doc,
          synced: true
        })
      },
      err => {
        console.error('failure', err)
        // umm
      }
    )
  }

  onContextMenu = (evt: any, doc: any) => {
    evt.preventDefault()
    evt.stopPropagation()
    const actions = [
      {
        text: 'Open',
        action: () => this.onOpen(doc._id)
      },
      {
        text: 'Open in new tab',
        action: () => window.open(`#/doc/${doc._id}`, '_blank')
      },
      {
        text: 'Delete',
        action: () => this.onDelete(doc._id)
      }
    ]
    // if (!doc.synced) {
    actions.push({
      text: 'Start syncing',
      action: () => this.startSyncing(doc)
    })
    // }
    this.setState({
      menu: {
        pos: {left: evt.clientX, top: evt.clientY},
        items: actions
      }
    })
  }

  render() {
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.buttons)}>
          <button onClick={this.onNewFile}>
            New file
          </button>
          <button onClick={this.onNewFolder}>
            New folder
          </button>
          <button onClick={() => this.setState({showSettings: true})}>
            Settings
          </button>
        </div>
        <Folder
          data={this.state.data}
          folder={this.state.data.root}
          onOpen={this.onOpen}
          onContextMenu={this.onContextMenu}
        />
        {this.state.menu &&
          <ContextMenu
            pos={this.state.menu.pos}
            menu={this.state.menu.items}
            onClose={() => this.setState({menu: null})}
          />}
        {this.state.showSettings &&
          <SettingsModal
            onClose={() => this.setState({showSettings: false})}
            data={this.state.data}
          />}
      </div>
    )
  }
}

const Folder = ({data, folder, onOpen, onContextMenu}) => (
  <div className={css(styles.folderContainer)}>
    <div
      className={css(
        styles.item,
        styles.folder,
        folder._id === 'root' && styles.rootName
      )}
      // onContextMenu={evt => onContextMenu(evt, folder._id)}
    >
      {folder.title}
    </div>
    <div
      className={css(
        styles.children,
        folder._id === 'root' && styles.rootChildren
      )}
    >
      {folder.children.map(
        id =>
          data[id].type === 'folder'
            ? <Folder
                key={id}
                data={data}
                onOpen={onOpen}
                onContextMenu={onContextMenu}
                folder={data[id]}
              />
            : <Doc
                key={id}
                doc={data[id]}
                onOpen={onOpen}
                onContextMenu={onContextMenu}
              />
      )}
    </div>
  </div>
)

const Doc = ({doc, onOpen, onContextMenu}) => (
  <div
    className={css(styles.item, styles.doc)}
    onContextMenu={evt => onContextMenu(evt, doc)}
    onClick={() => onOpen(doc._id)}
  >
    <div className={css(styles.itemTitle)}>
      {doc.title}
    </div>
    <div className={css(styles.synced)}>
      {doc.synced ? 'Synced' : 'Not synced'}
    </div>
    <div className={css(styles.size)}>
      {doc.size}
    </div>
    <div className={css(styles.lastOpened)}>
      {doc.last_opened ? new Date(doc.last_opened).toLocaleDateString() : ''}
    </div>
  </div>
)

const styles = StyleSheet.create({
  container: {
    width: 800,
    maxWidth: '100%',
    alignSelf: 'center'
  },

  buttons: {
    alignSelf: 'center',
    flexDirection: 'row'
  },

  itemTitle: {
    flex: 1
  },

  doc: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  synced: {
    fontSize: 10,
    padding: '0 10px'
  },

  lastOpened: {
    fontSize: '80%',
    marginLeft: 10
  },

  item: {
    padding: '10px 20px',
    cursor: 'pointer',
    borderBottom: '1px solid #ccc',
    borderRight: '1px solid #ccc',
    borderLeft: '1px solid #ccc',

    ':hover': {
      backgroundColor: '#eee'
    }
  },

  rootName: {
    border: '1px solid #ccc',
    display: 'none'
  },

  children: {
    marginLeft: 20
    // paddingLeft: 20,
    // borderLeft: '1px solid #ccc',
  },

  rootChildren: {
    marginLeft: 0,
    borderTop: '1px solid #ccc'
  },

  folder: {}
})
