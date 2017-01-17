// @flow

import type {Store} from 'treed/types'

const actions = {
  setCollapsed(store: Store, id: string, collapsed: boolean) {
    store.persistentState.expanded[id] = !collapsed
    store.emitMany([
      store.events.persistentState(),
      store.events.nodeView(id),
    ])
  },

  /*
  toggleCollapse(store: Store, id: string=store.state.active) {
    if (id === store.state.root) return
    const views = store.db.data[id].views
    const collapsed = views && views[store.state.viewType] && views[store.state.viewType].collapsed
    store.actions.setNested(id, ['views', store.state.viewType, 'collapsed'], !collapsed)
  },

  collapse(store: Store, id: string=store.state.active) {
    if (id === store.state.root) return
    store.actions.setNested(id, ['views', store.state.viewType, 'collapsed'], true)
  },

  expand(store: Store, id: string=store.state.active) {
    if (id === store.state.root) return
    store.actions.setNested(id, ['views', store.state.viewType, 'collapsed'], false)
  },
  */
}

export default actions
