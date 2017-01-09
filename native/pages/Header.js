
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  TouchableOpacity,
  ActivityIndicator,
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

    const title = render(this.state.node.content, styles.titleText, true)

    return <View style={styles.container}>
      {this.state.root !== 'root' ?
        <TouchableOpacity
          onPress={this.rebaseUp}
          // style={{flex: 1}}
            style={styles.rebaseUpButton}
        >
          <Icon
            name="chevron-left"
            size={20}
            style={styles.rebaseUp}
          />
          <View style={styles.title}>
            {title}
          </View>
        </TouchableOpacity>
          :
        <View style={styles.top}>
          <Icon
            name="navicon"
            size={20}
            style={styles.menuButton}
            onPress={this.props.onOpenMenu}
          />
          <View style={styles.title}>
            {title}
          </View>
        </View>
        }
      <ActivityIndicator
        animating={this.props.syncState === 'syncing'}
        size="small"
        style={{
          marginRight: 10,
        }}
      />
      <Text style={styles.syncState}>
        {syncState}
      </Text>
    </View>
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'cyan',
  },

  rebaseUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  titleText: {
    fontWeight: '200',
    fontSize: 20,
  },

  top: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    flexDirection: 'row',
    flex: 1,
    paddingVertical: 10,
    // paddingTop: 5,
    // padding: 10,
  },

  rebaseUp: {
    padding: 10,
    // alignSelf: 'stretch',
    alignItems: 'center',
  },

  menuButton: {
    padding: 10,
    // alignSelf: 'stretch',
    alignItems: 'center',
  },

  syncState: {
    fontSize: 10,
    marginRight: 15,
    // color: '#555',
    fontWeight: '200',
  },

  closeText: {
    padding: 10,
  },
})
