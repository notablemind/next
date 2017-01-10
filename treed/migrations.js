
import Database from './Database'

export const version = 1

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
      }
    })
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

