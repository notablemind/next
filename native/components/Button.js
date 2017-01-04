
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';

export default ({children, action}) => (
  <TouchableOpacity
    onPress={action}
    style={styles.container}
  >
    {typeof children === 'string' ?
      <Text style={styles.text}>{children}</Text> :
      children}
  </TouchableOpacity>
)

const styles = StyleSheet.create({
  text: {

  },

  container: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    alignItems: 'center',
    backgroundColor: 'cyan',
  },
})
