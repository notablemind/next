
import Component from './ListView'
import actions from './actions'
import keys from './keys'

export default {
  initialSharedViewData: () => ({expanded: {}}),
  Component,
  actions,
  keys,
  getters: {
    isCollapsed: (store, id) => !store.sharedViewData.list.expanded[id],
  },
}
