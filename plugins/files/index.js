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
      newSiblingsShouldCarryType: false,
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
        lastOpened: {
          editable: false,
          title: 'Last opened',
        },
        size: {
          editable: false,
          title: 'Size',
        },
      },

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

      defaultNodeConfig() {
        return {
          size: 0,
          synced: true,
          lastOpened: null,
          // TODO 'repl' etc.
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
            store.emit('navigate-to-current-active')
          },
        },
      },

      render: props => {
        const {lastOpened = null, size = 0, synced = false} = props.node.types.file || {}
        return <div
          className={css(styles.row)}
          onMouseDownCapture={(e) => {
            if (e.button !== 0) return
            e.stopPropagation()
            e.preventDefault()
            props.store.actions.setActive(props.node._id)
            props.store.emit('navigate-to-current-active')
          }}
        >
          <Icon className={css(styles.icon)} name="document-text" />
          <props.Content {...props} style={{flex: 1}} />
          <Strut size={10} />
          <div className={css(styles.date)}>
          {lastOpened && readableDate(lastOpened)}
          </div>
          <Strut size={10} />
          {size + ''}
          <Strut size={10} />
          <SyncIcon synced={synced} />
          <Strut size={5} />
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
