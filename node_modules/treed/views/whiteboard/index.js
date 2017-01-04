
import Component from './Whiteboard'
import actions from './actions'

export default {
  Component,
  actions,
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

