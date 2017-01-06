
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
} from 'react-native';

import {baseURL} from '../config'

import PouchDB from 'pouchdb-react-native'
import Treed from 'treed'
import treedPouch from 'treed/pouch'

import Header from './Header'

const plugins = []
const viewTypes = {
  list: require('../views/list').default,
  simple: require('../views/simple').default,
}

export default class Document extends Component {
  constructor(props) {
    super()
    this.state = {
      db: new PouchDB('doc_' + props.id),
      treed: null,
      store: null,
      viewType: 'simple',
      title: 'Notablemind',
      syncState: 'unstarted',
    }
  }

  componentDidMount() {
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
    this.setupSync()
  }

  setupSync() {
    this.setState({syncState: 'syncing'})
    console.log('syncing')
    this.props.makeRemoteDocDb(this.props.id).then(db => {
      console.log('ensured remote db')
      if (this._unmounted) return
      // do a full sync first
      this._sync = this.state.db.sync(db)
        .on('error', e => {
          console.log('bad news initial sync', e)
          if (this._unmounted) return
          this.setState({syncState: 'error'})
        })
        .on('complete', e => {
          console.log('done initial sync')
          if (this._unmounted) return
          this.setState({syncState: 'done'})
          // then start a live sync
          this._sync = this.state.db.sync(db, {live: true, retry: true})
            .on('error', e => {
              if (this._unmounted) return
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

  render() {
    if (!this.state.treed) {
      return <View>
        <Text>Loading...</Text>
      </View>
    }

    const Component = viewTypes[this.state.viewType].Component
    return <View style={styles.container}>
      <Header
        title={this.state.title}
        onClose={this.props.onClose}
        syncState={this.state.syncState}
        store={this.state.store}
        // TODO show whole ancestry of current node
      />
      <Component
        store={this.state.store}
      />
    </View>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    // padding: 20,
  },
})

