// @flow

import Database from './Database'
import newNode from './newNode'
type Events = any

type Command<T> = {
  apply: (
    args: T,
    db: Database,
    events: Events,
  ) => ?{
    old: any,
    prom?: Promise<void>,
    events?: Array<string>,
  },
  undo: (
    old: any,
    db: Database,
    events: Events,
  ) => ?{
    prom?: Promise<void>,
    events?: Array<string>,
  },
}

const walk = (id, nodes, visit) => {
  visit(id)
  nodes[id].children.forEach(child => walk(child, nodes, visit))
}

const isAncestor = (maybeAncestor, id, nodes: any) => {
  while (id) {
    if (id === maybeAncestor) return true
    id = nodes[id].parent
  }
  return false
}

const commands: {[key: string]: Command<any>} = {
  update: {
    apply({id, update}, db, events) {
      const backdate = {}
      Object.keys(update).forEach(k => (backdate[k] = db.data[id][k]))
      const prom = db.update(id, update)
      // not much to see here
      return {old: {backdate, id}, prom}
    },
    undo({id, backdate}, db, events) {
      const prom = db.update(id, backdate)
      return {prom}
    },
  },

  updateMany: {
    apply({ids, updates}, db, events) {
      const old = ids.map(id => db.data[id])
      // TODO maybe have updateMany be understood by the db directly?
      const prom = db.saveMany(
        ids.map((id, i) => ({
          ...db.data[id],
          ...updates[i],
        })),
      )
      return {old, prom}
    },
    undo(old, db, events) {
      const prom = db.saveMany(old)
      return {prom}
    },
  },

  set: {
    apply({id, attr, value}, db, events) {
      const old = {
        id,
        attr,
        value: db.data[id][attr],
      }
      const prom = db.set(id, attr, value)
      return {old, prom}
    },
    undo({id, attr, value}, db, events) {
      return {prom: db.set(id, attr, value)}
    },
  },

  setNested: {
    apply({id, attrs, value}, db, events) {
      const old = {
        id,
        attrs,
        value: attrs.reduce((o, a) => (o ? o[a] : undefined), db.data[id]),
      }
      const prom = db.setNested(id, attrs, value)
      return {old, prom}
    },
    undo({id, attrs, value}, db, events) {
      // TODO this undo is a little incomplete, b/c setNested will construct
      // intermediate objects if they don't exist. if any code is looking for
      // the existance of these intermediate objects, this undo will be wrong.
      return {prom: db.setNested(id, attrs, value)}
    },
  },

  updateNested: {
    apply({id, attrs, update}, db, events) {
      const oldMap = attrs.reduce((o, a) => (o ? o[a] : undefined), db.data[id])
      const oldUpdate = oldMap
        ? Object.keys(update).reduce((o, k) => ((o[k] = oldMap[k]), o), {})
        : oldMap
      const old = {
        id,
        attrs,
        update: oldUpdate,
      }
      const prom = db.updateNested(id, attrs, update)
      return {old, prom}
    },
    undo({id, attrs, update}, db, events) {
      // TODO this undo is a little incomplete, b/c updateNested will construct
      // intermediate objects if they don't exist. if any code is looking for
      // the existance of these intermediate objects, this undo will be wrong.
      return {prom: db.updateNested(id, attrs, update)}
    },
  },

  create: {
    apply({id, pid, ix, data}, db, events) {
      const now = Date.now()
      if (!id || !db.data[pid]) return null
      const children = db.data[pid].children.slice()
      if (ix === -1) ix = children.length
      children.splice(ix, 0, id)
      const prom = db.saveMany([
        {
          ...newNode(id, pid, now),
          ...data,
        },
        {
          ...db.data[pid],
          children,
        },
      ])
      return {old: id, prom}
    },

    undo(id, db, events) {
      const node = db.data[id]
      if (!id || !node || !db.data[node.parent]) return null
      const parent = db.data[node.parent]
      const children = parent.children.slice()
      children.splice(children.indexOf(id), 1)
      return {
        prom: db.saveMany([
          {
            ...parent,
            children,
          },
          {
            ...node,
            _deleted: true,
          },
        ]),
      }
    },

    // TODO redo here
  },

  insertTree: {
    apply({id, pid, ix, items}, db, events) {
      const now = Date.now()
      if (!id || !db.data[pid]) return null
      const children = db.data[pid].children.slice()
      children.splice(ix, 0, id)
      const prom = db.saveMany(
        [
          {
            ...db.data[pid],
            children,
          },
        ].concat(items),
      )
      return {old: {id, items}, prom}
    },

    undo({id, items}, db, events) {
      const now = Date.now()
      if (!id) return null
      const node = db.data[id]
      const children = db.data[node.parent].children.slice()
      children.splice(children.indexOf(id), 1)
      return {
        prom: db.saveMany(
          [
            {
              ...db.data[node.parent],
              children,
            },
          ].concat(
            items.map(item => ({
              ...item,
              _deleted: true,
            })),
          ),
        ),
      }
    },

    /*
    redo(id, db, events) {
    },
    */
  },

  trash: {
    apply({id}, db, events) {
      const now = Date.now()
      if (!id || !db.data[id]) return null
      const node = db.data[id]
      if (!node.parent) return null
      const children = db.data[node.parent].children.slice()
      const idx = children.indexOf(id)
      children.splice(idx, 1)
      return {
        old: {node, idx},
        prom: db.saveMany([
          {
            ...db.data[node.parent],
            children,
          },
          {
            ...node,
            trashed: Date.now(),
          },
        ]),
      }
    },

    undo({idx, node}, db, events) {
      const children = db.data[node.parent].children.slice()
      children.splice(idx, 0, node._id)
      return {
        prom: db.saveMany([
          {
            ...db.data[node.parent],
            children,
          },
          {
            ...node,
            trashed: null,
          },
        ]),
      }
    },
  },

  unTrash: {
    apply({id}, db, events) {
      const node = db.data[id]
      const children = db.data[node.parent].children.slice()
      children.push(node._id)
      return {
        old: {id, trashed: node.trashed},
        prom: db.saveMany([
          {
            ...db.data[node.parent],
            children,
          },
          {
            ...node,
            trashed: null,
          },
        ]),
      }
    },

    undo({id, trashed}, db, events) {
      const node = db.data[id]
      const children = db.data[node.parent].children.filter(cid => cid !== id)
      return {
        prom: db.saveMany([
          {
            ...db.data[node.parent],
            children,
          },
          {
            ...node,
            trashed,
          },
        ]),
      }
    },
  },

  merge: {
    // NOTE always assuming that the survivor is above
    apply({oid, nid, content}, db, events) {
      const node = db.data[oid]
      const surv = db.data[nid]
      const idx = db.data[node.parent].children.indexOf(oid)
      const updates = [
        {
          ...db.data[oid],
          _deleted: true,
        },
      ].concat(node.children.map(cid => ({...db.data[cid], parent: nid})))
      if (node.parent === nid) {
        const nchildren = node.children.concat(surv.children)
        updates.push({
          ...db.data[nid],
          content,
          children: nchildren.filter(i => i !== oid),
        })
      } else {
        const nchildren = surv.children.concat(node.children)
        updates.push(
          {
            ...db.data[node.parent],
            children: db.data[node.parent].children.filter(i => i !== oid),
          },
          {
            ...db.data[nid],
            content,
            children: nchildren,
          },
        )
      }
      return {
        old: {node, idx, nid, ochildren: surv.children, ocontent: surv.content},
        prom: db.saveMany(updates),
      }
    },

    undo({node, nid, idx, ochildren, ocontent}, db, events) {
      const updates = [node].concat(
        node.children.map(child => ({...db.data[child], parent: node._id})),
      )
      if (nid === node.parent) {
        updates.push({
          ...db.data[nid],
          children: ochildren,
          content: ocontent,
        })
      } else {
        const sibs = db.data[node.parent].children.slice()
        sibs.splice(idx, 0, node._id)
        updates.push(
          {
            ...db.data[nid],
            children: ochildren,
            content: ocontent,
          },
          {
            ...db.data[node.parent],
            children: sibs,
          },
        )
      }
      return {
        prom: db.saveMany(updates),
      }
    },
  },

  remove: {
    apply({id}, db, events) {
      const now = Date.now()
      if (!id || !db.data[id]) return null
      const node = db.data[id]
      if (!node.parent) return null
      const children = db.data[node.parent].children.slice()
      const idx = children.indexOf(id)
      children.splice(idx, 1)
      const nodesToRemove = []
      walk(id, db.data, cid => nodesToRemove.push(db.data[cid]))
      return {
        old: {node, idx, nodes: nodesToRemove},
        prom: db.saveMany(
          [
            {
              ...db.data[node.parent],
              children,
            } /*{
          ...node,
          _deleted: true,
        }*/,
          ].concat(
            nodesToRemove.map(node => ({
              ...node,
              _deleted: true,
            })),
          ),
        ),
      }
    },

    undo({idx, node, nodes}, db, events) {
      const children = db.data[node.parent].children.slice()
      children.splice(idx, 0, node._id)
      return {
        prom: db.saveMany(
          [
            {
              ...db.data[node.parent],
              children,
            },
          ].concat(nodes),
        ),
      }
    },
  },

  replaceMergingChildren: {
    apply({id, destId}, db, events) {
      if (isAncestor(id, destId, db.data)) {
        console.warn("Can't move to a descendent")
        return
      }
      const pid = db.data[destId].parent
      const opid = db.data[id].parent
      const ochildren = db.data[opid].children.slice()
      // if (pid === opid) throw new Error('TODO')
      const oidx = ochildren.indexOf(id)
      ochildren.splice(oidx, 1)

      const nchildren = pid === opid ? ochildren : db.data[pid].children.slice()
      nchildren[nchildren.indexOf(destId)] = id

      const addChildren = destId === opid ? ochildren : db.data[destId].children
      const mergedChildren = addChildren.concat(db.data[id].children)

      const updates = [
        {...db.data[opid], children: ochildren},
        {...db.data[id], parent: pid, children: mergedChildren},
        {...db.data[destId], _deleted: true},
      ]

      if (pid !== opid) {
        updates.push({...db.data[pid], children: nchildren})
      }

      return {
        old: {
          id,
          destId,
          oidx,
          opid,
          replacedNode: db.data[destId],
          oldChildren: db.data[id].children,
        },
        prom: db.saveMany(updates),
      }
    },

    undo({id, destId, oidx, opid, replacedNode, oldChildren}, db, events) {
      const pid = db.data[id].parent

      const nchildren = db.data[pid].children.slice()
      nchildren[nchildren.indexOf(id)] = destId

      const ochildren = pid === opid
        ? nchildren
        : db.data[opid].children.slice()
      ochildren.splice(oidx, 0, id)

      const updates = [
        replacedNode,
        {...db.data[id], parent: opid, children: oldChildren},
      ]
      if (opid !== destId) {
        updates.push({...db.data[opid], children: ochildren})
      }

      if (pid !== opid) {
        updates.push({...db.data[pid], children: nchildren})
      }

      return {prom: db.saveMany(updates)}
    },
  },

  move: {
    apply({id, pid, idx, viewType}, db, events) {
      if (isAncestor(id, pid, db.data)) {
        console.warn("Can't move something into one of its descendents")
        return
      }
      const opid = db.data[id].parent
      const ochildren = db.data[opid].children.slice()
      const oidx = ochildren.indexOf(id)
      ochildren.splice(oidx, 1)
      if (opid === pid) {
        // if (oidx > idx) idx--
        ochildren.splice(idx, 0, id)
        const old = {id, oidx, opid, pid}
        const prom = db.set(pid, 'children', ochildren)
        return {prom, old}
      }
      const children = db.data[pid].children.slice()
      if (idx === -1) {
        children.push(id)
      } else {
        children.splice(idx, 0, id)
      }
      // TODO expandParent
      return {
        prom: db.saveMany([
          {
            ...db.data[opid],
            children: ochildren,
          },
          {
            ...db.data[pid],
            children,
          },
          {
            ...db.data[id],
            parent: pid,
          },
        ]),
        old: {id, oidx, opid, pid},
      }
    },

    undo({id, oidx, opid}, db, events) {
      const pid = db.data[id].parent
      const children = db.data[pid].children.slice()
      const idx = children.indexOf(id)
      children.splice(idx, 1)
      if (pid === opid) {
        if (idx < oidx) oidx--
        children.splice(oidx, 0, id)
        return {prom: db.set(pid, 'children', children)}
      }
      const ochildren = db.data[opid].children.slice()
      ochildren.splice(oidx, 0, id)
      return {
        prom: db.saveMany([
          {
            ...db.data[opid],
            children: ochildren,
          },
          {
            ...db.data[pid],
            children,
          },
          {
            ...db.data[id],
            parent: opid,
          },
        ]),
      }
    },
  },

  // TODO test all these things, right?
  moveMany: {
    apply({ids, pid, idx, viewType}, db, events) {
      if (ids.some(id => isAncestor(id, pid, db.data))) {
        console.warn("Can't move something into one of its descendents")
        return
      }

      const oldParents = {}
      const oldChildren = {
        [pid]: db.data[pid].children.slice(),
      }

      const childrens = {
        [pid]: db.data[pid].children.slice(),
      }
      ids.forEach(id => {
        const opid = db.data[id].parent
        oldParents[id] = opid
        const ochildren =
          childrens[opid] ||
          ((oldChildren[opid] = db.data[opid].children.slice()), (childrens[
            opid
          ] = db.data[opid].children.slice()))
        const oidx = ochildren.indexOf(id)
        ochildren.splice(oidx, 1)
      })

      if (idx === -1) {
        childrens[pid].push(...ids)
      } else {
        childrens[pid].splice(idx, 0, ...ids)
      }

      // TODO I should check for the no-op case...
      const updates = Object.keys(childrens)
        .map(opid => ({
          ...db.data[opid],
          children: childrens[opid],
        }))
        .concat(
          ids.map(id => ({
            ...db.data[id],
            parent: pid,
          })),
        )

      return {
        prom: db.saveMany(updates),
        old: {oldChildren, oldParents},
      }
    },

    undo({oldChildren, oldParents}, db, events) {
      return {
        prom: db.saveMany(
          Object.keys(oldChildren)
            .map(pid => ({
              ...db.data[pid],
              children: oldChildren[pid],
            }))
            .concat(
              Object.keys(oldParents).map(id => ({
                ...db.data[id],
                parent: oldParents[id],
              })),
            ),
        ),
      }
    },
  },
}

export default commands
