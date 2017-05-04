import Database from './Database'

export const version = 2

const migrations = {
  0: (db: Database): Promise<void> => {
    return db.save({
      ...db.data.settings,
      version: 1,
      defaultViews: {
        root: {
          type: 'list',
          settings: {},
        },
      },
    })
  },
  1: (db: Database): Promise<void> => {
    const changed = []
    Object.keys(db.data).forEach(key => {
      if (key === 'settings') return
      const node = db.data[key]
      if (node.types && node.types.todo && node.types.todo.done) {
        changed.push({
          ...node,
          completed: node.types.todo.didDate,
          types: {
            ...node.types,
            todo: {
              dueDate: node.types.todo.dueDate,
            },
          },
        })
      }
    })
    return db.saveMany(changed)
  },
}

export const migrate = (db: Database): Promise<void> => {
  let dbVersion = db.data.settings.version || 0
  let promise = Promise.resolve()
  while (dbVersion < version) {
    promise = promise.then(migrations[dbVersion](db))
    dbVersion += 1
  }
  return promise
}
