// @flow

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

  actions: {
    toggleDone(store, id: string = store.state.active) {
      store.actions.set(id, 'completed', store.db.data[id].completed ? null : Date.now())
    },
  },

  nodeTypes: {
    todoSummary: {
      title: 'Todo Summary',
      newSiblingsShouldCarryType: true,
      shortcut: '@',

      render: null, // TodoSummary,
    },

    todo: {
      title: 'Todo',
      newSiblingsShouldCarryType: true,
      shortcut: 't',

      render: null, // TodoBody,

      defaultNodeConfig() {
        return {
          // hmm are there any other things associated w/ this that I should
          // add?
          dueDate: null,
          // priority: ??
          // colors?
        }
      },

      actions: {
        toggleDone: {
          shortcuts: {
            normal: 'cmd+enter',
            visual: 'cmd+enter',
            insert: 'cmd+enter',
          },
          description: 'Toggle "done"',
          action(store) {
            store.actions.toggleDone(store.state.active)
          },
        },
      },

      columns: {
        dueDate: {
          editable: true,
          type: 'date',
        },

        /*
        didDate: {
          editable: true,
          type: 'date',
        },
        */
      },
    },
  },
}

export default plugin

