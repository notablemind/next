import Component from './ListView'
import actions from './actions'
import keys from './keys'

export default {
  title: 'List',
  initialSharedViewData: () => ({expanded: {}}),
  getInitialState: () => ({hideCompleted: false}), // maybe filters?
  serializeState: state => state,
  Component,
  actions,
  keys,
  quickActions(store, node) {
    return [{
      id: 'hide_completed',
      title: store.state.view.hideCompleted
        ? 'Show completed'
        : 'Hide completed',
      action: () => store.actions.toggleHideCompleted(),
    }]
  },
  getters: {
    isCollapsed: (store, id) => !store.sharedViewData.list.expanded[id],
  },
  shortcut: 'l',
}
