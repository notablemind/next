// @flow

import React from 'react'
import type {Store, Plugin, GlobalStore} from 'treed/types'
import {css, StyleSheet} from 'aphrodite'

import Icon from 'treed/views/utils/Icon'

const PLUGIN_ID = 'files'

const LS_KEY = 'nm:files'
const loadFiles = () => {
  try {
    return JSON.parse(localStorage[LS_KEY] || '')
  } catch (e) {
    return null
  }
}
const saveFiles = files => localStorage[LS_KEY] = JSON.stringify(files)

const getDatabaseNames = () => {
  return new Promise((res, rej) => {
    const request = window.indexedDB.webkitGetDatabaseNames()
    request.onerror = () => rej()
    request.onsuccess = () => res([...request.result])
  })
}

// Need to set "default node type" to "file"
// And "default node contents" to "Untitled"
const plugin: Plugin<*, *> = {
  id: PLUGIN_ID,

  init(globalConfig: any, globalStore: GlobalStore) {
    let files = loadFiles()
    if (files === null) {
      let files = {}
      return getDatabaseNames().then(names => {
        const nodes = globalStore.db.data
        const ids = []
        const updates = []
        Object.keys(nodes).forEach(id => {
          if (nodes[id].type === 'file') {
            if (names.indexOf(`_pouch_doc_${id}`) !== -1) {
              files[id] = {
                id,
                title: nodes[id].content,
                lastOpened: Date.now(),
                lastModified: Date.now(),
                size: 0,
                sync: null,
                /*
                {
                  owner: 'xxuseridxx',
                  latestVersion: 2,
                  lastUploaded: Date.now(),
                }
                */
              }
              updates.push({types: {
                ...nodes[id].types,
                [PLUGIN_ID]: {
                  fileid: id,
                }
              }})
              ids.push(id)
            }
          }
        })
        globalStore.actions.updateMany(ids, updates)
        saveFiles(files)
        return {files}
      })
    }
    return {files}
  },

  nodeTypes: {
    file: {
      title: 'File',
      newSiblingsShouldCarryType: false,
      // TODO hook this up
      warnOnTypeChange: (store: Store, node: any) => {
        return getDatabaseNames().then(names => {
          if (names.indexOf(`_pouch_doc_${node._id}`) !== -1) {
            return `Changing this type away from "file" will delete the associated contents.`
          }
        })
      },
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
            const node = store.getters.activeNode()
            store.emitIntent('navigate-to-file', node._id)
          },
        },
      },

      render: ({store, node}) => {
        const {files} = store.getters.pluginState(PLUGIN_ID)
        const file = files[(node.types.file || {}).fileid]
        /*
         */
        const onNav = (e) => {
          if (e.button !== 0) return
          e.stopPropagation()
          e.preventDefault()
          store.emitIntent('navigate-to-file', node._id)
        }
        return file
          ? <div
              className={css(styles.row)}
              onMouseDownCapture={onNav}
            >
              <Icon className={css(styles.icon)} name="document-text" />
              {file.title}
              <Strut size={10} />
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
    if (h === 12) pm = true
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

  date: {
    fontSize: '70%',
  },

  icon: {
    fontSize: 24,
    marginLeft: 5,
    color: '#6f63ff',
  },
})
