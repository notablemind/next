// @flow

// const maybeId = fn => (store, id) => fn(store, id || store.state.active)

import uuid from '../src/utils/uuid'
import * as nav from './nav'
import * as move from './move'

type Node = any
type DumpedNode = Node & {
  children: [DumpedNode],
}

type Mode = 'normal' | 'insert' | 'visual'
type GlobalStore = {
  db: {
    data: {[key: string]: Node},
  },
  actions: {[key: string]: Function},
  execute: (command: {
    type: string,
    args: any,
    preActive?: string,
    postActive?: string,
  }) => void,
  emit: Function,
  emitMany: Function,
  events: {[key: string]: (...args: any) => string},
  getters: {[key: string]: Function},
  globalState: {
    activeView: string,
    plugins: {},
    clipboard: ?DumpedNode,
  },
}

type Store = GlobalStore & {
  id: string,
  state: {
    root: string,
    active: string,
    mode: Mode,
    lastEdited: string,
    editPos: EditPos,
    viewType: string,
    selection: ?Array<string>,
  },
}

type EditPos = 'start' | 'end' | 'default' | 'change'
type DefEditPos = EditPos | false

// TODO should I accomodate more types of contents?
// like an image, or something...
type ClipboardContents = DumpedNode

const afterPos = (id, nodes, viewType) => {
  let pid = nodes[id].parent
  let idx
  const views = nodes[id].views
  const collapsed = views && views[viewType] &&
    views[viewType].collapsed
  if (pid && (collapsed || !nodes[id].children.length)) {
    idx = nodes[pid].children.indexOf(id) + 1
  } else {
    pid = id
    idx = 0
  }
  return {pid, idx}
}

const nextActiveAfterRemoval = (id, nodes, goUp) => {
  const sibs = nodes[nodes[id].parent].children
  let nid
  if (sibs.length > 1) {
    const idx = sibs.indexOf(id)
    if (goUp) {
      if (idx === 0) {
        nid = nodes[id].parent
      } else {
        nid = sibs[idx - 1]
      }
    } else {
      if (idx === sibs.length - 1) {
        nid = sibs[idx - 1]
      } else {
        nid = sibs[idx + 1]
      }
    }
  } else {
    nid = nodes[id].parent
  }
  return nid
}

const treeToItems = (pid, id, node, items) => {
  items.push({
    ...node,
    _id: id,
    parent: pid,
    children: node.children.map(child => {
      const nid = uuid()
      treeToItems(id, nid, child, items)
      return nid
    }),
  })
}

const actions = {
  global: {
    set(globalStore: GlobalStore, id: string, attr: string, value: any) {
      if (globalStore.db.data[id][attr] === value) return
      globalStore.execute({type: 'set', args: {id, attr, value}})
    },

    setClipboard(globalStore: GlobalStore, contents: ClipboardContents) {
      globalStore.globalState.clipboard = contents
    },

    setNested(globalStore: GlobalStore, id: string, attrs: Array<string>, value: any) {
      const att: any = attrs
      const current = att.reduce((o, a) => o ? o[a] : undefined, globalStore.db.data[id])
      if (current === value) return
      globalStore.execute({type: 'setNested', args: {id, attrs, value}})
    },

    update(globalStore: GlobalStore, id: string, update: any) {
      globalStore.execute({type: 'update', args: {id, update}})
    },

    setContent(globalStore: GlobalStore, id: string, content: string) {
      globalStore.actions.set(id, 'content', content)
    },

    setPluginData(globalStore: GlobalStore, id: string, plugin: string, data: any) {
      globalStore.actions.setNested(id, ['plugins', plugin], data)
    },

    setGlobalPluginConfig(globalStore: GlobalStore, plugin: string, config: any) {
      globalStore.actions.setNested('settings', ['plugins', plugin], config)
    },
  },

  view: {
    setActiveView(store: Store) {
      if (store.id !== store.globalState.activeView) {
        store.globalState.activeView = store.id
        store.emit(store.events.activeView())
      }
    },

    setActive(store: Store, id: string) {
      if (!id || !store.db.data[id]) return
      const old = store.state.active
      store.actions.setActiveView()
      if (id === old) return
      store.state.active = id
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

    setMode(store: Store, mode: Mode) {
      if (store.state.mode === mode) return
      store.state.mode = mode
      if (store.getters.isActiveView()) {
        store.emit(store.events.activeMode())
      }
      store.emit(store.events.mode(store.id))
    },

    normalMode(store: Store, id: string=store.state.active) {
      if (store.state.mode === 'normal' && store.state.active === id) return
      store.actions.setMode('normal')
      if (!store.actions.setActive(id)) {
        store.emit(store.events.nodeView(id))
      }
    },

    visualMode(store: Store, id: string=store.state.active) {
      if (store.state.mode === 'visual' && store.state.active === id) return
      store.actions.setMode('visual')
      store.state.selection = [id]
      if (!store.actions.setActive(id)) {
        store.emit(store.events.nodeView(id))
      }
    },

    expandSelectionPrev(store: Store) {
      throw new Error('not implt')
    },

    expandSelectionNext(store: Store) {
      throw new Error('not implt')
    },

    edit: (store: Store, id: string) => store.actions.editAt(id, 'default'),
    editStart: (store: Store, id: string) => store.actions.editAt(id, 'start'),
    editEnd: (store: Store, id: string) => store.actions.editAt(id, 'end'),

    editAt(store: Store, id: string=store.state.active, at: EditPos='default') {
      if (store.state.mode === 'edit' && store.state.active === id) return
      if (!store.actions.setActive(id)) {
        store.emit(store.events.nodeView(id))
      }
      store.state.lastEdited = id
      store.state.editPos = at === 0 ? 'start' : at
      store.actions.setMode('insert')
    },

    createBeforeNormal(store: Store, id: string=store.state.active) {
      if (!id || !store.db.data[id]) return
      let pid = store.db.data[id].parent
      if (!pid || id === 'root') return
      const idx = store.db.data[pid].children.indexOf(id)
      const nid = uuid()
      store.execute({
        type: 'create',
        args: {id: nid, pid, ix: idx},
      }, id, nid)
      store.actions.editStart(nid)
      return nid
    },

    createAfterNormal(store: Store, id: string=store.state.active) {
      if (!id || !store.db.data[id]) return
      const {pid, idx} = afterPos(id, store.db.data, store.state.viewType)
      const nid = uuid()
      store.execute({
        type: 'create',
        args: {id: nid, pid, ix: idx},
      }, id, nid)
      store.actions.editStart(nid)
      return nid
    },

    createBefore(store: Store, id: string=store.state.active, content: string='') {
      if (!id || !store.db.data[id]) return
      let pid = store.db.data[id].parent
      if (!pid || id === 'root') return
      const idx = store.db.data[pid].children.indexOf(id)
      const nid = uuid()
      const oldType = store.db.data[id].type
      const nodeType = store.plugins.nodeTypes[oldType]
      const type = nodeType.newSiblingsShouldCarryType ?
        oldType : 'normal'
      const types = nodeType.newSiblingsShouldCarryType && nodeType.defaultNodeConfig ?
        {[oldType]: nodeType.defaultNodeConfig()} : {}
      store.execute({
        type: 'create',
        args: {id: nid, pid, ix: idx, data: {content, type, types}},
      }, id, nid)
      store.actions.editStart(nid)
      return nid
    },

    createAfter(store: Store, id: string=store.state.active, content: string='') {
      const node = store.db.data[id]
      if (!id || !node) return
      const {pid, idx} = afterPos(id, store.db.data, store.state.viewType)
      const nid = uuid()
      let type = 'normal'
      if (pid === node.parent) {
        if (store.plugins.nodeTypes[node.type].newSiblingsShouldCarryType) {
          type = node.type
        }
      } else {
        const firstChild = node.children[0] && store.db.data[node.children[0]]
        if (firstChild && store.plugins.nodeTypes[firstChild.type].newSiblingsShouldCarryType) {
          type = firstChild.type
        }
      }
      const nodeType = store.plugins.nodeTypes[type]
      const types = nodeType.defaultNodeConfig ?
        {[type]: nodeType.defaultNodeConfig()} : {}
      store.execute({
        type: 'create',
        args: {id: nid, pid, ix: idx, data: {content, type, types}},
      }, id, nid)
      store.actions.editStart(nid)
      return nid
    },

    createNextSibling(store: STore, id: string=store.state.active) {
      if (!id || !store.db.data[id]) return
      let pid = store.db.data[id].parent
      if (!pid || id === 'root') return
      const idx = store.db.data[pid].children.indexOf(id) + 1
      const nid = uuid()
      const oldType = store.db.data[id].type
      const nodeType = store.plugins.nodeTypes[oldType]
      const type = nodeType.newSiblingsShouldCarryType ?
        oldType : 'normal'
      const types = nodeType.newSiblingsShouldCarryType && nodeType.defaultNodeConfig ?
        {[oldType]: nodeType.defaultNodeConfig()} : {}
      store.execute({
        type: 'create',
        args: {id: nid, pid, ix: idx, data: {type, types}},
      }, id, nid)
      store.actions.editStart(nid)
      return nid
    },

    editChange: (store: Store, id: string) => store.actions.editAt(id, 'change'),

    focusNext(store: Store, id: string=store.state.active, editState: DefEditPos=false) {
      const next = nav.next(id, store.db.data, store.state.root, store.state.viewType)
      if (editState !== false) {
        store.actions.editAt(next, editState)
      } else {
        store.actions.setActive(next)
      }
    },

    focusPrev(store: Store, id: string=store.state.active, editState: DefEditPos=false) {
      const prev = nav.prev(id, store.db.data, store.state.root, store.state.viewType)
      if (editState !== false) {
        store.actions.editAt(prev, editState)
      } else {
        store.actions.setActive(prev)
      }
    },

    focusParent(store: Store, id: string=store.state.active) {
      if (id === store.state.root) return
      store.actions.setActive(store.db.data[id].parent)
    },

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

    pasteAfter(store: Store, id: string=store.state.active) {
      if (!id || !store.db.data[id]) return
      const {pid, idx} = afterPos(id, store.db.data, store.state.viewType)
      // TODO maybe the tree in the clipboard should have ids already?
      const nid = uuid()
      const items = []
      treeToItems(pid, nid, store.globalState.clipboard, items)
      store.execute({
        type: 'insertTree',
        args: {id: nid, pid, ix: idx, items},
      }, id, nid)
      store.actions.setActive(nid)
    },

    pasteBefore(store: Store, id: string=store.state.active) {
      if (!id || !store.db.data[id]) return
      let pid = store.db.data[id].parent
      if (!pid || id === 'root') return
      const idx = store.db.data[pid].children.indexOf(id)
      const nid = uuid()
      const items = []
      treeToItems(pid, nid, store.globalState.clipboard, items)
      store.execute({
        type: 'insertTree',
        args: {id: nid, pid, ix: idx, items},
      }, id, nid)
      store.actions.setActive(nid)
    },

    copyNode(store: Store, id: string=store.state.active) {
      store.globalState.clipboard = store.db.cloneTree(id)
    },

    remove(store: Store, id: string=store.state.active, goUp: boolean=false) {
      if (id === store.state.root) return
      const nid = nextActiveAfterRemoval(id, store.db.data, goUp)
      store.actions.setActive(nid)
      store.actions.copyNode(id)
      store.execute({
        type: 'remove',
        args: {id},
      }, id, nid)
    },

    _fixChildren(store: Store, id: string=store.state.active) {
      const children = store.db.data[id].children.filter(cid => !!store.db.data[cid] && store.db.data[cid].parent === id)
      store.actions.set(id, 'children', children)
    },

    makePrevSiblingsLastChild(store: Store, id: string=store.state.active) {
      const sibs = store.db.data[store.db.data[id].parent].children
      const idx = sibs.indexOf(id)
      if (idx === 0) return
      store.execute({
        type: 'move',
        args: {id, pid: sibs[idx - 1], expandParent: true, idx: -1, viewType: store.state.viewType}
      })
    },

    makeParentsNextSibling(store: Store, id: string=store.state.active) {
      if (id === store.state.root || store.db.data[id].parent === store.state.root) return
      const parent = store.db.data[store.db.data[id].parent]
      const sibs = store.db.data[parent.parent].children
      const idx = sibs.indexOf(parent._id)
      store.execute({
        type: 'move',
        args: {
          id,
          pid: parent.parent,
          expandParent: true,
          idx: idx + 1,
          viewType: store.state.viewType
        }
      })
    },

    rebase(store: Store, id: string=store.state.active) {
      if (!id) return
      store.state.root = id
      store.emit(store.events.root())
      // Ensure that the selected node is visible, given collapsednesses
      let active = store.state.active
      let tmp = active
      while (tmp && tmp !== id) {
        const node = store.db.data[tmp]
        if (node.views[store.state.viewType] && node.views[store.state.viewType].collapsed) {
          active = tmp
        }
        tmp = node.parent
      }
      store.actions.setActive(active)
    },

    movePrev(store: Store, id: string=store.state.active) {
      if (id === store.state.root) return
      const res = move.movePrev(id, store.db.data, store.state.root, store.state.viewType)
      if (!res) return
      store.execute({
        type: 'move',
        args: {
          id,
          pid: res.pid,
          expandParent: false,
          idx: res.idx,
          viewType: store.state.viewType
        }
      })
    },

    moveNext(store: Store, id: string=store.state.active) {
      if (id === store.state.root) return
      const res = move.moveNext(id, store.db.data, store.state.root, store.state.viewType)
      if (!res) return
      store.execute({
        type: 'move',
        args: {
          id,
          pid: res.pid,
          expandParent: false,
          idx: res.idx,
          viewType: store.state.viewType
        }
      })
    },

    focusNextSibling(store: Store, id: string=store.state.active) {
      if (id === store.state.root) return
      const sibs = store.db.data[store.db.data[id].parent].children
      const idx = sibs.indexOf(id)
      if (idx === sibs.length - 1) return
      store.actions.setActive(sibs[idx + 1])
    },

    focusPrevSibling(store: Store, id: string=store.state.active) {
      if (id === store.state.root) return
      const sibs = store.db.data[store.db.data[id].parent].children
      const idx = sibs.indexOf(id)
      if (idx === 0) return
      store.actions.setActive(sibs[idx - 1])
    },

    focusFirstSibling(store: Store, id: string=store.state.active) {
      if (id === store.state.root) return
      let nid = store.db.data[store.db.data[id].parent].children[0]
      if (nid === id) nid = store.db.data[id].parent
      store.actions.setActive(nid)
    },

    focusLastSibling(store: Store, id: string=store.state.active) {
      let nid
      if (id !== store.state.root) {
        const sibs = store.db.data[store.db.data[id].parent].children
        if (sibs[sibs.length - 1] !== id) {
          nid = sibs[sibs.length - 1]
        }
      }
      if (!nid) nid = nav.next(id, store.db.data, store.state.root, store.state.viewType)
      store.actions.setActive(nid)
    },

    focusRoot(store: Store) {
      store.actions.setActive(store.state.root)
    },

    focusLastVisibleChild(store: Store) {
      store.actions.setActive(nav.last(store.state.root, store.db.data, store.state.viewType))
    },

    // plugins things?
    setNodeType(store: Store, id: string, type: string) {
      const node = store.db.data[id]
      if (node.types[type] || !store.plugins.nodeTypes[type].defaultNodeConfig) { // if we already have data, don't fill w/ the default
        // TODO maybe let a plugin update the data if we're changing back?
        // dunno when we'd want that.
        store.actions.set(id, 'type', type)
      } else {
        // TODO I want a "set multiple nested" command, b/c this will cause
        // undue conflicts if changing multiple type configs (not that this is
        // likely)
        store.actions.update(id, {
          type,
          types: {
            ...node.types,
            [type]: store.plugins.nodeTypes[type].defaultNodeConfig(),
          },
        })
        // TODO emit "node:{type}:child-added:{pid}"
      }
    },

  },
}

export default actions
