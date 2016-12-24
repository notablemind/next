
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

  nextSibling: {
    shortcuts: {
      normal: 'alt+j, alt+down',
    },
    description: 'move cursor down to next sibling',
    alias: 'focusNextSibling',
  },

  prevSibling: {
    shortcuts: {
      normal: 'alt+k, alt+up',
    },
    description: 'move cursor up to previous sibling',
    alias: 'focusPrevSibling',
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

  copy: {
    shortcuts: {
      normal: 'y y',
      visual: 'y',
    },
    description: 'Copy the current node',
    alias: 'copyNode',
  },

  pasteAfter: {
    shortcuts: {
      normal: 'p',
    },
    description: 'Paste after the current node',
    alias: 'pasteAfter',
  },

  pasteBefore: {
    shortcuts: {
      normal: 'P',
    },
    description: 'Paste before the current node',
    alias: 'pasteBefore',
  },

  indent: {
    shortcuts: {
      normal: 'tab, alt+shift+l, alt+shift+right',
      insert: 'tab, alt+shift+l',
    },
    description: 'Indent',
    alias: 'makePrevSiblingsLastChild',
  },

  dedent: {
    shortcuts: {
      normal: 'shift+tab, alt+shift+h, alt+shift+left',
      insert: 'shift+tab, alt+shift+h',
    },
    descript: 'Un-indent',
    alias: 'makeParentsNextSibling',
  },

  createBefore: {
    shortcuts: {
      normal: 'O',
    },
    alias: 'createBefore',
  },

  createAfter: {
    shortcuts: {
      normal: 'o',
    },
    alias: 'createAfter',
  },

  createNextSibling: {
    shortcuts: {
      normal: 'alt+o',
    },
    alias: 'createNextSibling',
  },

  createBeforeNormal: {
    shortcuts: {
      normal: 'ctrl+O',
    },
    alias: 'createBefore', // TODO
  },

  createAfterNormal: {
    shortcuts: {
      normal: 'ctrl+o',
    },
    alias: 'createAfter', // TODO
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

  moveDown: {
    shortcuts: {
      normal: 'alt+shift+j, alt+shift+down',
      insert: 'alt+shift+j',
    },
    description: 'move down',
    alias: 'moveNext',
  },

  moveUp: {
    shortcuts: {
      normal: 'alt+shift+k, alt+shift+up',
      insert: 'alt+shift+k',
    },
    description: 'move item up',
    alias: 'movePrev',
  },

  focusFirstSibling: {
    shortcuts: {
      normal: '{',
    },
    alias: 'focusFirstSibling',
  },

  focusLastSibling: {
    shortcuts: {
      normal: '}',
    },
    alias: 'focusLastSibling',
  },

  focusLastVisibleChild: {
    shortcuts: {
      normal: 'G',
    },
    alias: 'focusLastVisibleChild',
  },

  focusRoot: {
    shortcuts: {
      normal: 'g g',
    },
    alias: 'focusRoot',
  },

  /*
  visualMode: {
    shortcuts: {
      normal: 'v',
    },
    description: 'begin multiple selection',
    alias: 'visualMode',
  },

 */
}

