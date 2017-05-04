import Component from './ListView'
import actions from './actions'
import keys from './keys'

export default {
  title: 'List',
  initialSharedViewData: () => ({expanded: {}}),
  Component,
  actions,
  keys,
  getters: {
    isCollapsed: (store, id) => !store.sharedViewData.list.expanded[id],
  },
  shortcut: 'l',
}
