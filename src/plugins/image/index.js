
const PLUGIN_ID = 'image'

const actions = {
  setImage(store, imageBlob) {
    const id = store.state.active
    const node = store.db.data[id]
    const _attachments = {...node._attachments}
    if (node.types.image.attachmentId) {
      delete _attachments[node.types.image.attachmentId]
    }
    const nid = uuid()
    _attachments[nid] = {
      content_type: 'image/png', // TODO get real content type
      data: imageBlob,
    }
    const types = {
      ...node.types,
      [image]: {
        ...node.types.image,
        attachmentId: nid,
        // TODO maybe image dimensions should be stored here too?
      }
    }
    store.actions.update(id, {_attachments, types})
  },

  removeImage(store) {
    const id = store.state.active
    const node = store.db.data[id]
    const _attachments = {...node._attachments}
    delete _attachments[node.types.image.attachmentId]
    const types = {
      ...node.types,
      [image]: {
        ...node.types.image,
        attachmentId: null,
        // TODO maybe image dimensions should be stored here too?
      }
    }
    store.actions.update(id, {_attachments, types})
  },
}

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
          collapsed: false,
        }
      },

      actions: {
        toggleCollapsed: {
          shortcuts: {
            normal: 'space',
            visual: 'space',
            // insert: 'space',
          },
          description: 'Toggle "collapsed"',
          action(store, node) {
            const config = node.types.todo || {}
            store.actions.setNested(node._id, ['types', 'image'], {
              ...config,
              done: !config.done,
              didDate: config.done ? null : Date.now(),
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

