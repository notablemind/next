
const ext = (a, b) => {
  const c = {}
  for (let n in a) c[n] = a[n]
  for (let n in b) c[n] = b[n]
  return c
}

const PLUGIN_ID = 'files'

const uuid = () => Math.random().toString(16).slice(2)

const plugin = {
  id: PLUGIN_ID,

  init: ({baseDir, documentsDir, ipcMain, actions}) => {
    /*
    console.log('files electron')
    const listeners = {}

    ipcMain.on('meta:load', (evt, uid) => {
      listeners[uid] = evt.sender
      evt.sender.on('destroyed', () => {
        delete listeners[uid]
      })
      evt.sender.send('meta', actions.getMeta())
    })
    ipcMain.on('meta:saveall', (evt, uid, newfiles) => {
      actions.importMeta(newfiles)
      const meta = actions.getMeta()
      Object.keys(listeners).forEach(mid => {
        if (mid !== uid) listeners[mid].send('meta', meta)
      })
    })
    ipcMain.on('meta:update', (evt, uid, id, update) => {
      actions.updateMeta(id, update)
      Object.keys(listeners).forEach(mid => {
        if (mid !== uid) listeners[mid].send('meta:update', id, update)
      })
    })
    return {listeners}
    */
  },
}

module.exports = plugin
