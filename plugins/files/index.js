// @flow

import React from 'react'

import uuid from 'treed/uuid'
import Icon from 'treed/views/utils/Icon'
import type {Store, Plugin, GlobalStore} from 'treed/types'

import FileNode from './FileNode'

import * as storage from './storage'

type File = RemoteFile | LocalFile

type RemoteFile = {
  id: string,
  title: string,
  remoteId: string,
  owner: {
    profilePhoto: string,
    name: string,
    email: string,
    me: boolean,
  },
}

type LocalFile = {
  id: string,
  title: string,
  lastOpened: number,
  lastModified: number,
  size: number,
  sync: ?{
    owner: {
      profilePhoto: string,
      name: string,
      email: string,
      me: boolean,
    },
    remoteId: string,
    lastSyncTime: number,
    lastSyncVersion: number,
  },
}

const PLUGIN_ID = 'files'

const addFile = (files, id, title) => {
  // files[id] =
  storage.updateFile(files, id, {
    id,
    title,
    lastOpened: Date.now(),
    lastModified: Date.now(),
    size: 0,
    sync: null,
  })
}

// Need to set "default node type" to "file"
// And "default node contents" to "Untitled"
const plugin: Plugin<*, *> = {
  id: PLUGIN_ID,

  init(globalConfig: any, globalStore: GlobalStore) {
    return storage.loadFiles().then(files => {

    const {documentId} = globalStore.globalState
    if (documentId && files[documentId]) {
      storage.updateFile(files, documentId, {
        lastOpened: Date.now(),
        size: Object.keys(globalStore.db.data).length - 1,
      })
      // 1 for the settings node
      if (files[documentId].title !== globalStore.db.data.root.content) {
        globalStore.actions.set('root', 'content', files[documentId].title)
      }
    }

    storage.onChange(
      (id, update) => {
        files[id] = {...files[id], ...update}
        globalStore.emit('file:' + id)
      },
      newFiles => {
        for (let id in newFiles) {
          files[id] = newFiles[id]
          globalStore.emit('file:' + id)
        }
      }
    )

    /*
    const subs = []
    globalStore.onIntent('navigate-to-file', (viewId, nodeId) => {
      const node = globalStore.db.data[nodeId]
      if (node.type === 'file') {
        const {fileid} = node.types.file || {}
        if (fileid) {
          onOpenFile(files, fileid)
        }
      }
    })
    */

    return {files, addFile: addFile.bind(null, files)}
    })
  },

  actions: {
    navigateToFile(store, id=store.state.active) {
      const node = store.getters.node(id)
      if (node.types.file.fileid) {
        store.emitIntent('navigate-to-file', node.types.file.fileid)
      } else {
        const fileid = uuid()
        store.actions.setNested(id, ['types', 'file', 'fileid'], fileid)
        store.globalState.plugins[PLUGIN_ID].addFile(fileid, node.content)
        store.emitIntent('navigate-to-file', fileid)
      }
    },
  },

  nodeTypes: {
    file: {
      title: 'File',
      newSiblingsShouldCarryType: false,
      // TODO hook this up
      /*
      warnOnTypeChange: (store: Store, node: any) => {
        return getDatabaseNames().then(names => {
          if (names.indexOf(`_pouch_doc_${node._id}`) !== -1) {
            return `Changing this type away from "file" will delete the associated contents.`
          }
        })
      },
      */
      // TODO hook this up
      onTypeChange: (store: Store, node: any) => {
        window.indexedDB.deleteDatabase(`_pouch_doc_${node._id}`)
      },
      // TODO hook this up
      onDelete: (store: Store, node: any) => {
        window.indexedDB.deleteDatabase(`_pouch_doc_${node._id}`)
        // TODO maybe delete the synced one?
      },
      shortcut: 'f',
      attributeColumns: {
        lastOpened: {
          editable: false,
          title: 'Last opened',
        },
        size: {
          editable: false,
          title: 'Size',
        },
      },

      /*
      contextMenu: (typeData, node, store) => {
        return {
          text: 'Synced',
          checked: !!typeData.synced,
          action: () => {
            store.actions.setNested(node._id, ['types', 'file', 'synced'], !typeData.synced)
            if (!typeData.synced) {
              // Am I just organizing this wrong? There should be a better way
              // to indicate to outside ppl what's going on.
              store.actions.setActive(node._id)
              store.emit('file:setup sync')
            }
            // TODO
          },
        }
      },
      */

      defaultNodeConfig() {
        return {
          // When null, that means the file hasn't been created.
          // It'll be created when you click on it.
          fileid: null,
        }
      },

      actions: {
        navigate: {
          shortcuts: {
            normal: 'enter',
          },
          description: 'Navigate to file',
          action(store) {
            store.actions.navigateToFile()
          }
        },
      },

      render: ({store, node}) => {
        return <FileNode store={store} node={node} />
      }
    },
  },
}
export default plugin

