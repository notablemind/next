// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Modal from '../../utils/Modal'
import FilesTable from './FilesTable'

type User = 'logged-out' | 'loading' | {
  email: string,
  name: string,
  profile: string,
}

type File = RemoteFile | LocalFile

type RemoteFile = {
  id: string,
  title: string,
  remoteId: string,
  owner: {
    profilePhoto: string,
    name: string,
    email: string,
    me: boolean,
  },
}

type FileMeta = {
  id: string,
  title: string,
  lastOpened: number,
  lastModified: number,
  size: number,
  sync: ?{
    owner: {
      profilePhoto: string,
      name: string,
      email: string,
      me: boolean,
    },
    remoteId: string,
    lastSyncTime: number,
    lastSyncVersion: number,
  },
}

export default class SyncSettings extends Component {
  _unsubs: Array<() => void>
  state: {
    user: ?User,
    remote: ?RemoteFile[],
    meta: {[key: string]: FileMeta},
    loading: boolean,
  }

  constructor({nm}) {
    super()
    this.state = {
      user: nm.user,
      meta: nm.meta,
      remote: [],
      loading: false,
    }
  }

  componentWillMount() {
    if (typeof this.state.user === 'object') {
      this.fetchRemote()
    }
    this._unsubs = [
      this.props.nm.onUser(user => {
        if (typeof user === 'object' && typeof this.state.user === 'string') {
          this.fetchRemote()
        }
        this.setState({user})
      }),
      this.props.nm.onMeta(meta => this.setState({meta})),
    ]
  }

  fetchRemote() {
    this.setState({loading: true})
    this.props.nm.listRemoteFiles()
      .then(remote => this.setState({remote, loading: false}))
      .catch(err => this.setState({loading: false}))
  }

  componentWillUnmount() {
    this._unsubs.forEach(fn => fn())
  }

  renderLoggedOut() {
    return <div className={css(styles.loggedOut)}>
      <button
        onClick={() => this.props.nm.signIn()}
        className={css(styles.loginButton)}
      >
        Login with Google Drive
      </button>
      <div className={css(styles.loginDetails)}>
        Login with Google Drive to sync your documents any computer, device, and the web. You can also share documents and collaborate with other Notablemind users that have signed in with Google Drive.
      </div>
    </div>
  }

  renderLoggedIn(user: User) {
    return <div className={css(styles.loggedIn)}>
      <div className={css(styles.top)}>
        <img src={user.profile} className={css(styles.profile)} />
        <div className={css(styles.username)}>
          {user.name} ({user.email})
        </div>
        <div style={{flex: 1}} />
        <button
          onClick={() => this.props.nm.signOut()}
        >
          Logout
        </button>
        {this.state.loading && 'Loading...'}
      </div>
    </div>
  }

  renderFiles() {
    const {remote, meta} = this.state
    const remoteOnly = remote.filter(file => !this.state.meta[file.appProperties.nmId])
    const remoteById = {}
    remote.forEach(file => remoteById[file.appProperties.nmId] = file)

    return <FilesTable
      localFiles={Object.keys(meta).map(id => meta[id]).filter(m => m.id)}
      remoteById={remoteById}
      remoteOnly={remoteOnly}
      deleteFiles={files => {
        // TODO ????
        return this.props.nm.deleteFiles(files.map(f => f.id))
      }}
      syncFiles={files => {
        return this.props.nm.syncFiles(files.map(f => f.id))
      }}
    />
  }

  renderFiles_() {
    return <FilesTable
      files={files}
      deleteFiles={files => {
        // TODO ????
        return this.props.nm.deleteFiles(files.map(f => f.id))
      }}
      syncFiles={files => {
        return this.props.nm.syncFiles(files.map(f => f.id))
      }}
    />
  }

  render() {
    return <div className={css(styles.container)}>
      {typeof this.state.user === 'object'
        ? this.renderLoggedIn(this.state.user)
        : this.renderLoggedOut()}
      <div style={{flexBasis: 10}}/>
      {this.renderFiles(this.state.files)}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // width: 600,
    // height: 400,
  },

  loggedOut: {
    alignItems: 'center',
    justifyContent: 'center',
    // flex: 1,
  },

  loggedIn: {
    // flex: 1,
  },

  loginButton: {
    padding: '10px 20px',
    border: 'none',
    boxShadow: '0 2px 5px #ccc',
    backgroundColor: 'white',
    fontSize: 20,
    borderRadius: 4,
    marginBottom: 10,
  },

  loginDetails: {
    fontSize: '80%',
    // maxWidth: 300,
  },

  profile: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    marginRight: 10,
  },

  username: {
    fontWeight: 400,
  },

  top: {
    flexDirection: 'row',
    alignItems: 'center',
  },

})

