
import ImageBody from './ImageBody'
import actions from './actions'

const PLUGIN_ID = 'image'

export default {
  id: PLUGIN_ID,

  node: {
    pasteFile: (store, id, file, type, filename) => {
      if (!type.match(/^image\//)) return false
      const node = store.db.data[id]
      let extra = {type: 'image'}
      if (!node.content.trim()) {
        extra = {content: filename, type: 'image'}
      }
      actions.setImage(store, id, file, extra)
      return true
    },

    // dropFile:
    // dropFileNew:
  },

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

