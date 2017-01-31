// @flow

// const maybeId = fn => (store, id) => fn(store, id || store.state.active)

import uuid from './uuid'
import * as nav from './nav'
import * as move from './move'

import type {
  Db,
  Node,
  DumpedNode,
} from './Database'

import type {
  Mode,
  EditPos,
  MenuItem,
  StoreState,
  GlobalState,
  ClipboardContents,
  GlobalStore,
  Store,
} from './types'

export type DefEditPos = EditPos | false

const fixedChildren = (id, nodes) =>
  dedup(nodes[id].children)
    .map(cid => typeof cid === 'string' ? cid : '' + cid)
    .filter(cid => !!nodes[cid] && nodes[cid].parent === id)

const checkParentage = (id, nodes, ids, updates) => {
  const children = fixedChildren(id, nodes)
  if (children.length !== nodes[id].children.length) {
    ids.push(id)
    updates.push({children})
  }
  children.forEach(child => checkParentage(child, nodes, ids, updates))
}

const dedup = ids => {
  const seen = {}
  return ids.filter(id => [!seen[id], seen[id]=true][0])
}

const copyToClipboard = (data) => {
  const handler = (e: any) => {
    document.removeEventListener('copy', handler)
    console.log('copying')
    for (let type in data) {
      e.clipboardData.setData(type, data[type])
    }
    e.preventDefault()
  }
  document.addEventListener('copy', handler)
  document.execCommand('copy')
}

const afterPos = (store, id, nodes, root) => {
  if (id === root) return {pid: id, idx: 0}
  let pid = nodes[id].parent
  let idx
  const views = nodes[id].views
  if (pid && (store.getters.isCollapsed(id) || !nodes[id].children.length)) {
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

const addMenuResult = (menu, result) => {
  if (Array.isArray(result)) {
    menu.push(...result)
  } else if (result) {
    menu.push(result)
  }
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

    updateMany(globalStore: GlobalStore, ids: Array<string>, updates: Array<any>) {
      globalStore.execute({
        type: 'updateMany',
        args: {ids, updates}
      })
    },

    setContent(globalStore: GlobalStore, id: string, content: string) {
      if (!globalStore.db.data[id]) return // ignore requests for deleted nodes
      globalStore.actions.set(id, 'content', content)
    },

    setPluginData(globalStore: GlobalStore, id: string, plugin: string, data: any) {
      globalStore.actions.setNested(id, ['plugins', plugin], data)
    },

    setNodeViewData(globalStore: GlobalStore, id: string, view: string, data: any) {
      globalStore.actions.setNested(id, ['views', view], data)
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

    setActive(store: Store, id: string, nonJump: bool=false) {
      if (!id || !store.db.data[id]) return
      const old = store.state.active
      store.actions.setActiveView()
      if (id === old) return
      if (!nonJump) {
        // TODO maybe allow you to jump back multiple jumps?
        store.state.lastJumpOrigin = old
      }
      store.state.active = id
      store.state.activeIsJump = !nonJump
      if (store.state.mode === 'insert') {
        store.state.editPos = 'default' // do I care about this?
      } /*else if (store.state.mode !== 'normal') {
        store.actions.setMode('normal')
      }*/
      if (store.db.data[old]) {
        store.emit(store.events.nodeView(old))
      }
      store.emitMany([
        store.events.activeNode(),
        store.events.nodeView(id),
      ])
      return true
    },

    focusLastJumpOrigin(store: Store) {
      if (!store.state.lastJumpOrigin) {
        return
      }
      store.actions.setActive(store.state.lastJumpOrigin)
    },

    setMode(store: Store, mode: Mode) {
      if (store.state.mode === mode) return
      if ((store.state.mode === 'visual' || store.state.mode === 'dragging')
          && mode !== 'visual' && mode !== 'dragging') {
        store.actions.clearSelection()
      }
      store.state.mode = mode
      if (store.getters.isActiveView()) {
        store.emit(store.events.activeMode())
      }
      store.emit(store.events.mode(store.id))
      store.emit(store.events.nodeView(store.state.active))
    },

    normalMode(store: Store, id: string=store.state.active) {
      if (store.state.mode === 'normal' && store.state.active === id) return
      store.actions.setActive(id)
      store.actions.setMode('normal')
    },

    visualMode(store: Store, id: string=store.state.active) {
      if (store.state.mode === 'visual' && store.state.active === id) return
      // store.actions.setMode('visual')
      store.actions.select(id)
      /*
      store.state.selection = {[id]: true}
      if (!store.actions.setActive(id)) {
        store.emit(store.events.nodeView(id))
      }
      */
    },

    expandSelectionPrev(store: Store) {
      throw new Error('not implt')
    },

    expandSelectionNext(store: Store) {
      throw new Error('not implt')
    },

    toggleCollapse(store: Store, id: string=store.state.active) {
      store.actions.setCollapsed(id, !store.getters.isCollapsed(id))
    },

    expand(store: Store, id: string=store.state.active) {
      store.actions.setCollapsed(id, false)
    },

    collapse(store: Store, id: string=store.state.active) {
      store.actions.setCollapsed(id, true)
    },

    clearSelection(store: Store) {
      // TODO make `selected` {ids: {}, ...} instead of just {}
      if (!store.state.selected) return
      Object.keys(store.state.selected).forEach(id => {
        store.emit(store.events.nodeView(id))
      })
      store.state.selected = null
    },

    select(store: Store, id: string) {
      store.actions.setMode('visual')
      if (!store.state.selected) {
        store.emit(store.events.nodeView(store.state.active))
        store.state.selected = {[store.state.active]: true}
      }
      if (id !== store.state.active) {
        store.state.selected[id] = true
        // store.state.active = id
        // store.emit(store.events.nodeView(id))
        store.actions.setActive(id)
      }
    },

    selectLimitingToSiblings(store: Store, id: string) {
      if (!store.state.selected) return store.actions.select(id)
      if (store.state.selected[id]) {
        delete store.state.selected[id]
        store.emit(store.events.nodeView(id))
        return
      }
      const selected = store.state.selected
      const pid = store.db.data[id].parent
      const sibs = store.db.data[pid].children
      const events = []
      Object.keys(selected).forEach(key => {
        if (store.db.data[key].parent !== pid) {
          delete selected[key]
          events.push(store.events.nodeView(key))
        }
      })
      if (events.length) store.emitMany(events)
      store.actions.select(id)
    },

    setSelection(store: Store, ids: Array<string>, adding: bool=false) {
      const oldSelected = store.state.selected || {}
      const selected = {}
      store.actions.setMode('visual')
      const events = []
      ids.forEach(id => {
        selected[id] = true
        if (!oldSelected[id]) {
          events.push(store.events.nodeView(id))
        }
      })
      Object.keys(oldSelected).forEach(id => {
        if (!selected[id]) {
          if (adding) {
            selected[id] = true
          } else {
            events.push(store.events.nodeView(id))
          }
        }
      })
      if (events.length) {
        store.emitMany(events)
      }
      store.state.selected = selected
      if (ids.length && ids.indexOf(store.state.active) === -1) {
        store.actions.setActive(ids[0])
      }
    },

    selectWithSiblings(store: Store, id: string) {
      const active = store.state.active
      const pid = store.db.data[id].parent
      const apid = store.db.data[active].parent
      store.actions.clearSelection()
      if (pid !== apid) {
        store.actions.setActive(id)
        store.actions.select(id)
        return
      }
      store.actions.setMode('visual')
      const sibs = store.db.data[pid].children
      const idx = sibs.indexOf(id)
      const aidx = sibs.indexOf(active)
      const first = Math.min(idx, aidx)
      const last = Math.max(idx, aidx)
      const events = []
      store.state.selected = {}
      for (let i = first; i <= last; i++) {
        store.state.selected[sibs[i]] = true
        events.push(store.events.nodeView(sibs[i]))
      }
      store.emitMany(events)
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

    pasteFile(store: Store, file: any, type: string, filename: string) {
      const fns = store.plugins.node.pasteFile
      const handled = fns.some(fn => fn(
        store, store.state.active, file, type, filename))
      if (!handled) {
        // TODO toast
        console.warn("Don't know how to paste this file")
      }
    },

    dropFiles(store: Store, id: string, at: 'before' | 'after' | 'over', files: Array<any>) {
      let pid, idx
      if (id === store.state.root) {
        pid = id
        idx = 0
      } else {
        const node = store.db.data[id]
        pid = node.parent
        const sibs = store.db.data[pid].children
        idx = sibs.indexOf(id)
        if (at === 'after') {
          idx += 1
        }
      }

      files.forEach(file => {
        const fns = store.plugins.node.dropFileNew
        const handled = fns.some(fn => fn(store, pid, idx, file))
        if (!handled) {
          // TODO toast
          console.warn("Don't know how to paste this file")
        } else {
          idx += 1
        }
      })
    },

    dropFile(store: Store, id: string, at: 'before' | 'after' | 'over', file: any) {
      if (at === 'over') {
        const fns = store.plugins.node.dropFileOnto
        const handled = fns.some(fn => fn(store, id, file))
        if (!handled) {
          // TODO toast
          console.warn("Don't know how to paste this file")
        }
        return
      }

      let pid, idx
      if (id === store.state.root) {
        pid = id
        idx = 0
      } else {
        const node = store.db.data[id]
        pid = node.parent
        const sibs = store.db.data[pid].children
        idx = sibs.indexOf(id)
        if (at === 'after') {
          idx += 1
        }
      }

      const fns = store.plugins.node.dropFileNew
      const handled = fns.some(fn => fn(store, pid, idx, file))
      if (!handled) {
        // TODO toast
        console.warn("Don't know how to paste this file")
      }
    },

    startDragging(store: Store, id: string=store.state.active) {
      if (!store.actions.setActive(id)) {
        store.emit(store.events.nodeView(id))
      }
      store.actions.setMode('dragging')
    },

    startDropping(store: Store, nodes: Array<DumpedNode>) {
      store.globalState.dropping = nodes
      // TODO how do I type `actions`?
      store.actions.setMode('dropping')
    },

    dragTo(store: Store, id: string, at: 'before' | 'after') {
      const did = store.state.active

      const node = store.db.data[id]
      const pid = node.parent
      const sibs = store.db.data[pid].children
      let idx = sibs.indexOf(id)

      if (at === 'after') {
        idx += 1
      }

      if (store.db.data[did].parent === pid) {
        const pidx = sibs.indexOf(did)
        // TODO test this
        if (pidx < idx) idx -= 1
        if (idx === pidx) {
          store.emit(store.events.nodeView(did))
          store.actions.setMode('normal')
          return
        }
      }

      // TODO maybe don't do after for children
      store.execute({
        type: 'move',
        args: {id: did, pid, idx, viewType: store.state.viewType}
      }, did, did)
      store.emit(store.events.nodeView(did))
      store.actions.setActive(did)
      store.actions.setMode('normal')
    },

    move(store: Store, id: string, pid: string, idx: number) {
      const opid = store.db.data[id].parent
      if (opid === pid) {
        const oidx = store.db.data[pid].children.indexOf(id)
        if (oidx < idx) idx -= 1
      }
      const nextActive = !store.getters.isCollapsed(pid) ? id : pid
      store.execute({
        type: 'move',
        args: {id, pid, idx, viewType: store.state.viewType}
      }, id, nextActive)
      store.emit(store.events.nodeView(id))
      store.actions.setActive(nextActive)
      store.actions.setMode('normal')
    },

    moveSelected(store: Store, pid: string, idx: number) {
      // debugger
      if (!store.state.selected) return
      // TODO is there some ordering thing that I want to impose maybe?
      const ids = Object.keys(store.state.selected)
      if (ids.length === 1) {
        return store.actions.move(ids[0], pid, idx, false)
      }
      if (!ids.length) return

      const sibs = store.db.data[pid].children
      let idxCorrection = 0
      ids.forEach(id => {
        if (store.db.data[id].parent === pid) {
          const oidx = sibs.indexOf(id)
          if (oidx < idx) {
            idxCorrection += 1
          }
        }
      })
      idx -= idxCorrection

      const nextActive = !store.getters.isCollapsed(pid) ? ids[0] : pid
      store.execute({
        type: 'moveMany',
        args: {ids, pid, idx, viewType: store.state.viewType}
      }, store.state.active, nextActive)
      store.emitMany(ids.map(id => store.events.nodeView(id)))
      store.actions.setActive(nextActive)
      if (nextActive === pid) {
        store.actions.setMode('normal')
      } else {
        store.actions.setMode('visual')
      }
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
      const {pid, idx} = afterPos(store, id, store.db.data, store.state.root)
      const nid = uuid()
      store.execute({
        type: 'create',
        args: {id: nid, pid, ix: idx},
      }, id, nid)
      store.actions.editStart(nid)
      return nid
    },

    createBefore(store: Store, id: string=store.state.active, content: string='', viewData: ?any=null) {
      const node = store.db.data[id]
      if (!id || !node) return
      let pid = node.parent
      if (!pid || id === 'root') return
      const ix = store.db.data[pid].children.indexOf(id)

      return store.actions.create({
        fromNode: node,
        viewData,
        content,
        pid,
        ix,
      })

      /*
      const nid = uuid()
      const oldType = store.db.data[id].type
      const nodeType = store.plugins.nodeTypes[oldType]
      const type = nodeType.newSiblingsShouldCarryType ?
        oldType : 'normal'
      const types = nodeType.newSiblingsShouldCarryType && nodeType.defaultNodeConfig ?
        {[oldType]: nodeType.defaultNodeConfig()} : {}
      const views = viewData ? {[store.state.viewType]: viewData} : {}
      store.execute({
        type: 'create',
        args: {id: nid, pid, ix: idx, data: {content, type, types, views}},
      }, id, nid)
      store.actions.editStart(nid)
      return nid
      */
    },

    createAfter(store: Store, id: string=store.state.active, content: string='', viewData: ?any=null) {
      const node = store.db.data[id]
      if (!id || !node) return
      const {pid, idx} = afterPos(store, id, store.db.data, store.state.root)

      let fromNode = pid === node.parent ? node : (node.children[0] && store.db.data[node.children[0]])

      return store.actions.create({
        fromNode,
        viewData,
        content,
        ix: idx,
        pid,
      })

      /*
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
      const views = viewData ? {[store.state.viewType]: viewData} : {}
      store.execute({
        type: 'create',
        args: {id: nid, pid, ix: idx, data: {content, type, types, views}},
      }, id, nid)
      store.actions.editStart(nid)
      return nid
      */
    },

    createChild(store: Store, id: string=store.state.active, content: string='') {
      const node = store.db.data[id]
      if (!id || !node) return
      const firstChild = node.children[0] && store.db.data[node.children[0]]

      if (store.getters.isCollapsed(id)) {
        store.actions.setCollapsed(id, false)
      }

      return store.actions.create({
        fromNode: firstChild,
        content,
        pid: id,
        ix: 0,
        // type,
      })
    },

    createLastChild(store: Store, id: string=store.state.active, content: string='', viewData: ?any=null) {
      const node = store.db.data[id]
      if (!id || !node) return
      const nid = uuid()
      let type = 'normal'
      const firstChild = node.children[0] && store.db.data[node.children[0]]
      if (firstChild && store.plugins.nodeTypes[firstChild.type].newSiblingsShouldCarryType) {
        type = firstChild.type
      }
      const nodeType = store.plugins.nodeTypes[type]
      const types = nodeType.defaultNodeConfig ?
        {[type]: nodeType.defaultNodeConfig()} : {}
      const views = viewData ? {[store.state.viewType]: viewData} : {}

      if (store.getters.isCollapsed(id)) {
        store.actions.setCollapsed(id, false)
      }

      store.execute({
        type: 'create',
        args: {id: nid, pid: id, ix: -1, data: {content, type, types, views}},
      }, id, nid)
      store.actions.editStart(nid)
      return nid
    },

    createNextSibling(store: Store, id: string=store.state.active) {
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

    createFull(store: Store, {pid, ix, node}: {pid: string, ix: string, node: Node}) {
      const nid = uuid()
      store.execute({
        type: 'create',
        args: {id: nid, pid, ix, data: node},
      }, store.state.active, nid)
      return nid
    },

    create(store: Store, {pid, ix, content, type, fromNode, viewData, typeData}: any) {
      if (!type) {
        if (fromNode && store.plugins.nodeTypes[fromNode.type].newSiblingsShouldCarryType) {
          type = fromNode.type
        } else {
          type = 'normal'
        }
      }

      const nid = uuid()
      const nodeType = store.plugins.nodeTypes[type]
      const types = typeData ?
        {[type]: typeData} :
        (nodeType.defaultNodeConfig ?
        {[type]: nodeType.defaultNodeConfig(fromNode)} : {})
      const views = viewData ? {[store.state.viewType]: viewData} : {}
      store.execute({
        type: 'create',
        args: {id: nid, pid, ix, data: {content, type, types, views}},
      }, store.state.active, nid)
      store.actions.editStart(nid)
      return nid
    },

    editChange: (store: Store, id: string) => store.actions.editAt(id, 'change'),

    focusNext(store: Store, id: string=store.state.active, editState: DefEditPos=false) {
      const next = nav.next(id, store.db.data, store.state.root, store.getters.isCollapsed)
      if (editState !== false) {
        store.actions.editAt(next, editState)
      } else {
        store.actions.setActive(next, true)
      }
    },

    focusPrev(store: Store, id: string=store.state.active, editState: DefEditPos=false) {
      const prev = nav.prev(id, store.db.data, store.state.root, store.getters.isCollapsed)
      if (editState !== false) {
        store.actions.editAt(prev, editState)
      } else {
        store.actions.setActive(prev, true)
      }
    },

    focusParent(store: Store, id: string=store.state.active) {
      if (id === store.state.root) return
      store.actions.setActive(store.db.data[id].parent)
    },

    insertTreeAfter(store: Store, id: string, tree: any) {
      let {pid, idx} = afterPos(store, id, store.db.data, store.state.root)
      const nid = uuid()
      const items = []
      treeToItems(pid, nid, tree, items)
      store.execute({
        type: 'insertTree',
        args: {id: nid, pid, ix: idx, items},
      }, id, nid)
      store.actions.setActive(nid, true)
    },

    replaceFromCut(store: Store, id: string=store.state.active) {
      const cut = store.globalState.cut
      if (!cut) return
      store.globalState.cut = null
      store.actions.setActive(cut)
      store.execute({
        type: 'replaceMergingChildren',
        args: {
          id: cut,
          destId: id,
        },
      }, id, cut)
    },

    pasteCutAfter(store: Store, id: string=store.state.active) {
      let {pid, idx} = afterPos(store, id, store.db.data, store.state.root)
      if (!store.globalState.cut) return
      const cid = store.globalState.cut
      if (store.db.data[cid].parent === pid) {
        const cidx = store.db.data[pid].children.indexOf(cid)
        if (cidx < idx) {
          idx -= 1
        }
      }
      store.globalState.cut = null
      store.execute({
        type: 'move',
        args: {id: cid, pid, idx, viewType: store.state.viewType}
      }, cid, cid)
      store.emit(store.events.nodeView(cid))
      store.actions.setActive(cid, true)
    },

    pasteClipboardAfter(store: Store, id: string=store.state.active) {
      let {pid, idx} = afterPos(store, id, store.db.data, store.state.root)
      const nid = uuid()
      const items = []
      if (!store.globalState.clipboard) return
      treeToItems(pid, nid, store.globalState.clipboard, items)
      store.execute({
        type: 'insertTree',
        args: {id: nid, pid, ix: idx, items},
      }, id, nid)
      store.actions.setActive(nid, true)
    },

    pasteClipboardAfterWithoutChildren(store: Store, id: string=store.state.active) {
      let {pid, idx} = afterPos(store, id, store.db.data, store.state.root)
      const nid = uuid()
      const item = {
        ...store.globalState.clipboard,
        _id: nid,
        parent: pid,
        children: [],
      }
      store.execute({
        type: 'insertTree',
        args: {id: nid, pid, ix: idx, items: [item]},
      }, id, nid)
      store.actions.setActive(nid, true)
    },

    pasteAfter(store: Store, id: string=store.state.active) {
      if (!id || !store.db.data[id]) return
      if (store.globalState.cut) {
        store.actions.pasteCutAfter(id)
      } else if (store.globalState.clipboard) {
        store.actions.pasteClipboardAfter(id)
      }
    },

    pasteClipboardBefore(store: Store, id: string=store.state.active) {
      if (!id || !store.db.data[id]) return
      let pid = store.db.data[id].parent
      if (!pid || id === 'root') return
      let idx = store.db.data[pid].children.indexOf(id)
      const nid = uuid()
      const items = []
      if (!store.globalState.clipboard) return
      treeToItems(pid, nid, store.globalState.clipboard, items)
      store.execute({
        type: 'insertTree',
        args: {id: nid, pid, ix: idx, items},
      }, id, nid)
      store.actions.setActive(nid, true)
    },

    pasteCutBefore(store: Store, id: string=store.state.active) {
      if (!id || !store.db.data[id]) return
      let pid = store.db.data[id].parent
      if (!pid || id === 'root') return
      let idx = store.db.data[pid].children.indexOf(id)
      if (!store.globalState.cut) return // TODO toast?
      const cid = store.globalState.cut
      if (store.db.data[cid].parent === pid) {
        const cidx = store.db.data[pid].children.indexOf(cid)
        if (cidx < idx) {
          idx -= 1
        }
      }
      store.globalState.cut = null
      store.execute({
        type: 'move',
        args: {id: cid, pid, idx, viewType: store.state.viewType}
      }, cid, cid)
      store.emit(store.events.nodeView(cid))
      store.actions.setActive(cid, true)
    },

    pasteBefore(store: Store, id: string=store.state.active) {
      if (store.globalState.cut) {
        store.actions.pasteCutBefore(id)
      } else {
        store.actions.pasteClipboardBefore(id)
      }
    },

    openGeneralContextMenu(store: Store, x: number, y: number) {
      let menu
      if (store.state.mode === 'visual') {
        menu = []
        if (store.viewTypes[store.state.viewType].contextMenuVisual) {
          addMenuResult(
            menu,
            store.viewTypes[store.state.viewType].contextMenuVisual(
              store
            )
          )
          // TODO add plugins stuffs
        }
        // TODO
      } else {
        menu = [{
          text: 'Copy',
          action: store.actions.copyNode,
        // }, {
          // text: 'Paste',
          // action: store.actions.pasteAfter,
        }]
      }
      store.actions.openContextMenu({top: y, left: x}, menu)
    },

    replaceFromClipboard(store: Store, id: string) {
    },

    openContextMenuForNode(store: Store, id: string, x: number, y: number) {
      // TODO if visual mode, only do visual mode items
      const node = store.db.data[id]
      const baseItems: Array<MenuItem> = [{
        text: 'Zoom to here',
        disabled: node._id === store.state.root,
        action: () => store.actions.rebase(node._id),
      }, {
        text: 'Copy',
        action: () => store.actions.copyNode(node._id),
      }, {
        text: 'Cut',
        action: () => store.actions.setCut(node._id),
      }, {
        text: 'Delete',
        action: () => store.actions.remove(node._id),
      }]
      if (store.globalState.cut) {
        baseItems.push({
          text: 'Paste cut item after',
          action: () => store.actions.pasteCutAfter(id),
        })
        baseItems.push({
          text: 'Replace with cut item',
          action: () => store.actions.replaceFromCut(id),
        })
      }
      if (store.viewTypes[store.state.viewType].contextMenu) {
        addMenuResult(
          baseItems,
          store.viewTypes[store.state.viewType].contextMenu(store, id)
        )
        // TODO add plugins stuffs
      }
      if (store.globalState.clipboard) {
        const clipboard = store.globalState.clipboard
        const pasteSpecial: Array<MenuItem> = [
          {
            text: 'Replace with copied item',
            action: () => {
              store.actions.replaceFromClipboard(id)
            },
          }
        ]
        if (clipboard.children.length) {
          pasteSpecial.push({
            text: 'Paste copied item after w/o children',
            action: () => store.actions.pasteClipboardAfterWithoutChildren(id),
          })
        }

        const nodeType = store.plugins.nodeTypes[node.type]
        if (nodeType && nodeType.pasteSpecial) {
          addMenuResult(
            pasteSpecial,
            nodeType.pasteSpecial(
              node.types[node.type],
              clipboard,
              node,
              store,
            )
          )
        }

        store.plugins.node.pasteSpecial.map(fn => {
          addMenuResult(pasteSpecial, fn(node, store, clipboard))
        })
        baseItems.push({
          text: 'Paste',
          action: () => store.actions.pasteClipboardAfter(id),
        })
        baseItems.push({
          text: 'Paste special',
          children: pasteSpecial,
        })
      }

      let menu: Array<MenuItem> = baseItems
      store.plugins.node.contextMenu.forEach(fn => {
        addMenuResult(menu, fn(node, store))
      })

      const nodeType = store.plugins.nodeTypes[node.type]
      if (nodeType && nodeType.contextMenu) {
        addMenuResult(menu, nodeType.contextMenu(node.types[node.type], node, store))
      }

      menu.sort((a, b) => (a.children ? 0 : 1) - (b.children ? 0 : 1))

      store.actions.setActive(id)
      store.actions.openContextMenu({
        top: y,
        left: x,
      }, menu, node)
    },

    openContextMenu(store: Store, pos: {top: number, left: number}, menu: Array<MenuItem>, node?: any) {
      store.state.contextMenu = {pos, menu, node}
      store.emit(store.events.contextMenu())
    },

    closeContextMenu(store: Store) {
      store.state.contextMenu = null
      store.emit(store.events.contextMenu())
    },

    copyNode(store: Store, id: string=store.state.active, copyToSystemClipboard: bool=true) {
      if (store.globalState.cut) {
        store.emit(store.events.nodeView(store.globalState.cut))
        store.globalState.cut = null
      }
      store.globalState.clipboard = store.db.cloneTree(id)
      if (copyToSystemClipboard) {
        copyToClipboard({
          'application/x-notablemind': JSON.stringify({
            'source': 'clipboard',
            'document': store.globalState.documentId,
            'runtime': store.globalState.runtimeId,
            // TODO copying attachments doesn't work cross-document.
            'tree': store.globalState.clipboard,
          }),
        })
      }
    },

    setCut(store: Store, id: string=store.state.active) {
      if (store.globalState.cut) {
        store.emit(store.events.nodeView(store.globalState.cut))
      }
      store.globalState.cut = id // TODO multi-node
      copyToClipboard({
        'application/x-notablemind': JSON.stringify({
          'source': 'cut',
          'runtime': store.globalState.runtimeId,
          'tree': store.db.cloneTree(id),
        }),
      })
      store.emit(store.events.nodeView(id))
    },

    remove(store: Store, id: string=store.state.active, goUp: boolean=false) {
      if (id === store.state.root) return
      const nid = nextActiveAfterRemoval(id, store.db.data, goUp)
      store.actions.setActive(nid, true)
      store.actions.copyNode(id, false)
      store.execute({
        type: 'remove',
        args: {id},
      }, id, nid)
    },

    _fixChildren(store: Store, id: string=store.state.active) {
      const children = fixedChildren(id, store.db.data)
      store.actions.set(id, 'children', children)
    },

    makePrevSiblingsLastChild(store: Store, id: string=store.state.active) {
      const sibs = store.db.data[store.db.data[id].parent].children
      const idx = sibs.indexOf(id)
      if (idx === 0) return
      const pid = sibs[idx - 1]
      if (store.getters.isCollapsed(pid)) {
        store.actions.setCollapsed(pid, false)
      }
      store.execute({
        type: 'move',
        args: {id, pid, idx: -1, viewType: store.state.viewType}
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
          idx: idx + 1,
          viewType: store.state.viewType
        }
      })
    },

    rebaseLast(store: Store) {
      store.actions.rebase(store.state.lastRoot)
    },

    rebase(store: Store, id: string=store.state.active) {
      if (!id) return
      if (id === store.state.root) return
      store.state.lastRoot = store.state.root
      store.state.root = id
      store.emit(store.events.root())
      store.emit(store.events.serializableState())
      // Ensure that the selected node is visible, given collapsednesses
      let active = store.state.active
      let tmp = active
      while (tmp && tmp !== id) {
        const node = store.db.data[tmp]
        if (store.getters.isCollapsed(tmp)) {
          active = tmp
        }
        tmp = node.parent
      }
      if (active === store.state.root && store.state.viewTypeConfig.defaultActive === 'firstChild') {
        if (store.db.data[active].children.length) {
          active = store.db.data[active].children[0]
        }
      }
      store.actions.setActive(active, true)
    },

    rebaseNext(store: Store) {
      const id = store.state.root
      const pid = store.db.data[id].parent
      const sibs = store.db.data[pid].children
      const idx = sibs.indexOf(id)
      if (idx < sibs.length - 1) {
        store.actions.rebase(sibs[idx + 1])
        store.actions.setActive(sibs[idx + 1])
      }
    },

    rebasePrev(store: Store) {
      const id = store.state.root
      const pid = store.db.data[id].parent
      const sibs = store.db.data[pid].children
      const idx = sibs.indexOf(id)
      if (idx > 0) {
        store.actions.rebase(sibs[idx - 1])
        store.actions.setActive(sibs[idx - 1])
      }
    },

    movePrev(store: Store, id: string=store.state.active) {
      if (id === store.state.root) return
      const res = move.movePrev(id, store.db.data, store.state.root, store.getters.isCollapsed)
      if (!res) return
      store.execute({
        type: 'move',
        args: {
          id,
          pid: res.pid,
          idx: res.idx,
          viewType: store.state.viewType
        }
      })
    },

    moveNext(store: Store, id: string=store.state.active) {
      if (id === store.state.root) return
      const res = move.moveNext(id, store.db.data, store.state.root, store.getters.isCollapsed)
      if (!res) return
      store.execute({
        type: 'move',
        args: {
          id,
          pid: res.pid,
          idx: res.idx,
          viewType: store.state.viewType
        }
      })
    },

    focusNextSibling(store: Store, id: string=store.state.active, editState: DefEditPos=false) {
      if (id === store.state.root) return
      const sibs = store.db.data[store.db.data[id].parent].children
      const idx = sibs.indexOf(id)
      if (idx === sibs.length - 1) return
      const nid = sibs[idx + 1]
      if (editState) {
        store.actions.editAt(nid, editState)
      } else {
        store.actions.setActive(nid, true)
      }
      return true
    },

    focusPrevSibling(store: Store, id: string=store.state.active, editState: DefEditPos=false) {
      if (id === store.state.root) return
      const sibs = store.db.data[store.db.data[id].parent].children
      const idx = sibs.indexOf(id)
      if (idx === 0) return
      const nid = sibs[idx - 1]
      if (editState) {
        store.actions.editAt(nid, editState)
      } else {
        store.actions.setActive(nid, true)
      }
      return true
    },

    focusFirstChild(store: Store, id: string=store.state.active) {
      const child = store.db.data[id].children[0]
      if (child) {
        store.actions.setActive(child, true)
      }
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
      if (!nid) nid = nav.next(id, store.db.data, store.state.root, store.getters.isCollapsed)
      store.actions.setActive(nid)
    },

    focusRoot(store: Store) {
      store.actions.setActive(store.state.root)
    },

    focusLastVisibleChild(store: Store) {
      store.actions.setActive(nav.last(store.state.root, store.db.data, store.getters.isCollapsed))
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


    _auditTree(store: Store) {
      const ids = []
      const updates = []
      checkParentage('root', store.db.data, ids, updates)
      console.log('updates', ids, updates)
      if (ids.length) {
        store.actions.updateMany(ids, updates)
      }
    },
  },
}

export default actions
