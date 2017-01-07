
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

import render from '../body/render'

import Icon from 'react-native-vector-icons/EvilIcons'
import ImageNode from './ImageNode'
import CheckBox from './CheckBox'


export default class Item extends Component {
  constructor({store, id}) {
    super()
    this._sub = store.setupStateListener(
      this,
      store => [
        store.events.root(),
        store.events.node(id),
        store.events.nodeView(id),
      ],
      store => ({
        node: store.getters.node(id),
        isRoot: store.getters.root() === id,
      }),
    )
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  onRebase = () => {
    this.props.store.actions.rebase(this.props.id)
  }

  onCheck = () => {
    console.log('umm check mate')
    const checked = this.state.node.types.todo && this.state.node.types.todo.done
    this.props.store.actions.setNested(
      this.props.id,
      ['types', 'todo', 'done'],
      !checked
    )
  }

  body() {
    if (this.state.node.type === 'image') {
      return <ImageNode node={this.state.node} store={this.props.store} />
    }
    const contents = render(this.state.node.content, styles.contentText)
    return <View style={styles.content}>
      {this.state.node.type === 'todo' &&
        <CheckBox
          checked={this.state.node.types.todo && this.state.node.types.todo.done}
          onChange={this.onCheck}
          style={{marginRight: 10}}
        />}
      {this.state.node.children.length > 0 ?
        <TouchableOpacity
          onPress={this.onRebase}
          style={{flex: 1}}
        >
          {contents}
        </TouchableOpacity> : contents}
    </View>
  }

  render() {
    return <View style={styles.top}>
      {this.body()}
      {this.state.node.children.length > 0 &&
        <Icon
          name="chevron-right"
          size={20}
          onPress={this.onRebase}
          style={styles.rebaser}
        />
      }
    </View>
  }
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    // alignItems: 'center',
    alignSelf: 'stretch',
    borderBottomWidth: .5,
    borderColor: '#ccd',
  },

  image: {
    height: 100,
    shadowOffset: {width: 0, height: 0},
    shadowColor: '#ccc',
    shadowRadius: 5,
    shadowOpacity: 1,
    marginBottom: 5,
    marginTop: 10,
    // flex: 1,
    // alignSelf: 'center',
    // width: 100
  },

  imageContainer: {
    // alignItems: 'center',
    flex: 1,
  },

  imageCaption: {
    alignSelf: 'center',
    paddingBottom: 5,
  },

  captionText: {
    fontSize: 16,
    fontWeight: '100',
    lineHeight: 20
  },

  rebaser: {
    // width: 20,
    // height: 20,
    // backgroundColor: '#aaa',
    // borderRadius: 10,
    marginRight: 5,
    marginTop: 12,
  },

  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },

  contentText: {
    fontSize: 20, fontWeight: '200', lineHeight: 30,
  },
})


