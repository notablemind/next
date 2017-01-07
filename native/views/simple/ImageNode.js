
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


export default class ImageNode extends Component {
  constructor() {
    super()
    this.state = {uri: null, loading: true, error: null}
  }

  componentDidMount() {
    this.load()
  }

  load() {
    const {node, store} = this.props
    if (!node.types.image || !node.types.image.attachmentId) {
      return this.setState({loading: false})
    }
    store.db.db.getBase64Attachment(node._id, node.types.image.attachmentId).then(
      base64text => {
        // const url = URL.createObjectURL(blob)
        // urlCache[key] = url
        // this.setState({src: url})
        this.setState({
          uri: 'data:image/png;base64,' + base64text,
          loading: false,
        })
      },
      error => this.setState({error, loading: false,}),
    )
  }

  render() {
    if (this.state.loading) return <Text>Loading...</Text>
    if (!this.state.uri) return <Text>No image</Text>
    if (this.state.error) return <Text>Failed to load image</Text>

    return <View style={styles.imageContainer}>
      <Image
        resizeMode="contain"
        source={{uri: this.state.uri}}
        style={styles.image}
      />
      <View style={styles.imageCaption}>
        {this.props.node.content ?
          render(this.props.node.content, styles.captionText) :
          <Text>empty</Text>}
      </View>
    </View>
  }
}

const styles = StyleSheet.create({
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
})


