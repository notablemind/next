
import Component from './Whiteboard'
import actions from './actions'
import keys from './keys'

export default {
  title: 'Whiteboard',
  Component,
  actions,
  keys,
  getInitialState: () => ({
    x: 5,
    y: 5,
    zoom: 1,
  }),
  defaultActive: 'firstChild',
  serializeState: state => state,
  getters: {
    isCollapsed: (store, id) => (
      store.db.data[id].views.whiteboard &&
      store.db.data[id].views.whiteboard.collapsed
    )
  },
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
      keyShortcut: 'enter',
      action: store.actions.lineNodesUpVertically,
    }, {
      text: 'Line up horizontally',
      action: store.actions.lineNodesUpHorizontally,
    }]
  },
  shortcut: 'w',
}

