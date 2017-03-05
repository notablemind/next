
import type {Store} from 'treed/types'

import Component from './Trash'
// import actions from './actions'
import keys from './keys'

export default {
  title: 'Trash',
  getInitialState: () => ({
    items: [],
    selected: 0,
  }),
  serializeState: state => ({items: []}),
  // initialSharedViewData: () => ({expanded: {}}),
  Component,
  contextMenu: (store, id) => {
    return {
      text: 'Remove from trash',
      action: () => store.actions.unTrash(id),
    }
  },
  actions: {
    setSelected(store: Store, index: number) {
      store.state.view.selected = index
      store.emit(store.events.viewState())
    },
    focusUp(store: Store, id: string) {
      let {items, selected} = store.state.view
      if (selected > 0) {
        selected -= 1
      } else {
        selected = items.length - 1
      }
      store.actions.setSelected(selected)
    },
    focusDown(store: Store, id: string) {
      let {items, selected} = store.state.view
      if (selected < items.length - 1) {
        selected += 1
      } else {
        selected = 0
      }
      store.actions.setSelected(selected)
    },
  },
  keys,
  getters: {
    isCollapsed: () => true,
  },
  shortcut: 't',
}


