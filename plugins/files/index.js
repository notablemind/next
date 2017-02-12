// @flow

import React from 'react'
import type {Store, Plugin} from 'treed/types'
import {css, StyleSheet} from 'aphrodite'

import Icon from 'treed/views/utils/Icon'

const PLUGIN_ID = 'files'

const getDatabaseNames = () => {
  return new Promise((res, rej) => {
    const request = window.indexedDb.webkitGetDatabaseNames()
    request.onerror = () => rej()
    request.onsuccess = () => res([...request.result])
  })
}

// Need to set "default node type" to "file"
// And "default node contents" to "Untitled"
const plugin: Plugin<*, *> = {
  id: PLUGIN_ID,

  nodeTypes: {
    file: {
      title: 'File',
      newSiblingsShouldCarryType: true,
      // TODO hook this up
      warnOnTypeChange: (store: Store, node: any) => {
        return getDatabaseNames().then(names => {
          if (names.indexOf(`_pouch_doc_${node._id}`) !== -1) {
            return `Changing this type away from "file" will delete the associated contents.`
          }
        })
      },
      onTypeChange: (store: Store, node: any) => {
        window.indexedDB.deleteDatabase(`_pouch_doc_${node._id}`)
      },
      onDelete: (store: Store, node: any) => {
        window.indexedDB.deleteDatabase(`_pouch_doc_${node._id}`)
        // TODO maybe delete the synced one?
      },
      shortcut: 'f',
      attributeColumns: {
        last_opened: {
          editable: false,
          title: 'Last opened',
        },
        size: {
          editable: false,
          title: 'Size',
        },
      },
      actions: {
        navigate: {
          shortcuts: {
            normal: 'enter',
          },
          description: 'Navigate to file',
          action(store) {
            const node = store.getters.activeNode()
            store.emit('navigate-to-current-active')
          },
        },
      },
      render: props => (
        <div
          className={css(styles.row)}
          onMouseDownCapture={(e) => {
            e.stopPropagation()
            e.preventDefault()
            props.store.actions.setActive(props.node._id)
            props.store.emit('navigate-to-current-active')
          }}
        >
          <Icon className={css(styles.icon)} name="document-text" />
          <props.Content {...props} style={{flex: 1}} />
        </div>
      )
    },
  },
}
export default plugin

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },

  icon: {
    fontSize: 24,
    marginLeft: 5,
    color: '#6f63ff',
  },
})
