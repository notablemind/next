// @flow

import React from 'react'
import {css, StyleSheet} from 'aphrodite'

import TodoBody from './TodoBody'
import TodoSummary from './TodoSummary'

import type {Plugin} from 'treed/types'

/*

What can a plugin do?

- define a settingsy or otherwise side pane
- default document config
- default node config

define a node type!
  - keys associated

*/

const PLUGIN_ID = 'todos'

// document config?
// dunno what kinds of things would be configured
const plugin: Plugin<void, void> =  {
  id: PLUGIN_ID,

  nodeTypes: {
    todoSummary: {
      title: 'Todo Summary',
      newSiblingsShouldCarryType: true,
      shortcut: '@',

      render: TodoSummary,
    },

    todo: {
      title: 'Todo',
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

export default plugin

