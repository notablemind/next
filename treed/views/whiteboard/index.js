
import Component from './Whiteboard'
import actions from './actions'

export default {
  Component,
  actions,
  contextMenu: (store, id) => {
    const viewData = store.getters.nodeViewData(id)
    if (viewData && viewData.height) {
      return {
        text: 'Unset height',
        action: () => {
          store.actions.setNodeViewData(id, 'whiteboard', {
            ...viewData,
            height: null,
          })
        }
      }
    }
    return
  },
  contextMenuVisual: (store) => {
    const ids = Object.keys(store.state.selected)
    if (ids.length < 2) return
    return [{
      text: 'Line up vertically',
      action: () => {
      }
    }, {
      text: 'Line up horizontally',
      action: () => {
      }
    }]
  }
}

