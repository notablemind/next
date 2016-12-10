// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'
import uuid from '../../utils/uuid'

/*
const organizeFolders = (folders, docs, sortBy, sortDir) => {
  const map = {root: {children: []}}
  folders.forEach(folder => {
    map[folder.id] = {folder, children: []}
  })
  folders.forEach(folder => {
    map[folder.folder || 'root'].children.push(folder)
  })
  docs.forEach(doc => {
    map[doc.folder || 'root'].children.push(doc)
  })
  return map
}
*/

const organizeFolders = (rows) => {
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
  id: string,
  type: 'folder',
  folder: ?string,
  title: string,
}

type DocT = {
  id: string,
  type: 'doc',
  folder: ?string,
  title: string,
}

type Props = {
  userDb: any,
}

type PouchChange = any // TODO can be polymorphic

export default class Browse extends Component {
  state: {
    sortBy: string,
    sortReverse: bool,
    settings: ?Object,
    children: {[key: string]: Array<string>},
    map: {[key: string]: FolderT | DocT},
  }

  constructor(props: Props) {
    super()
    this.state = {
      sortBy: 'title',
      sortReverse: false,
      settings: null,
      children: {},
      map: {},
    }

    if (props.userDb) this.listen(props.userDb)
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.userDb && !this.props.userDb) {
      this.listen(nextProps.userDb)
    }
  }

  onChange = (change: PouchChange) => {
    const id = change.doc._id
    if (change.doc._deleted) {
      const map = {...this.state.map}
      const parent = map[id].folder || 'root'
      delete map[id]
      this.setState({
        map,
        children: {
          ...this.state.children,
          [parent]: this.state.children[parent].splice(
            this.state.children[parent].indexOf(id), 1)
        },
      })
      return
    }

    let children = this.state.children
    if (this.state.map[id]) {
      if (change.doc.folder !== this.state.map[id].folder) {
        const prev = this.state.map[id].folder || 'root'
        const next = change.doc.folder || 'root'
        children = {
          ...children,
          // TODO respect current sort order
          [prev]: children[prev].splice(children[prev].indexOf(id), 1),
          [next]: children[next].concat([id]),
        }
      }
    } else {
      const parent = change.doc.folder || 'root'
      children = {
        ...children,
        // TODO respect sort order
        [parent]: children[parent].concat([id]),
      }
    }

    this.setState({
      children,
      map: {
        ...this.state.map,
        [change.doc._id]: change.doc,
      },
    })
  }

  listen(userDb: any) {
    userDb.changes({
      include_docs: true,
      live: true,
      since: 'now',
    })
    .on('change', this.onChange)
    .on('error', err => {
      console.log('error syncing', err)
    })

    userDb.allDocs({include_docs: true}).then(result => {
      console.log('alldocs', result.rows)
      this.setState(organizeFolders(result.rows))
    }, err => {
      console.log('failed to get docs list', err)
    })
  }

  onNewFile = () => {
    this.props.userDb.put({
      _id: uuid(),
      type: 'doc',
      title: 'New document',
      folder: null,
      size: 0,
      last_updated: Date.now(),
      last_opened: Date.now(),
    })
  }

  onNewFolder = () => {
    this.props.userDb.put({
      _id: uuid(),
      type: 'folder',
      title: 'New folder',
      folder: null,
      size: 0,
      last_updated: Date.now(),
      last_opened: Date.now(),
    })
  }

  render() {
    return <div>
      <div>
        Browse
        <button
          onClick={this.onNewFile}
        >
          New file
        </button>
        <button
          onClick={this.onNewFolder}
        >
          New folder
        </button>
      </div>
      <Folder
        map={this.state.map}
        children={this.state.children}
        folder={{id: 'root', title: 'All Documents'}}
      />
    </div>
  }
}

const Folder = ({map, children, folder}) => (
  <div>
    <div>{folder.title}</div>
    {(children[folder.id] || []).map(id => (
      map[id].type === 'folder' ?
        <Folder key={id} map={map} children={children} folder={map[id]} /> :
        <Doc key={id} doc={map[id]} />
    ))}
  </div>
)

const Doc = ({doc}) => (
  <div>{doc.title}</div>
)



