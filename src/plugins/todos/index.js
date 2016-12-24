
import React from 'react'
import {css, StyleSheet} from 'aphrodite'

import TodoBody from './TodoBody'
import TodoSummary from './TodoSummary'

/*

What can a plugin do?

- define a settingsy or otherwise side pane
- default document config
- default node config

define a node type!
  - keys associated

*/

const dueStyle = date => {
  const now = Date.now()
  if (date - now < ONE_DAY) {
    return styles.dueToday
  }
  if (date - now < 2 * ONE_DAY) {
    return styles.dueTomorrow
  }
}

const PLUGIN_ID = 'todos'

// document config?
// dunno what kinds of things would be configured
export default {
  id: PLUGIN_ID,

  nodeTypes: {
    todoSummary: {
      newSiblingsShouldCarryType: true,
      shortcut: '@',

      render: TodoSummary,
    },

    todo: {
      newSiblingsShouldCarryType: true,
      shortcut: 't',

      render: TodoBody,

      defaultNodeConfig() {
        return {
          // hmm are there any other things associated w/ this that I should
          // add?
          done: false,
          didDate: null,
          dueDate: null,
        }
      },

      actions: {
        toggleDone: {
          shortcuts: {
            normal: 'alt+enter',
            visual: 'alt+enter',
            insert: 'alt+enter',
          },
          description: 'Toggle "done"',
          action(store, node) {
            const config = node.types.todo || {}
            store.actions.setNested(node._id, ['types', 'todo'], {
              ...config,
              done: !config.done,
              didDate: config.done ? null : Date.now(),
            })
          },
        },
      },

      columns: {
        dueDate: {
          editable: true,
          type: 'date',
        },

        didDate: {
          editable: true,
          type: 'date',
        },
      },
    },
  },
}

const styles = StyleSheet.create({
})

