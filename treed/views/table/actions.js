// @flow
import type {Store} from 'treed/types'

const actions = {
  setCollapsed(store: Store, id: string, collapsed: boolean) {
    store.sharedViewData.table.expanded[id] = !collapsed
    store.emitMany([store.events.sharedViewData(), store.events.nodeView(id)])
  },
}

export default actions
