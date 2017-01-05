
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  TouchableOpacity,
} from 'react-native';

export default class Header extends Component {
  render() {

    const syncState = {
      unstarted: 'Not yet synced',
      error: 'Unable to sync',
      syncing: 'Syncing',
      done: 'Synced',
    }[this.props.syncState]

    return <View style={styles.container}>
      <Text style={styles.title}>
        {this.props.title}
      </Text>
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
  title: {
    flex: 1,
    padding: 10,
  },

  syncState: {
    fontSize: 10,
  },

  closeText: {
    padding: 10,
  },
})
