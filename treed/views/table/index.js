// @flow

import Component from './TableView'
import actions from './actions'
import keys from './keys'

export default {
  title: 'Table',
  initialSharedViewData: () => ({
    expanded: {},
    // TODO should sorting be on a per-root basis? (so `defaultView` stuff)
    // I'll punt for now.
    sort: null,
    sortReverse: false,
  }),
  Component,
  actions,
  keys,
  getters: {
    isCollapsed: (store: any, id: string) =>
      !store.sharedViewData.table.expanded[id],
  },
  shortcut: 't',
}
