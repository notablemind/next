// @flow

import type {ViewActionConfig} from '../../types'

const actions: ViewActionConfig = {
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

  focusLastJumpPoint: {
    shortcuts: {
      normal: '\'',
    },
    description: 'focus last jump point',
    alias: 'focusLastJumpOrigin',
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

  cut: {
    shortcuts: {
      normal: 'y x, cmd+x',
    },
    description: 'Mark the current node to cut',
    alias: 'setCut',
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
    description: 'Un-indent',
    alias: 'makeParentsNextSibling',
  },

  createBefore: {
    shortcuts: {
      normal: 'O, alt+O',
    },
    alias: 'createBefore',
    description: 'Create node before',
  },

  createAfter: {
    shortcuts: {
      normal: 'o',
    },
    alias: 'createAfter',
    description: 'Create node after',
  },

  createChild: {
    shortcuts: {
      normal: 'cmd+o',
    },
    alias: 'createChild',
    description: 'Create child',
  },

  createNextSibling: {
    shortcuts: {
      normal: 'alt+o',
    },
    alias: 'createNextSibling',
    description: 'Create node next sibling',
  },

  createBeforeNormal: {
    shortcuts: {
      normal: 'ctrl+O',
    },
    alias: 'createBeforeNormal',
    description: 'Create Text node before',
  },

  createAfterNormal: {
    shortcuts: {
      normal: 'ctrl+o',
    },
    alias: 'createAfterNormal',
    description: 'Create Text node after',
  },

  toggleCollapse: {
    shortcuts: {
      normal: 'z',
    },
    alias: 'toggleCollapse',
    description: 'Toggle collapse',
  },

  rebase: {
    shortcuts: {
      normal: 'g d',
    },
    alias: 'rebase',
    description: 'Zoom to node',
  },

  rebaseNext: {
    shortcuts: {
      normal: 'g n',
    },
    alias: 'rebaseNext',
    description: 'Zoom to next sibling of root',
  },

  rebasePrev: {
    shortcuts: {
      normal: 'g p',
    },
    alias: 'rebasePrev',
    description: 'Zoom to previous sibling of root',
  },

  rebaseRoot: {
    shortcuts: {
      normal: 'g r',
    },
    action(store) {
      store.actions.rebase('root')
    },
    description: 'Zoom to root',
  },

  rebaseUp: {
    shortcuts: {
      normal: 'g u',
    },
    action(store) {
      const parent = store.db.data[store.state.root].parent
      store.actions.rebase(parent)
    },
    description: 'Zoom to parent of current root',
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
    description: 'Jump to first sibling',
  },

  focusLastSibling: {
    shortcuts: {
      normal: '}',
    },
    alias: 'focusLastSibling',
    description: 'Jump to last sibling',
  },

  focusLastVisibleChild: {
    shortcuts: {
      normal: 'G',
    },
    alias: 'focusLastVisibleChild',
    description: 'Jump to end of document',
  },

  focusRoot: {
    shortcuts: {
      normal: 'g g',
    },
    alias: 'focusRoot',
    description: 'Jump to top of document',
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

export default actions
