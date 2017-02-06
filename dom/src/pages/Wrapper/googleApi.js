
import {googleClientId} from '../../../../shared/config.json'
import type {User} from './types'
import googleWrapper from './googleWrapper'
import getRootFolder from './googleRootFolder'

const MIME_TYPE = 'application/x-notablemind-db'
const FIVE_MINUTES = 1000 * 60 * 5 // TODO maybe save more often?
const TEN_MINUTES = 1000 * 60 * 10

const USER_KEY = 'notablemind:user:google'
const scopes = [
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
]


export const loadUser = () => {
  let val = localStorage[USER_KEY]
  try {
    return val ? JSON.parse(val) : null
  } catch (e) {
    return null
  }
}

const saveUser = (user: User) => {
  localStorage[USER_KEY] = JSON.stringify(user)
}

const clearUser = () => {
  localStorage[USER_KEY] = ''
}

let returning = null

export const getSession = (done: Function) => {
  console.log('getting session')
  googleWrapper({
    clientId: googleClientId,
    scopes,
  }).then(
    user => {
      done(null, new Session(user))
    },
    err => done(err)
  )
}






export const _getSession = (done: Function) => {
  if (returning) {
    return finishLogin(returning, done)
  }
  const user = loadUser()
  if (!user) return setTimeout(() => done('logged out'), 0)
  // ummmm what do I do with this then... maybe check the profile or sth
  console.log('gots a user')
}

const finishLogin = (data, done) => {
  console.log('finishing login I think', data)
}

// called on return to the page from google oauth
export const checkForReturn = () => {
  if (location.hash.indexOf('access_token') !== -1) {
    const args = location.hash.slice(1).split('&')
    const data = args.reduce((obj, item) => {
      const [name, val] = item.split('=')
      obj[name] = decodeURIComponent(val)
      return obj
    }, {})

    console.log('got it', data)
    location.hash = data.state
    returning = data
  }
}

const oauthUrl = ({clientId, redirectUri, scopes}) =>
  `https://accounts.google.com/o/oauth2/v2/auth?
    response_type=token&
    state=${encodeURIComponent(location.hash)}&
    scope=${encodeURIComponent(scopes.join(' '))}&
    redirect_uri=${encodeURIComponent(redirectUri)}&
    client_id=${encodeURIComponent(clientId)}`.replace(/\n\s*/g, '')

export const login = () => {
  const uri = oauthUrl({
    clientId: googleClientId,
    scopes: scopes,
    redirectUri: 'http://localhost:4150/',
  })
  window.location = uri
}

const getOldestItem = query => {
  return gapi.client.drive.files.list({
    q: query
  }).then(({result: {items}}) => {
    if (items.length === 1) return items[0]
    items.sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime())
    return items[0]
  })
}

const fetchFileContents = file => {
  if (file.downloadUrl) {
    const accessToken = gapi.auth.getToken().access_token
    return fetch(
      file.downloadUrl,
      {headers: {Authorization: `Bearer ${accessToken}`}}
    )
  } else {
    return Promise.reject(new Error("Not downloadable"))
  }
}

const createDocFolder = (root, id): Promise<*> => {
  return gapi.client.drive.files.insert({
    title: 'Untitled',
    mimeType: 'application/vnd.google-apps.folder',
    appProperties: {nmId: id},
  }).then(({result, status}) => {
    if (status !== 200) throw new Error('failed to create')
    return result
  })
}

const getDocFolder = id => {
  return getOldestItem(
    `appProperties has { key='nmId' and value='${id}' }`
  )
}

const getDocContents = driveId => {
  return getOldestItem(
    `'${id}' in parents and title = 'contents.nm'`
  ).then(downloadFile).then(res => res.json())
}

class Session {
  user: User
  constructor(user) {
    this.user = user
    this.docs = {}
  }

  sync(userDb: any) {
    this.init = getRootFolder().then(({folder, children}) => {
      console.log('folders n stuff', folder, children)
      children.forEach(child => {
        this.docs[child.appProperties.nmId] = child
      })
      // TODO: folders n stuff
      // TODO: periodically recheck drive for new files n stuff
      // TODO: go through files I've got and sync them probably
      // TODO: actually sync
      // userDb.changes().on('change', ....
      return folder
    }, err => {
      console.log('failed to sync', err)
      // TODO retries?
      return null
    })
    return this.init
  }

  setupSyncing(id: string): Promise<*> {
    return this.init.then(folder => {
      if (!folder) throw new Error('not working')
      if (this.docs[id]) return console.warn('doc already existed...')

      return getDocFolder(id).then(doc => {
        if (doc) {
          this.docs[id] = doc
          return
        }
        return createDocFolder(folder.id, id).then(doc => {
          this.docs[id] = doc
        })
      })
    })
  }

  uploadDoc(docDb: any, contentsId: string) {
    return pouchDump.toString(docDb).then(contents => {
      return googleUpload.updateFile({
        id: contentsId,
        mimeType: MIME_TYPE,
        contents
      })
    })
  }

  syncDoc(docDb: any, id: string, onStateChange: Function): () => void {
    if (!this.docs[id]) throw new Error('wat')

    const parentId = this.docs[id].id
    const vid = id + ':latestVersion'
    const tid = id + ':lastCheckTime'
    const cid = id + ':pendingChanges'
    let latestVersion = +(localStorage[vid] || 0)
    // TODO work for multiple tabs
    // This is to distinguish between multiple tabs
    let lastCheckTime = +(localStorage[tid] || 0)
    let pendingChanges = !!localStorage[cid]

    return getOldestItem(`'${parentId} in parents and title = 'contents.nm'`)
      .then(doc => {
        // Hmmmmm how do I keep track of the most recently synced version of a
        // thing?
        if (doc) {
          if (doc.version > latestVersion) {
            console.warn("Should update from doc but I'm not")
            // TODO update from doc, then push changes back
            return doc
          } else if (pendingChanges) {
            return this.uploadDoc(docDb, doc.id)
              .then(() => doc)
          }
        } else {
          return pouchDump.toString(docDb).then(contents => {
            return googleUpload.insertFile({
              title: 'contents.nm',
              mimeType: MIME_TYPE,
              parents: [parentId],
              contents
            })
          })
        }
      }).then(doc => {
        docDb.changes({
          include_docs: true,
          live: true,
          since: 'now',
        })
        .on('change', () => {
          if (!lastCheckTime || lastCheckTime < Date.now() - TEN_MINUTES) {
            lastCheckTime = Date.now()
            localStorage[tid] = lastCheckTime
            setTimeout(() => {
              this.uploadDoc(docDb, doc.id)
            }, FIVE_MINUTES)
          }
          pendingChanges = true
          localStorage[cid] = true
        })
        .on('error', err => {
          console.log('error syncing', err)
        })
      })

    // TODO dump doc contents
    // TODO fetch doc contents
    // TODO do the sync n stuff
    getDocFolder(id).then(doc => {
      if (doc) {
        console.log('done w/ that', doc)
      }
    }, err => {
      // Umm try again later?
      console.warn(`failed to get doc for ${id}`, err)
    })
  }

  logout() {
    this.db.logout()
    clearUser()
  }
}

