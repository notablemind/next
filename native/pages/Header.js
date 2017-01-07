
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  TouchableOpacity,
} from 'react-native';

import render from '../views/body/render'

import Icon from 'react-native-vector-icons/EvilIcons'

export default class Header extends Component {
  constructor({store}) {
    super()
    this._sub = store.setupStateListener(
      this,
      store => [
        store.events.root(),
        store.events.node(store.getters.root()),
        store.events.nodeView(store.getters.root()),
      ],
      store => ({
        root: store.getters.root(),
        node: store.getters.node(store.getters.root()),
      }),
      store => store.getters.root() !== this.state.root,
    )
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  rebaseUp = () => {
    this.props.store.actions.rebase(this.state.node.parent)
  }

  render() {
    const syncState = {
      unstarted: 'Not yet synced',
      error: 'Unable to sync',
      syncing: 'Syncing',
      done: 'Synced',
    }[this.props.syncState]

    return <View style={styles.container}>
      {this.state.root !== 'root' ?
        <Icon
          name="chevron-left"
          size={20}
          onPress={this.rebaseUp}
          style={styles.rebaseUp}
        /> : <View style={{width: 10}} />
      }
      <View style={styles.title}>
        {render(this.state.node.content, styles.titleText)}
      </View>
      <Text style={styles.syncState}>
        {syncState}
      </Text>
      <TouchableOpacity
        onPress={this.props.onClose}
      >
        <Text style={styles.closeText}>
          Close
        </Text>
      </TouchableOpacity>
    </View>
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'cyan',
  },

  titleText: {
    fontWeight: '200',
  },

  title: {
    flex: 1,
    // paddingTop: 5,
    // padding: 10,
  },

  rebaseUp: {
    padding: 10,
    // alignSelf: 'stretch',
    alignItems: 'center',
  },

  syncState: {
    fontSize: 10,
  },

  closeText: {
    padding: 10,
  },
})
