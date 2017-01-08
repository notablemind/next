
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
    }
  }

  onSave = () => {
    if (!this.state.text) return this.setState({adding: false})
    this.props.store.actions.createLastChild(this.props.parent, this.state.text)
    this.setState({text: '', adding: false})
  }

  render() {
    return <View style={styles.container}>
    {this.state.adding ? <TextInput
        autoFocus
        style={styles.input}
        onSubmitEditing={this.onSave}
        onBlur={() => this.setState({adding: false})}
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
      {this.state.adding &&
        <TouchableOpacity
          onPress={() => this.setState({adding: false})}
          style={styles.cancel}
        >
          <Text style={styles.cancelText}>cancel</Text>
        </TouchableOpacity>}
    </View>
  }
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: .5,
    borderColor: '#ddd',
  },

  cancel: {
    position: 'absolute',
    right: 20,
    top: 20,
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
  },

  input: {
    fontWeight: '100',
    fontSize: 20,
    lineHeight: 30,
    height: 30,
  },
})