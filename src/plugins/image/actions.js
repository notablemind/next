
import uuid from '../../utils/uuid'

const actions = {
  setImage(store, id, imageBlob) {
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
      image: {
        ...node.types.image,
        attachmentId: nid,
        // TODO maybe image dimensions should be stored here too?
      }
    }
    store.actions.update(id, {_attachments, types})
  },

  removeImage(store, id) {
    const node = store.db.data[id]
    const _attachments = {...node._attachments}
    delete _attachments[node.types.image.attachmentId]
    const types = {
      ...node.types,
      image: {
        ...node.types.image,
        attachmentId: null,
        // TODO maybe image dimensions should be stored here too?
      }
    }
    store.actions.update(id, {_attachments, types})
  },
}

export default actions
