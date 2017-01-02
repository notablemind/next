// @flow

// const maybeId = fn => (store, id) => fn(store, id || store.state.active)

import uuid from '../src/utils/uuid'
import * as nav from './nav'
import * as move from './move'

import type {
  Db,
  Node,
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

    updateMany(globalStore: GlobalStore, ids: Array<string>, updates: Array<any>) {
      globalStore.execute({
        type: 'updateMany',
        args: {ids, updates}
      })
    },

    setContent(globalStore: GlobalStore, id: string, content: string) {
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

    focusLastJumpOrigin(store: Store) {
      if (!store.state.lastJumpOrigin) {
        return
      }
      store.actions.setActive(store.state.lastJumpOrigin)
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

    pasteFile(store: Store, file: any, type: string, filename: string) {
      const fns = store.plugins.node.pasteFile
      const handled = fns.some(fn => fn(
        store, store.state.active, file, type, filename))
      if (!handled) {
        // TODO toast
        console.warn("Don't know how to paste this file")
      }
    },

    dropFile(store: Store, id: string, at: 'before' | 'after' | 'over', file: string) {
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
        args: {id: did, pid, expandParent: true, idx, viewType: store.state.viewType}
      }, did, did)
      store.emit(store.events.nodeView(did))
      store.actions.setActive(did)
      store.actions.setMode('normal')
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

    editChange: (store: Store, id: string) => store.actions.editAt(id, 'change'),

    focusNext(store: Store, id: string=store.state.active, editState: DefEditPos=false) {
      const next = nav.next(id, store.db.data, store.state.root, store.state.viewType)
      if (editState !== false) {
        store.actions.editAt(next, editState)
      } else {
        store.actions.setActive(next, true)
      }
    },

    focusPrev(store: Store, id: string=store.state.active, editState: DefEditPos=false) {
      const prev = nav.prev(id, store.db.data, store.state.root, store.state.viewType)
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

    insertTreeAfter(store: Store, id: string, tree: any) {
      let {pid, idx} = afterPos(id, store.db.data, store.state.viewType)
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
      if (!store.globalState.cut) return
      store.execute({
        type: 'replaceMergingChildren',
        args: {
          id: store.globalState.cut,
          destId: id,
        },
      }, id, store.globalState.cut)
    },

    pasteCutAfter(store: Store, id: string=store.state.active) {
      let {pid, idx} = afterPos(id, store.db.data, store.state.viewType)
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
        args: {id: cid, pid, expandParent: true, idx, viewType: store.state.viewType}
      }, cid, cid)
      store.emit(store.events.nodeView(cid))
      store.actions.setActive(cid, true)
    },

    pasteClipboardAfter(store: Store, id: string=store.state.active) {
      let {pid, idx} = afterPos(id, store.db.data, store.state.viewType)
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
      let {pid, idx} = afterPos(id, store.db.data, store.state.viewType)
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
        args: {id: cid, pid, expandParent: true, idx, viewType: store.state.viewType}
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

    openContextMenuForNode(store: Store, id: string, x: number, y: number) {
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
      }]
      if (store.globalState.cut) {
        baseItems.push({
          text: 'Paste cut item',
          action: () => store.actions.pasteCutAfter(id),
        })
        baseItems.push({
          text: 'Replace with cut item',
          action: () => store.actions.replaceFromCut(id),
        })
      }
      if (store.globalState.clipboard) {
        const clipboard = store.globalState.clipboard
        baseItems.push({
          text: 'Paste copied item',
          action: () => store.actions.pasteClipboardAfter(id),
        })
        baseItems.push({
          text: 'Replace with copied item',
          action: () => store.actions.replaceFromClipboard(id),
        })
        if (clipboard.children.length) {
          baseItems.push({
            text: 'Paste copied item w/o children',
            action: () => store.actions.pasteClipboardAfterWithoutChildren(id),
          })
        }
      }

      let menu: Array<MenuItem> = store.plugins.node.contextMenu.reduce((menu, fn) => {
        const res = fn(node, store)
        if (Array.isArray(res)) {
          return menu.concat(res)
        } else if (res) {
          return menu.concat([res])
        } else {
          return menu
        }
      }, baseItems)

      const nodeType = store.plugins.nodeTypes[node.type]
      if (nodeType && nodeType.contextMenu) {
        const res = nodeType.contextMenu(node.types[node.type], node, store)
        if (Array.isArray(res)) {
          menu = menu.concat(res)
        } else if (res) {
          menu = menu.concat([res])
        }
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
      const children = dedup(store.db.data[id].children.filter(cid => !!store.db.data[cid] && store.db.data[cid].parent === id))
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
      store.actions.setActive(active, true)
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
      store.actions.setActive(sibs[idx + 1], true)
    },

    focusPrevSibling(store: Store, id: string=store.state.active) {
      if (id === store.state.root) return
      const sibs = store.db.data[store.db.data[id].parent].children
      const idx = sibs.indexOf(id)
      if (idx === 0) return
      store.actions.setActive(sibs[idx - 1], true)
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
