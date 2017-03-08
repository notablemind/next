
const google = require('./google')
const fs = require('fs')
const path = require('path')

const PLUGIN_ID = 'sync'

const plugin = {
  id: PLUGIN_ID,

  init({baseDir, documentsDir, ipcMain}) {

    let clients = []
    let userProm = google.getUser(documentsDir)

    const updateUser = user => {
      userProm = Promise.resolve(user)
      clients.forEach(sender => sender.send('sync:user', user))
    }

    ipcMain.on('sync:user', evt => {
      if (clients.indexOf(evt.sender) === -1) {
        clients.push(evt.sender)
        evt.sender.on('destroyed', () => {
          clients = clients.filter(c => c !== evt.sender)
        })
      }
      userProm.then(user => evt.sender.send('sync:user', user))
    })

    ipcMain.on('sync:signin', evt => {
      console.log('google sign in')
      google.signIn(documentsDir).then(user => {
        updateUser(user)
      }, err => {
        console.log('umm failed to sign in')
        console.error(err)
      })
      // TODO google login!
    })

    ipcMain.on('sync:files', evt => {
      userProm
        .then(user => google.listFiles(user.token))
        .then(files => {
          const meta = JSON.parse(fs.readFileSync(path.join(documentsDir, 'meta.json'), 'utf8'))
          const nmIds = {}
          files.forEach(file => nmIds[file.appProperties.nmId] = file)
          // const localIds = {}
          // meta.forEach(file => localIds[file.id] = true)
          const locals = Object.keys(meta).map(id => ext(meta[id], {local: true, sync: syncObj(nmIds[id])}))
          const remotes = files
            .filter(file => !meta[file.appProperties.nmId])
            .map(remoteFile)
          return locals.concat(remotes)
        })
    })
  }
}

const ext = (a, b) => {
  const c = {}
  for (let n in a) c[n] = a[n]
  for (let n in b) c[n] = b[n]
  return c
}

const remoteFile = file => {
  const owner = file.owners[0]
  return {
    id: file.appProperties.nmId,
    title: file.name,
    remoteId: file.id,
    local: false,
    owner: {
      name: owner.displayName,
      me: owner.me,
      email: owner.emailAddress,
      profilePhoto: owner.photoLink,
    },
  }
}

const syncObj = file => {
  if (!file) return null
  const owner = file.owners[0]
  return {
    owner: {
      name: owner.displayName,
      me: owner.me,
      email: owner.emailAddress,
      profilePhoto: owner.photoLink,
    },
    remoteId: file.id,
    lastSyncTime: Date.now(),
    lastSyncVersion: file.version,
  }
}

module.exports = plugin
