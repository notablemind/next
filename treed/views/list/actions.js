
export default {
  up: {
    shortcuts: {
      normal: 'k, up',
      // this has no insert b/c maybe up is within the thing
      // also visual mode is separate
    },
    description: 'move the cursor up one item',
    alias: 'focusPrev',
  },

  down: {
    shortcuts: {
      normal: 'j, down',
    },
    description: 'move the cursor down one item',
    alias: 'focusNext',
  },

  left: {
    shortcuts: {
      normal: 'h, left',
    },
    description: 'move the cursor to the parent',
    alias: 'focusParent',
  },

  editMode: {
    shortcuts: {
      normal: 'enter',
    },
    description: 'start editing current item',
    alias: 'edit',
  },

  editEnd: {
    shortcuts: {
      normal: 'shift+a',
    },
    description: 'start editing current item (selection at end)',
    alias: 'editEnd',
  },

  editStart: {
    shortcuts: {
      normal: 'I',
    },
    description: 'edit @ the start of the current item',
    alias: 'editStart',
  },

  editChange: {
    shortcuts: {
      normal: 'C, c c',
    },
    description: 'edit w/ contents selected',
    alias: 'editChange',
  },

  normalMode: {
    shortcuts: {
      insert: 'esc',
      visual: 'esc',
    },
    description: 'Stop editing',
    alias: 'normalMode',
  },

  remove: {
    shortcuts: {
      normal: 'd d',
      visual: 'd',
    },
    description: 'Remove the current node',
    alias: 'remove',
  },

  indent: {
    shortcuts: {
      normal: 'tab',
      insert: 'tab',
    },
    description: 'Indent',
    alias: 'makePrevSiblingsLastChild',
  },

  dedent: {
    shortcuts: {
      normal: 'shift+tab',
      insert: 'shift+tab',
    },
    descript: 'Un-indent',
    alias: 'makeParentsNextSibling',
  },

  createAfter: {
    shortcuts: {
      normal: 'o',
    },
    alias: 'createAfter',
  },

  toggleCollapse: {
    shortcuts: {
      normal: 'z',
    },
    alias: 'toggleCollapse',
  },

  rebase: {
    shortcuts: {
      normal: 'g d',
    },
    alias: 'rebase',
  },

  rebaseRoot: {
    shortcuts: {
      normal: 'g r',
    },
    action(store) {
      store.actions.rebase('root')
    },
  },

  rebaseUp: {
    shortcuts: {
      normal: 'g u',
    },
    action(store) {
      const parent = store.db.data[store.state.root].parent
      store.actions.rebase(parent)
    },
  },

  /*
  visualMode: {
    shortcuts: {
      normal: 'v',
    },
    description: 'begin multiple selection',
    alias: 'visualMode',
  },

  moveDown: {
    shortcuts: {
      normal: 'alt+shift+j, alt+shift+down',
      insert: 'alt+shift+j, alt+shift+down',
    },
    description: 'move down',
    alias: 'moveNext',
  },

  moveUp: {
    alias: 'movePrev',
  },
 */
}

