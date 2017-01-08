
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

import CheckBox from './NativeCheckbox'

const toggleChecked = (store, node) => {
  console.log('umm check mate')
  const checked = node.types.todo && node.types.todo.done
  store.actions.setNested(
    node._id,
    ['types', 'todo', 'done'],
    !checked
  )
}

export default ({store, node, editState, Content}) => (
  <View style={{flex: 1, flexDirection: 'row'}}>
    <CheckBox
      checked={node.types.todo && node.types.todo.done}
      onChange={() => toggleChecked(store, node)}
      style={{
        padding: 10,
        alignSelf: 'stretch',
        justifyContent: 'center',
      }}
    />
    <View style={{flex: 1}}>
      <Content node={node} store={store} editState={editState} />
    </View>
  </View>
)

