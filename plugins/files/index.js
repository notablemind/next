// @flow

import React from 'react'

import uuid from 'treed/uuid'
import Icon from 'treed/views/utils/Icon'
import type {Store, Plugin, GlobalStore} from 'treed/types'

import FileNode from './FileNode'
import ImportModal from './ImportModal'
import showModal from './showModal'

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

/*
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
*/

// Need to set "default node type" to "file"
// And "default node contents" to "Untitled"
const plugin = ({nm}): Plugin<*, *> => ({
  id: PLUGIN_ID,

  init(globalConfig: any, globalStore: GlobalStore) {
    const {documentId} = globalStore.globalState
    if (documentId && nm.meta[documentId]) {
      nm.updateMeta(documentId, {
        lastOpened: Date.now(),
        size: Object.keys(globalStore.db.data).length - 1,
        // 1 for the settings node
      })
      if (nm.meta[documentId].title !== globalStore.db.data.root.content) {
        globalStore.actions.set('root', 'content', nm.meta[documentId].title)
      }
      return globalStore.on(['node:root'], () => {
        console.log('the root node changed, we should rename the files folkssssss', globalStore.db.data.root.content)
      })
    }
  },

  quickActions: (store, node) => [{
    id: 'something',
    title: 'Import file',
    action: () => {
      // TODO maybe have the store manage modals?
      showModal(onClose => <ImportModal store={store} nm={nm} onClose={onClose} />)
    },
  }],

  actions: {
    createFileForNode(store, id, title) {
      const docid = nm.createDoc(title)
      store.actions.makeNodeFile(id, docid)
    },

    createNewFileNode(store, docid) {
      const id = store.actions.createAfterNormal()
      store.actions.makeNodeFile(id, docid)
    },

    makeNodeFile(store, id, docid) {
      store.actions.setNodeType(id, 'file')
      store.actions.setNested(id, ['types', 'file', 'fileid'], docid)
      store.actions.normalMode()
    },

    navigateToFile(store, id=store.state.active) {
      const node = store.getters.node(id)
      if (node.types.file.fileid) {
        store.emitIntent('navigate-to-file', node.types.file.fileid)
      } else {
        /*
        // TODO kill this once the dialog is working
        const fileid = uuid()
        store.actions.setNested(id, ['types', 'file', 'fileid'], fileid)
        store.globalState.plugins[PLUGIN_ID].addFile(fileid, node.content)
        store.emitIntent('navigate-to-file', fileid)
        */
      }
    },
  },

  nodeTypes: {
    file: {
      title: 'File',
      // TODO hook this up too
      disableSwitch: true,
      newSiblingsShouldCarryType: false,
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

      slashHandler(id, tmpText, store) {
        const fstop = tmpText.match(/^\/f(i(le?)?)? /)
        if (!fstop) return
        const name = tmpText.slice(fstop[0].length)
        const needle = name.toLowerCase()
        const available = name.trim()
          ? Object.keys(nm.meta).filter(k => nm.meta[k].title.toLowerCase().indexOf(needle) !== -1)
          : Object.keys(nm.meta)
        return {
          help: 'Type a file name',
          options: [{
            label: 'Create "' + name + '"',
            action: () => store.actions.createFileForNode(id, name),
          }].concat(available.map(docid => ({
            label: nm.meta[docid].title,
            action: () => store.actions.makeNodeFile(id, docid),
          })))
        }
      },

      defaultNodeConfig() {
        return {
          // When null, that means the file hasn't been created.
          // It'll be created when you click on it.
          // UPDATE that's totally not what happens. When you create a file via the slash handler, we get an id
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
        return <FileNode nm={nm} store={store} node={node} />
      }
    },
  },
})
plugin.id = PLUGIN_ID

export default plugin
