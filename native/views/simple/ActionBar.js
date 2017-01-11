
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

import Icon from 'react-native-vector-icons/Ionicons'

const typeIcons = {
  todo: 'ios-checkmark-circle',
  image: 'ios-image',
}

const typeTitles = {
  todoSummary: '0/10',
  normal: 'T',
}

const makePages = (store, node) => ({
  'ios-create': () => store.actions.edit(node._id),
  'ios-add': [
    {icon: 'ios-arrow-up', action: () => {
      store.actions.createBefore(node._id)
    }},
    {icon: 'ios-arrow-down', action: () => {
      store.actions.createAfter(node._id)
    }},
    {icon: 'ios-arrow-forward', action: () => {
      store.actions.createLastChild(node._id)
      store.actions.rebase(node._id)
    }},
    {icon: 'ios-undo-outline', action: 'reset'},
  ],
  'ios-settings': Object.keys(store.plugins.nodeTypes).map(nodeType => ({
    icon: typeIcons[nodeType],
    text: typeTitles[nodeType] || store.plugins.nodeTypes[nodeType].title || nodeType,
    action: nodeType !== node.type ? (() => store.actions.setNodeType(node._id, nodeType)) : null,
  })).concat([
    {icon: 'ios-undo-outline', action: 'reset'},
  ]),
  'ios-trash-outline': [
    {icon: 'ios-trash', color: 'red', action: () => store.actions.remove(node._id)},
    {icon: 'ios-undo-outline', action: 'reset'},
  ],
  'ios-more': () => {
    // store.actions.showMobileContextMenu()
    console.warn('no implemented')
  },
})

export default class ActionBar extends Component {
  constructor(props) {
    super()
    this.state = {
      pages: makePages(props.store, props.node, () => this.setState({page: null})),
      page: null,
    }
  }

  reset() {
    this.props.slideClosed()
    this.setState({page: null})
  }

  pickPage(page) {
    if (typeof this.state.pages[page] === 'function') {
      this.props.slideClosed()
      this.state.pages[page]()
    } else {
      this.setState({page})
    }
  }

  render() {
    if (this.state.page) {
      return <View style={styles.container}>
        {this.state.pages[this.state.page].map((item, i) => (
          <Button action={
            item.action &&
            (item.action === 'reset' ?
              () => this.setState({page: null}) :
                (() => (this.reset(), item.action())))
          } key={i}>
            {item.icon ?
              <Icon
                name={item.icon}
                color={item.action ? item.color : 'white'}
                size={20}
              />
              : item.text}
          </Button>
        ))}
      </View>
    } else {
      return <View style={styles.container}>
        {Object.keys(this.state.pages).map(key => (
          <Button action={() => this.pickPage(key)} key={key}>
            <Icon
              name={key}
              size={20}
            />
          </Button>
        ))}
      </View>
    }
  }
}

const Button = ({children, action}) => (
  <TouchableOpacity style={styles.button} onPress={action}>
    {typeof children === 'string' ?
      <Text style={[styles.buttonText, !action && styles.disabled]}>{children}</Text> :
      children}
  </TouchableOpacity>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ddd',
    alignItems: 'stretch',
    flexDirection: 'row',
  },

  button: {
    // paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },

  disabledText: {
    color: 'white',
  },

  buttonText: {
    color: '#555',
  },
})
