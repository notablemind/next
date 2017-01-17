
import Component from './ListView'
import actions from './actions'
import keys from './keys'

export default {
  initialPersistentState: () => ({expanded: {}}),
  Component,
  actions,
  keys,
  getters: {
    isCollapsed: (store, id) => !store.persistentState.expanded[id],
  },
}
