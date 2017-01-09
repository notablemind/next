
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  Linking,
  ScrollView,
  TouchableHighlight,
  Image,
} from 'react-native';

import render from '../body/render'

import Icon from 'react-native-vector-icons/EvilIcons'
import CheckBox from './CheckBox'
import Slider from './Slider'
import ActionBar from './ActionBar'
import Content from './Content'


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
        editState: store.getters.editState(id),
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

  body() {
    const nodeType = this.state.node.type
    let nodeTypeDef = this.props.store.plugins.nodeTypes[nodeType]
    const CustomRender = nodeTypeDef && nodeTypeDef.render
    if (CustomRender) {
      return <CustomRender
        editState={this.state.editState}
        node={this.state.node}
        store={this.props.store}
        onPress={this.state.node.children.length && this.onRebase}
        Content={Content}
      />
    }
    return <Content
      node={this.state.node}
      store={this.props.store}
      editState={this.state.editState}
      onPress={this.state.node.children.length && this.onRebase}
    />
  }

  render() {
    const contents = (this.state.node.children.length && !this.state.editState) ?
      <TouchableHighlight
        onPress={this.onRebase}
        underlayColor="#ddd"
      >
        <View style={styles.top}>
        {this.body()}
        <Icon
          name="chevron-right"
          size={20}
          style={styles.rebaser}
        />
        </View>
      </TouchableHighlight>
      :
      <View style={styles.top}>
        {this.body()}
      </View>
      // return contents
    return <Slider
      main={contents}
      style={styles.container}
      canSlide={!this.state.editState}
      backdrop={<ActionBar
        store={this.props.store}
        node={this.state.node}
      />}
    />
  }
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    // alignItems: 'center',
    // alignSelf: 'stretch',
    backgroundColor: 'white',
  },

  container: {
    borderBottomWidth: .5,
    borderColor: '#ccd',
    alignSelf: 'stretch',
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
})


