
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

const makePages = (store, node, reset) => ({
  Add: [
    {text: 'Before', action: () => store.actions.createBefore(node._id)},
    {text: 'After', action: () => store.actions.createAfter(node._id)},
    {text: 'Child', action: () => {
      store.actions.createLastChild(node._id)
      store.actions.rebase(node._id)
    }},
    {text: 'Back', action: reset},
  ],
  Type: Object.keys(store.plugins.nodeTypes).map(nodeType => ({
    text: store.plugins.nodeTypes[nodeType].title || nodeType,
  })),
  Delete: [
    {text: 'Really delete', action: () => store.actions.remove(node._id)},
    {text: 'Just kidding', action: reset},
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
          <Button action={item.action && (() => (this.reset(), item.action()))} key={i}>
            {item.text}
          </Button>
        ))}
      </View>
    } else {
      return <View style={styles.container}>
        {Object.keys(this.state.pages).map(key => (
          <Button action={() => this.setState({page: key})} key={key}>
            {key}
          </Button>
        ))}
      </View>
    }
  }
}

const Button = ({children, action}) => (
  <TouchableOpacity style={styles.button} onPress={action}>
    <Text style={styles.buttonText}>{children}</Text>
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
    paddingHorizontal: 20,
    justifyContent: 'center',
  },

  buttonText: {
    color: '#555',
  },
})
