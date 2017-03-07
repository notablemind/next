
const google = require('./google')

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
      // TODO google get files n stuff
    })
  }
}

module.exports = plugin
