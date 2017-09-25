
/**
 *
 *
 */

const plugin = {
  id: 'presentation',

  // TODO add actions to toggle presentation settings n stuff
  node: {
    // add blocks to indicate that it's persistant, slide group etc.
    contextMenu: (pluginData, node, store) => {
      return [{
        text: 'Make persistant',
        action() {
        },
      }, {
        text: 'Make slide group',
        action() {
        },
      }]
    },
  },
}

