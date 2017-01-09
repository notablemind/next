
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

import Icon from 'react-native-vector-icons/EvilIcons'

const makePages = (store, node) => ({
  plus: [
    {icon: 'chevron-up', action: () => {
      store.actions.createBefore(node._id)
    }},
    {icon: 'chevron-down', action: () => {
      store.actions.createAfter(node._id)
    }},
    {icon: 'chevron-right', action: () => {
      store.actions.createLastChild(node._id)
      store.actions.rebase(node._id)
    }},
    {icon: 'undo', action: 'reset'},
  ],
  retweet: Object.keys(store.plugins.nodeTypes).map(nodeType => ({
    text: store.plugins.nodeTypes[nodeType].title || nodeType,
    action: nodeType !== node.type ? (() => store.actions.setNodeType(node._id, nodeType)) : null,
  })),
  trash: [
    {text: 'Really delete', action: () => store.actions.remove(node._id)},
    {text: 'Just kidding', action: 'reset'},
  ],
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

  render() {
    if (this.state.page) {
      return <View style={styles.container}>
        {this.state.pages[this.state.page].map((item, i) => (
          <Button action={
            item.action === 'reset' ?
              () => this.setState({page: null}) :
                (() => (this.reset(), item.action()))
          } key={i}>
            {item.icon ?
              <Icon
                name={item.icon}
                size={30}
              />
              : item.text}
          </Button>
        ))}
      </View>
    } else {
      return <View style={styles.container}>
        {Object.keys(this.state.pages).map(key => (
          <Button action={() => this.setState({page: key})} key={key}>
            <Icon
              name={key}
              size={30}
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
      <Text style={styles.buttonText}>{children}</Text> :
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

  buttonText: {
    color: '#555',
  },
})
