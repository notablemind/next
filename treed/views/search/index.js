
import Component from './Search'
// import actions from './actions'
// import keys from './keys'

export default {
  title: 'Search',
  getInitialState: () => ({
    tagIds: [],
    searchText: '',
    // results: [],
  }),
  // initialSharedViewData: () => ({expanded: {}}),
  Component,
  actions: {
    setSearchText: (store: *, text: string) => {
      store.state.view = {
        ...store.state.view,
        searchText: text,
      }
      store.emit(store.events.viewState())
    },
    addSearchTag: (store: *, id: string) => {
      store.state.view = {
        ...store.state.view,
        tagIds: store.state.view.tagIds.concat([id]),
      }
      store.emit(store.events.viewState())
    },
  },
  keys: {},
  getters: {
    isCollapsed: () => true,
  },
  shortcut: 's',
}

