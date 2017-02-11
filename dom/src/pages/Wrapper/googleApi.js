
import {googleClientId} from '../../../../shared/config.json'
import type {User} from './types'
import googleWrapper from './googleWrapper'
import getRootFolder from './googleRootFolder'
import * as pouchDump from './pouchDump'
import * as googleUpload from './googleUpload'

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
  return Promise.resolve(gapi.client.drive.files.list({
    q: query,
    fields: 'files(id, name, appProperties, version, size, trashed)',
  })).then(({result: {files}}) => {
    files = files.filter(file => !file.trashed)
    if (files.length === 1) return files[0]
    files.sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime())
    return files[0]
  })
}

const fetchFileContents = file => {
  return fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
    {headers: {Authorization: `Bearer ${accessToken}`}}
  )
}

const createDocFolder = (root, id): Promise<*> => {
  return gapi.client.drive.files.create({
    name: 'Untitled',
    mimeType: 'application/vnd.google-apps.folder',
    appProperties: {nmId: id},
    parents: [root],
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
    `'${id}' in parents and name = 'contents.nm'`
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
        if (!child.appProperties || !child.appProperties.nmId) return
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
    console.log('uploading', contentsId)
    return pouchDump.toString(docDb).then(contents => {
      return googleUpload.updateFile({
        id: contentsId,
        mimeType: MIME_TYPE,
        contents
      })
    })
  }

  getDocFolder(id: string): Promise<*> {
    if (this.docs[id]) return Promise.resolve(this.docs[id])
    return getDocFolder(id).then(doc => {
      if (!doc) throw new Error("Doc folder doesn't exist")
      this.docs[id] = doc
      return doc
    })
  }

  syncDoc(docDb: any, id: string, onStateChange: Function): () => void {
    // TODO update the document title
    let changes = null
    const stop = () => {
      console.log('STOPPING')
      if (changes) {
        changes.cancel()
      } else {
        console.log('never really started')
      }
    }
    this.getDocFolder(id).then(parent => {

      const parentId = parent.id
      const vid = id + ':latestVersion'
      const tid = id + ':lastCheckTime'
      const cid = id + ':pendingChanges'
      let latestVersion = +(localStorage[vid] || 0)
      // This is to distinguish between multiple tabs
      let lastCheckTime = +(localStorage[tid] || 0)
      let pendingChanges = !!localStorage[cid]
      console.log('v', 'check', 'pend', latestVersion, lastCheckTime, pendingChanges)

      return getOldestItem(`'${parentId}' in parents and name = 'contents.nm'`)
        .then(doc => {
          // Hmmmmm how do I keep track of the most recently synced version of a
          // thing?
          if (doc) {
            if (+doc.version > latestVersion) {
              console.warn("Should update from doc but I'm not")
              // TODO update from doc, then push changes back
              return doc
            } else if (pendingChanges) {
              console.log('uploading pending changes', pendingChanges)
              return this.uploadDoc(docDb, doc.id)
                .then(() => doc)
            } else {
              return doc
            }
          } else {
            console.log('creating contents doc')
            return pouchDump.toString(docDb).then(contents => {
              return googleUpload.insertFile({
                name: 'contents.nm',
                mimeType: MIME_TYPE,
                parents: [parentId],
                contents
              }).then(doc => {
                return gapi.client.drive.files.get({
                  fileId: doc.id,
                  fields: 'id, name, version, size',
                }).then(res => {
                  if (res.status !== 200) throw new Error('not 200 on get')
                  return res.result
                })
              })
            })
          }
        }).then(doc => {
          console.log('ok version', doc.version, doc)
          latestVersion = doc.version
          localStorage[vid] = latestVersion
          pendingChanges = false
          localStorage.removeItem(cid)
          console.log('listening for changes')
          changes = docDb.changes({
            include_docs: true,
            live: true,
            since: 'now',
          })
          .on('change', () => {
            if (!lastCheckTime || lastCheckTime < Date.now() - TEN_MINUTES) {
              console.log('gonna sync in 5 minutes')
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
    })
    return stop
  }

  logout() {
    this.db.logout()
    clearUser()
  }
}

