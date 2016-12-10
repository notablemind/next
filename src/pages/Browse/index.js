// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'
import uuid from '../../utils/uuid'

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

export default class Browse extends Component {
  constructor(props) {
    super()
    this.state = {
      sortBy: 'title',
      sortDir: 1,
      settings: null,
      children: {},
      map: {},
    }

    if (props.userDb) this.listen(props.userDb)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.userDb && !this.props.userDb) {
      this.listen(nextProps.userDb)
    }
  }

  listen(userDb) {
    userDb.changes({
      include_docs: true,
      live: true,
      since: 'now',
    }).on('change', change => {
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

      this.setState({
        children,
        map: {
          ...this.state.map,
          [change.doc._id]: change.doc,
        },
      })
    }).on('error' err => {
      console.log('error syncing', err)
    })

    userDb.allDocs({include_docs: true}).then(result => {
      const map = {}
      const children = {root: []}
      let settings = null
      result.rows.forEach(doc => {
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
      this.setState({
        map,
      })
    }, err => {
    })
                   /*
    userDb.query().$.subscribe(items => {
      if (!items) return
      let settings = {}
      let folders = []
      let docs = items.filter(item => {
        if (item.id === 'settings') {
          settings = item
          return false
        }
        if (item.type === 'folder') {
          folders.push(item)
          return false
        }
        return true
      })
      this.setState({
        map: organizeFolders(folders, docs, this.state.sortBy, this.state.sortDir),
        settings,
        folders,
        docs,
      })
    })
      */
  }

  onNewFile = () => {
    this.props.userDb.insert({
      type: 'doc',
      id: uuid(),
      title: 'New document',
      folder: null,
      size: 0,
      last_modified: Date.now(),
      last_updated: Date.now(),
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
      {this.state.map && <Folder
        map={this.state.map}
        folder={{id: 'root', title: 'All Documents'}}
      />}
    </div>
  }
}

const Folder = ({map, folder}) => (
  <div>
    <div>{folder.title}</div>
    {map[folder.id].children.map(child => (
      child.type === 'folder' ?
        <Folder map={map} folder={child} /> :
        <Doc doc={child} />
    ))}
  </div>
)

const Doc = ({doc}) => (
  <div>{doc.title}</div>
)



