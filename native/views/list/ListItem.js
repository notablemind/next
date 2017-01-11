
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  TouchableHighlight,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons'

import render from '../body/render'


export default class ListItem extends Component {
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
    return <View style={styles.container}>
      <TouchableHighlight
        onPress={() => this.props.store.actions.rebase(this.props.id)}
      >
        <View style={styles.top}>
          {render(this.state.node.content) || <Text>empty</Text>}
          {this.props.depth >= 3 && this.state.node.children.length > 0 && <Icon
            name="ios-arrow-forward"
            style={styles.icon}
          />}
        </View>
      </TouchableHighlight>
      {this.props.depth < 3 &&
        <View style={styles.children}>
        {this.state.node.children.map(child => (
          <ListItem
            key={child}
            id={child}
            store={this.props.store}
            depth={this.props.depth + 1}
          />
        ))}
        </View>}
    </View>
  }
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
  },

  icon: {
    marginLeft: 10,
    marginRight: 10,
  },

  top: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  children: {
    paddingLeft: 5,
    borderLeftWidth: 1,
    borderColor: '#ccc',
    marginLeft: 10,
  },
})



