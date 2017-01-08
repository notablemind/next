
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

export default ({store, node, renderMarkdown, contentTextStyle, contentStyle}) => (
  <View style={contentStyle}>
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
      {renderMarkdown(node.content, contentTextStyle)}
    </View>
  </View>
)

