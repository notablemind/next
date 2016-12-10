
// const maybeId = fn => (store, id) => fn(store, id || store.state.active)

export default {
  set(store, id, attr, value) {
    if (store.db.data[id][attr] === value) return
    store.execute({type: 'set', args: {id, attr, value}})
  },

  update(store, id, update) {
    store.execute({type: 'update', args: {id, update}})
  },

  setContent(store, id, content) {
    store.actions.set(id, 'content', content)
  },

  setActiveView(store) {
    if (store.id !== store.globalState.activeView) {
      store.globalState.activeView = store.id
      store.emit(store.events.activeView())
    }
  },

  setActive(store, id) {
    if (!id || store.db.data[id]) return
    const old = store.state.active
    store.actions.setActiveView()
    if (id === old) return
    if (store.state.mode === 'insert') {
      store.state.editPos = 'default' // do I care about this?
    } else if (store.state.mode !== 'normal') {
      store.actions.setMode('normal')
    }
    if (store.db.data[old]) {
      store.emit(store.events.nodeView(old))
    }
    store.emitMany([
      store.events.activeNode(),
      store.events.nodeView(id),
    ])
    return true
  },

  setMode(store, mode) {
    if (store.state.mode === mode) return
    store.state.mode = mode
    if (store.getters.isActiveView()) {
      store.emit(store.events.activeMode())
    }
    store.emit(store.events.mode(store.id))
  },

  normalMode(store, id=store.state.active) {
    if (store.state.mode === 'normal' && store.state.active === id) return
    store.actions.setMode('normal')
    if (!store.actions.setActive(id)) {
      store.emit(store.events.nodeView(id))
    }
    /*
    // document.activeElement.blur() // hmm do we really need this?
    // */
  },

  edit: (store, id) => store.actions.editAt(id, 'default'),
  editStart: (store, id) => store.actions.editAt(id, 'start'),
  editEnd: (store, id) => store.actions.editAt(id, 'end'),

  editAt(store, id=store.state.active, at='default') {
    if (store.state.mode === 'edit' && store.state.active === id) return
    if (!store.actions.setActive(id)) {
      store.emit(store.events.nodeView(id))
    }
    store.state.lastEdited = id
    store.state.editPos = at
    store.actions.setMode('insert')
  },

  editChange: (store, id) => store.actions.editAt(id, 'change'),
}

