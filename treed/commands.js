// @flow

type Db<D> = {
  data: {[key: string]: D},
  save: (doc: any) => Promise<void>,
  saveMany: (docs: Array<any>) => Promise<void>,
  update: (id: string, doc: any) => Promise<void>,
  set: (id: string, attr: string, value: any) => Promise<void>,
  delete: (doc: any) => Promise<void>,
}
type Events = any

type Command<T, D> = {
  apply: (args: T, db: Db<D>, events: Events) => ?{
    old: any,
    prom?: Promise<void>,
    events?: Array<string>
  },
  undo: (old: any, db: Db<D>, events: Events) => ?{
    prom?: Promise<void>,
    events?: Array<string>,
  }
}

const commands: {[key: string]: Command<*, *>} = {
  update: {
    apply({id, update}, db, events) {
      const backdate = {}
      Object.keys(update).forEach(k => backdate[k] = db.data[id][k])
      const prom = db.update(id, {update})
      // not much to see here
      return {old: {backdate, id}, prom}
    },
    undo({id, backdate}, db, events) {
      const prom = db.update(id, backdate)
      return {prom}
    }
  },

  updateMany: {
    apply({ids, updates}, db, events) {
      const old = ids.map(id => db.data[id])
      const prom = db.saveMany(ids.map((id, i) => ({
        ...db.data[id],
        ...updates[i],
      })))
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
        value: db.data[id][attr]
      }
      const prom = db.set(id, attr, value)
      return {old, prom}
    },
    undo({id, attr, value}, db, events) {
      return {prom: db.set(id, attr, value)}
    },
  },

  create: {
    apply({id, pid, ix, data}, db, events) {
      const now = Date.now()
      if (!id || !db.data[pid]) return null
      const children = db.data[pid].children.slice()
      const prom = db.saveMany([{
        _id: id,
        parent: pid,
        content: '',
        children: [],
        collapsed: true,
        created: now,
        modified: now,
        type: 'normal',
        plugins: {},
        views: {},
        ...data,
      }, {
        ...db.data[pid],
        children: children.splice(ix, 0, id),
      }])
      return {old: id}
    },

    undo(id, db, events) {
      const node = db.data[id]
      if (!id || !node || !db.data[node.parent]) return null
      const parent = db.data[node.parent]
      const children = parent.children.slice()
      return {prom: db.saveMany([{
        ...parent,
        children: children.splice(children.indexOf(id), 1),
      }, {
        ...node,
        _deleted: true,
      }])}
    }

  },

  // TODO setMany
  // remove
  // move
}

export default commands

