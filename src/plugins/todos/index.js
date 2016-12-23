
import React from 'react'
import {css, StyleSheet} from 'aphrodite'

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

// document config?
// dunno what kinds of things would be configured
export default {
  id: 'todos',
  nodeTypes: {
    todo: {
      // does the notion of blocks make sense? I think mayyyybe blocks would
      // be cool for composition...
      // What plugins want to put a block on anything?
      // - tags
      // - source
      // - probably "presence" (where the other users are editing)
      // - ok, so blocks are a thing I should probably keep.
      // Should TODO define its own editor? maybeeeee not.
      render: {
        blocks: {
          // hmm I want to pass in the "general plugin config" too.
          left: (node, pluginData, store) => (
            <input
              type="checkbox"
              className={css(styles.checkbox)}
              onChange={e => store.actions.setPluginData(node._id, 'todos', {...pluginData, done: e.target.checked})}
              checked={pluginData.done}
            />
          )
        },

        className: (node, pluginData, store) => css(
          pluginData.done && styles.done,
          pluginData.dueDate && dueStyle(pluginData.due),
        )
      },

      defaultNodeConfig() {
        return {
          done: false,
          didDate: null,
          dueDate: null,
        }
      },

      actions: {
        toggleDone: {
          description: 'Toggle "done"',
          action(store) {
            const node = store.db.data[store.state.active]
            const config = store.getters.pluginData('todos') || {}
            store.actions.setPluginData(node._id, 'todos', {
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

