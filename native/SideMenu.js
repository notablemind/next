
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  TouchableOpacity,
} from 'react-native';


// TODO subscribe to store if present, so undo & redo work
const SideMenu = ({docId, user, toggleSlideMenu, onCloseDoc, store}) => {
  const items = [
    docId && {text: 'Close doc', action: onCloseDoc},
    docId && {children: [{text: 'Undo', action: store && store.undo}, {text: 'Redo', action: store && store.redo}]},
    {text: 'Quick Add', action: null},
    {text: 'Settings', action: null},
    user ? {text: 'Logout'} : {text: 'Login'},
  ]

  return <View style={styles.container}>
    {items.map((item, i) => (
      item ?
        (item.children ?
          <View key={i} style={styles.buttonRow}>
            {item.children.map((child, i) => <Button fill key={i} action={
              child.action ?
                (() => (toggleSlideMenu(), child.action())) : null
            }>{child.text}</Button>)}
          </View> :
          <Button key={i} action={
            item.action ?
              (() => (toggleSlideMenu(), item.action())) : null
          }>{item.text}</Button>)
        : null
    ))}
  </View>
}

export default SideMenu

const Button = ({children, style, action, fill}) => (
  <TouchableOpacity onPress={action} style={[styles.button, style, !action && styles.disabled, fill && styles.fill]}>
    <Text style={!action && styles.disabledText}>
      {children}
    </Text>
  </TouchableOpacity>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 20,
    borderRightWidth: 0.5,
    borderColor: '#ccc',
    // shadowColor: '#666',
    // shadowOpacity: 1,
    // shadowRadius: 5,
  },

  buttonRow: {
    flexDirection: 'row',
  },

  fill: {
    flex: 1,
  },

  disabled: {
    backgroundColor: '#fafafa',
  },

  disabledText: {
    color: '#777',
  },

  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: .5,
    borderColor: '#ccc',
  },

})
