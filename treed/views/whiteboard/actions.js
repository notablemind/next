// @flow

import type {ViewActionConfig} from '../../types'

const actions: ViewActionConfig = {
  edit: {
    shortcuts: {
      normal: 'enter',
    },
    alias: 'edit',
    description: 'Start editing',
  },

  editStart: {
    shortcuts: {
      normal: 'I',
    },
    alias: 'editStart',
    description: 'Start editing at the start',
  },

  up: {
    shortcuts: {
      normal: 'k, up',
      // this has no insert b/c maybe up is within the thing
      // also visual mode is separate
    },
    description: 'move the cursor up one item',
    alias: 'focusPrevSibling',
  },

  left: {
    shortcuts: {
      normal: 'h, left',
    },

    action(store) {
      const active = store.state.active
      const pid = store.db.data[active].parent
      if (!pid) return
      // need to find "next open space" on the whiteboard
      if (pid === store.state.root) {
      } else {
        store.actions.focusParent()
      }
    },
  },

  down: {
    shortcuts: {
      normal: 'j, down',
    },
    description: 'move the cursor down one item',
    alias: 'focusNextSibling',
  },

  createAfter: {
    shortcuts: {
      normal: 'o',
    },
    action(store) {
      const active = store.state.active
      const pid = store.db.data[active].parent
      if (!pid) return
      // need to find "next open space" on the whiteboard
      if (pid === store.state.root) {
      } else {
        store.actions.createNextSibling(active)
      }
    },
    description: 'Create node after',
  },

  createBefore: {
    shortcuts: {
      normal: 'O',
    },
    action(store) {
      const active = store.state.active
      const pid = store.db.data[active].parent
      if (!pid) return
      // need to find "next open space" on the whiteboard
      if (pid === store.state.root) {
      } else {
        store.actions.createBefore(active)
      }
    },
    description: 'Create node after',
  },

  createChild: {
    shortcuts: {
      normal: 'cmd+o',
    },
    description: 'Create child',
    action(store) {
      const active = store.state.active
      const pid = store.db.data[active].parent
      if (!pid) return
      if (pid === store.state.root) {
        store.actions.createChild(active)
        // TODO make sure it's not collapsed
      } else {
      }
    }
  },

  // ???
}

export default actions

