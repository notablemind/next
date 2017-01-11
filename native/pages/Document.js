
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  ActivityIndicator,
} from 'react-native';

import PouchDB from 'pouchdb-react-native'
import Treed from 'treed'
import treedPouch from 'treed/pouch'

import Menu from '../components/Menu'
import SideMenu from '../SideMenu'
import Header from './Header'

import Icon from 'react-native-vector-icons/EvilIcons'

import Button from '../components/Button'


const plugins = [
  require('../../plugins/todos/native').default,
  require('../../plugins/image/native').default,
]

const viewTypes = {
  list: require('../views/list').default,
  simple: require('../views/simple').default,
}

export default class Document extends Component {
  constructor(props) {
    super()
    this.state = {
      db: new PouchDB('doc_' + props.id),
      initialSyncing: !props.synced,
      treed: null,
      store: null,
      viewType: 'simple',
      title: props.initialTitle,
      syncState: 'unstarted',
    }
    window.doc = this
    window.AsyncStorage = AsyncStorage
  }

  componentDidMount() {
    if (!this.props.synced) {
      this.setupSync(() => {
        console.log('moving on')
        this.setState({
          initialSyncing: false,
        })
        this.setupTreed()
      })
    } else {
      this.setupTreed()
      this.setupSync()
    }
  }

  setupTreed() {
    console.log('setting up treed')
    const treed = new Treed(
      treedPouch(this.state.db),
      plugins,
      viewTypes,
      this.props.id,
    )
    window._treed = treed
    this._unsub = treed.on(['node:root'], () => {
      this.onTitleChange(treed.db.data.root.content)
    })
    treed.ready.then(() => {
      const store = treed.registerView('root', this.state.viewType)
      const title = treed.db.data.root.content
      this.setState({
        treed,
        store,
        title,
      })
    })
  }

  setupSync(done) {
    this.setState({syncState: 'syncing'})
    console.log('syncing')
    this.props.makeRemoteDocDb(this.props.id).then(db => {
      console.log('ensured remote db')
      if (this._unmounted) return
      // do a full sync first
      this._sync = this.state.db.sync(db)
        .on('error', e => {
          console.error(e)
          console.warn('bad news initial sync', e)
          if (this._unmounted) return
          this.setState({syncState: 'error'})
        })
        .on('complete', e => {
          if (done) done()
          this.props.setSyncedTime(Date.now())
          console.log('done initial sync')
          if (this._unmounted) return
          this.setState({syncState: 'done'})
          // then start a live sync
          this._sync = this.state.db.sync(db, {live: true, retry: true})
            .on('error', e => {
              if (this._unmounted) return
              console.error(e)
              console.warn('failed while live syncing', e)
              this.setState({syncState: 'error'})
            })
        })
    })
  }

  componentWillUnmount() {
    this._unmounted = true
    this.state.db.close()
    if (this.state.treed) {
      this.state.treed.destroy()
    }
    if (this._unsub) {
      this._unsub()
    }
    if (this._sync) {
      this._sync.cancel()
    }
  }

  onTitleChange = title => {
    this.setState({title})
  }

  menuItems() {
    return [
      {text: 'Close doc', action: this.props.onClose},
      {type: 'spacer'},
      {text: 'Jump to root',
        action: () => this.state.store.actions.rebase('root')},
      {children: [
        {text: 'Undo', action: this.state.store.undo},
        {text: 'Redo', action: this.state.store.redo}
      ]},
      {text: 'Quick add', action: null},
      {type: 'spacer'},
    ].concat(Object.keys(viewTypes).map(type => (
      {
        text: viewTypes[type].title || type,
        action: type === this.state.viewType ?
          null : () => this.setState({viewType: type})
      }
    )))
  }

  render() {
    if (this.state.initialSyncing) {
      return <View style={styles.container}>
       <Button action={this.props.onClose}>
        Back
       </Button>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            animating={true}
            size="large"
            style={{
              marginBottom: 30,
            }}
          />
          <Text>Initial sync...</Text>
        </View>
      </View>
    }

    if (!this.state.treed) {
      return <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    }

    const Component = viewTypes[this.state.viewType].Component
    const main =  <View style={styles.container}>
      <Header
        title={this.state.title}
        onClose={this.props.onClose}
        onOpenMenu={this.menu.toggleSlideMenu}
        syncState={this.state.syncState}
        store={this.state.store}
        // TODO show whole ancestry of current node
      />
      <Component
        store={this.state.store}
      />
    </View>

    return <Menu
      ref={menu => this.menu = menu}
      width={200}
      slideWay="left"
      menu={<SideMenu
        items={this.menuItems()}
      />}
      frontView={main}
    />
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    // padding: 20,
  },

  loadingContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
  },
})

