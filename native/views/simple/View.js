
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  Linking,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/EvilIcons'

import render from '../body/render'

import Item from './Item'

export default class RootItem extends Component {
  constructor({store, id}) {
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

  render() {
    return <ScrollView style={styles.scroller}
    contentContainerStyle={styles.container}
    >
    {/*<View style={styles.rootContent}>
        {render(this.state.node.content, {fontSize: 24, fontWeight: '200'})}
      </View>*/}
      {this.state.node.children.map(child => (
        <Item id={child} store={this.props.store} key={child} />
      ))}
    </ScrollView>
  }
}

const styles = StyleSheet.create({
  scroller: {
    flex: 1,
  },

  container: {
    alignItems: 'stretch',
  },

  rootContent: {
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 20,
    // backgroundColor: '#def',
    borderBottomWidth: .5,
    borderColor: '#556',
  },
})

