// @flow

import type {Store} from 'treed/types'

const actions = {
  setCollapsed(store: Store, id: string, collapsed: boolean) {
    store.sharedViewData.list.expanded[id] = !collapsed
    store.emitMany([store.events.sharedViewData(), store.events.nodeView(id)])
  },
  toggleHideCompleted(store: Store) {
    store.state.view.hideCompleted = !store.state.view.hideCompleted
    store.emit(store.events.viewState())
  },
}

export default actions
