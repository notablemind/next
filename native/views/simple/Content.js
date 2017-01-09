
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
  TouchableWithoutFeedback,
  Image,
  TextInput,
} from 'react-native';

import render from '../body/render'

export default class Content extends Component {
  constructor({store, node}) {
    super()
    this.state = {
      text: node.content,
      editHeight: 35,
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.editState && !this.props.editState) {
      this.setState({text: nextProps.node.content})
    }
  }

  reset = () => {
    this.props.store.actions.normalMode()
  }

  onSubmit = evt => {
    evt.preventDefault()
    this.props.store.actions.setContent(this.props.node._id, this.state.text)
    this.props.store.actions.normalMode()
  }

  render() {
    if (this.props.editState) {
      return <TextInput
        value={this.state.text}
        onChangeText={text => this.setState({text})}
        style={[styles.input, {
          height: Math.max(35, this.state.editHeight + 10)
        }]}
        onContentSizeChange={evt => this.setState({editHeight: evt.nativeEvent.contentSize.height})}
        onKeyPress={evt => evt.nativeEvent.key === 'Enter' ? this.onSubmit(evt) : null}
        onBlur={this.reset}
        autoFocus
        multiline
      />
    }
    const content = render(this.props.node.content, styles.contentText)
    return <View style={styles.content}>
        {content}
      </View>
  }
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },

  awesome: {
    backgroundColor: 'red',
  },

  contentText: {
    fontSize: 20, fontWeight: '200', lineHeight: 30,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },

  input: {
    flex: 1,
    alignSelf: 'stretch',
    fontSize: 20,
    fontWeight: '200',
    lineHeight: 30,
    paddingHorizontal: 10,
    paddingVertical: 5,
    // margin: 9,
  },
})

