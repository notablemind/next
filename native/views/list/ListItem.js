
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
} from 'react-native';

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
      <View style={styles.top}>
        <Text>{this.state.node.content || '<empty>'}</Text>
      </View>
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
  top: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  children: {
    paddingLeft: 10,
  },
})



