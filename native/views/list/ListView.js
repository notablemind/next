
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  ScrollView,
} from 'react-native';

import ListItem from './ListItem'

export default class ListView extends Component {
  constructor(props) {
    super()
    this._sub = props.store.setupStateListener(
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
    return <ScrollView style={styles.container}>
      <ListItem
        store={this.props.store}
        id={this.state.root}
        key={this.state.root}
        depth={0}
      />
    </ScrollView>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})


