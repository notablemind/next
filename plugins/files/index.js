// @flow

import React from 'react'
import {css, StyleSheet} from 'aphrodite'

import uuid from 'treed/uuid'
import Icon from 'treed/views/utils/Icon'
import type {Store, Plugin, GlobalStore} from 'treed/types'

import * as storage from './storage'

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
        const {files} = store.getters.pluginState(PLUGIN_ID)
        const file = files[(node.types.file || {}).fileid]
        console.log(node.types.file.fileid, !!files[node.types.file.fileid])
        const onNav = (e) => {
          if (e.button !== 0) return
          e.stopPropagation()
          e.preventDefault()
          store.actions.navigateToFile(node._id)
        }
        return file
          ? <div
              className={css(styles.row)}
              onMouseDownCapture={onNav}
            >
              <Icon className={css(styles.icon)} name="document-text" />
              {file.title}
              <div style={{flex: 1}}/>
              <div className={css(styles.date)}>
              {readableDate(file.lastOpened)}
              </div>
              <Strut size={10} />
              {file.size + ''}
              <Strut size={10} />
              <SyncIcon synced={file.synced} />
              <Strut size={5} />
            </div>
          : <div
              className={css(styles.row, styles.rowDisabled)}
              onMouseDownCapture={onNav}
            >
              <Icon className={css(styles.icon)} name="document-text" />
              {node.content}
            </div>
      }
    },
  },
}
export default plugin

const startOfDay = date => {
  const d = new Date(date)
  d.setHours(0)
  d.setMinutes(0)
  d.setSeconds(0)
  d.setMilliseconds(0)
  return d.getTime()
}

const daysOfWeek = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun']

const readableDate = date => {
  const today = Date.now()
  const startOfToday = startOfDay(today)
  const startOfThat = startOfDay(date)
  const d = new Date(date)
  if (startOfToday === startOfThat) {
    let h = d.getHours()
    let pm = false
    let m = d.getMinutes()
    if (h >= 12) pm = true
    if (h > 12) {
      h -= 12
    }
    if (m < 10) m = `0${m}`
    return `${h}:${m}${pm ? 'pm' : 'am'}`
  }
  const daysBetween = Math.round((startOfToday - startOfThat) / (1000 * 60 * 60 * 24))
  if (daysBetween === 1) {
    return 'Yesterday'
  } else if (daysBetween < 7) {
    return daysOfWeek[d.getDay()]
  } else {
    return d.toLocaleDateString()
  }
}

const Strut = ({size}) => <div style={{flexBasis: size}} />

const SyncIcon = ({synced}) => {
  if (synced) {
    return <Icon size={24} name="ios-loop" />
  } else {
    return <div style={{position: 'relative'}}>
      <Icon size={24} color="#aaa" name="ios-loop" />
      <Icon size={24} color="#aaa" name="ios-close-empty" style={{
        // transform: 'rotate(-45deg)',
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        // left: -1,
      }} />
    </div>
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },

  rowDisabled: {
    fontStyle: 'italic',
    color: '#aaa',
  },

  date: {
    fontSize: '70%',
  },

  icon: {
    fontSize: 24,
    marginLeft: 5,
    marginRight: 10,
    color: '#6f63ff',
  },
})
