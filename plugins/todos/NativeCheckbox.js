
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

import Icon from '../../native/node_modules/react-native-vector-icons/Ionicons'

export default class CheckBox extends Component {
  render() {
    const {checked} = this.props
    return <TouchableOpacity
      onPress={this.props.onChange}
      style={[styles.container, this.props.style, {
      }]}
    >
      <Icon
        name={checked ?  'ios-checkmark-circle' : 'ios-radio-button-off'}
        color='orange'
        size={25}
      />
    </TouchableOpacity>
  }
}

const styles = StyleSheet.create({
  container: {
  },
})

