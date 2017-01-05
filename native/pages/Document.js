
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
  /*{
    actions: {},
    Component: ({something}) => <Text>Hello phriends</Text>,
  },*/
}

export default class Document extends Component {
  constructor(props) {
    super()
    this.state = {
      db: new PouchDB('doc_' + props.id),
      treed: null,
      store: null,
      viewType: 'list',
      title: 'Notablemind',
      syncState: 'unstarted',
    }
  }

  componentDidMount() {
    this.setupSync()
    const treed = new Treed(
      treedPouch(this.state.db),
      plugins,
      viewTypes,
      this.props.id,
    )
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

  setupSync() {
    this.setState({syncState: 'syncing'})
    this.props.makeRemoteDocDb(this.props.id).then(db => {
      // do a full sync first
      this.state.db.sync(db, {retry: true})
        .on('error', e => this.setState({syncState: 'error'}))
        .on('complete', e => {
          this.setState({syncState: 'done'})
          // then start a live sync
          this.state.db.sync(db, {live: true, retry: true})
            .on('error', e => this.setState({syncState: 'error'}))
        })
    })
  }

  componentWillUnmount() {
    this.state.db.close()
    if (this.state.treed) {
      this.state.treed.destroy()
    }
    if (this._unsub) {
      this._unsub()
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
