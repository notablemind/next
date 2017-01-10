
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
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/EvilIcons'


export default class AddItem extends Component {
  constructor() {
    super()
    this.state = {
      text: '',
      adding: false,
      editHeight: 30,
    }
  }

  onSave = (evt) => {
    evt.stopPropagation()
    evt.preventDefault()
    if (!this.state.text) return this.setState({text: '', adding: false})
    this.props.store.actions.createLastChild(this.props.parent, this.state.text)
    this.props.store.actions.normalMode()
    this.setState({text: '', adding: true})
  }

  onBlur = () => {
    this.setState({text: ''})
  }

  render() {
    return <View style={styles.container}>
    {this.state.adding ? <TextInput
        autoFocus
        multiline
        style={[styles.input, {
          height: Math.max(35, this.state.editHeight)
        }]}
        onContentSizeChange={evt => {
          this.setState({editHeight: evt.nativeEvent.contentSize.height})
          this.props.rescroll(evt.target)
        }}
        onKeyPress={evt => evt.nativeEvent.key === 'Enter' ? this.onSave(evt) : null}
        onBlur={this.onBlur}
        value={this.state.text}
        onChangeText={text => this.setState({text})}
      /> :
      <TouchableOpacity
        onPress={() => this.setState({adding: true})}
      >
        <Text style={styles.placeholder}>
          Add an item
        </Text>
      </TouchableOpacity>}
      {/*this.state.adding &&
        <TouchableOpacity
          onPress={() => this.setState({adding: false, text: ''})}
          style={styles.cancel}
        >
          <Text style={styles.cancelText}>cancel</Text>
        </TouchableOpacity>*/}
    </View>
  }
}

const styles = StyleSheet.create({
  container: {
    // paddingVertical: 15,
    // paddingHorizontal: 10,
    borderBottomWidth: .5,
    borderColor: '#ddd',
  },

  cancel: {
    position: 'absolute',
    right: 5,
    top: 5,
    backgroundColor: '#ccc',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 5,
  },

  cancelText: {
    color: 'white',
  },

  placeholder: {
    fontWeight: '200',
    fontSize: 20,
    lineHeight: 30,
    textAlign: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },

  input: {
    fontWeight: '200',
    fontSize: 20,
    lineHeight: 30,
    paddingVertical: 5,
    paddingHorizontal: 10,
    // height: 30,
  },
})
