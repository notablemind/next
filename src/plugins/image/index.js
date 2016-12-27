
import ImageBody from './ImageBody'
import actions from './actions'

const PLUGIN_ID = 'image'

export default {
  id: PLUGIN_ID,

  nodeTypes: {
    image: {
      newSiblingsShouldCarryType: false,
      shortcut: 'i',

      render: ImageBody,

      defaultNodeConfig() {
        return {
          attachmentId: null,
          fullSize: false,
        }
      },

      actions: {
        toggleFullSize: {
          shortcuts: {
            normal: 'space',
            visual: 'space',
            // insert: 'space',
          },
          description: 'Toggle "full size"',
          action(store, node) {
            const config = node.types.image || {}
            store.actions.setNested(node._id, ['types', 'image'], {
              ...config,
              fullSize: !config.fullSize,
            })
          },
        },
      },

      columns: {
        fileSize: {
          editable: false,
        },
      },
    },
  },
}

