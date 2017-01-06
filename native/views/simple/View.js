
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

import render from '../body/render'

class Item extends Component {
  constructor({store, id}) {
    super()
    this._sub = store.setupStateListener(
      this,
      store => [
        store.events.root(),
        store.events.node(id),
        store.events.nodeView(id),
      ],
      store => ({
        node: store.getters.node(id),
        isRoot: store.getters.root() === id,
      }),
    )
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  onRebase = () => {
    this.props.store.actions.rebase(this.props.id)
  }

  render() {
    return <View style={styles.top}>
      {this.state.node.children.length > 0 &&
        <TouchableOpacity
          onPress={this.onRebase}
          style={styles.rebaser}
        />}
      <View style={styles.content}>
        {render(this.state.node.content, {fontSize: 20, fontWeight: '200', lineHeight: 30})}
      </View>
    </View>
  }
}

class RootItem extends Component {
  constructor({store, id}) {
    super()
    this._sub = store.setupStateListener(
      this,
      store => [
        store.events.root(),
        store.events.node(id),
        store.events.nodeView(id),
      ],
      store => ({
        node: store.getters.node(id),
        isRoot: store.getters.root() === id,
      }),
    )
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  render() {
    return <ScrollView>
    {/*<View style={styles.rootContent}>
        {render(this.state.node.content, {fontSize: 24, fontWeight: '200'})}
      </View>*/}
      {this.state.node.children.map(child => (
        <Item id={child} store={this.props.store} key={child} />
      ))}
    </ScrollView>
  }
}

export default class MainView extends Component {
  constructor({store}) {
    super()
    this._sub = store.setupStateListener(
      this,
      store => [
        store.events.root(),
        store.events.mode(),
      ],
      store => ({
        root: store.getters.root(),
        mode: store.getters.mode(),
      }),
    )
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  render() {
    return <RootItem
      key={this.state.root}
      id={this.state.root}
      store={this.props.store}
    />
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  top: {
    flexDirection: 'row',
    // alignItems: 'center',
    alignSelf: 'stretch',
    borderBottomWidth: .5,
    borderColor: '#ccd',
  },

  rootContent: {
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 20,
    // backgroundColor: '#def',
    borderBottomWidth: .5,
    borderColor: '#556',
  },

  rebaser: {
    width: 20,
    height: 20,
    backgroundColor: '#aaa',
    borderRadius: 10,
    marginLeft: 10,
    marginTop: 10,
  },

  content: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
})

