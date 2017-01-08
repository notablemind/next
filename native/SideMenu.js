
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  TouchableOpacity,
} from 'react-native';

const SideMenu = ({docId, user, toggleSlideMenu, onCloseDoc}) => {
  return <View style={styles.container}>
    {docId &&
    <Button
      action={() => (toggleSlideMenu(), onCloseDoc())}
    >
      Close doc
    </Button>}

    {docId &&
    <View style={{flexDirection: 'row'}}>
      <Button
        action={onCloseDoc}
        style={{flex: 1}}
      >
        Undo
      </Button>
      <Button
        action={onCloseDoc}
        style={{flex: 1}}
      >
        Redo
      </Button>
    </View>}

    <Button
    >
      Quick Add
    </Button>
    <Button
    >
      Settings
    </Button>

    <View style={{flex: 1}} />

    {user ?
    <Button
      action={onCloseDoc}
    >
      Logout
    </Button> :
    <Button
      action={onCloseDoc}
    >
      Login
    </Button>
    }


  </View>
}

export default SideMenu

const Button = ({children, style, action}) => (
  <TouchableOpacity onPress={action} style={[styles.button, style]}>
    <Text>
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

  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: .5,
    borderColor: '#ccc',
  },

})
