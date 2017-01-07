
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
  Image,
} from 'react-native';


export default class CheckBox extends Component {
  render() {
    return <TouchableOpacity
      onPress={this.props.onChange}
      style={[styles.container, this.props.style]}
    >
      {this.props.checked &&
        <View style={styles.inner} />}
    </TouchableOpacity>
  }
}

const styles = StyleSheet.create({
  container: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: .5,
    borderColor: '#aaa',
  },

  inner: {
    flex: 1,
    margin: 2,
    borderRadius: 10,
    backgroundColor: '#555',
  },
})
