
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TextInput,
} from 'react-native';

import Button from '../components/Button'



export default class Browse extends Component {
  constructor() {
    super()
    this.state = {
      files: null,
      existings: {},
      error: null,
    }
  }

  componentDidMount() {
    this.props.userDb.allDocs({include_docs: true}).then(result => {
      const files = result.rows.filter(item => item.type === 'doc')
      this.setState({files})
      /*
      Promise.all(files.map(file => this.props.checkForLocalDb(file._id))).then(results => {
        const existings = {}
        files.forEach((file, i) => existings[file._id] = results[i])
        this.setState({existings})
      })
      */
    }, err => {
      console.log('failed to get')
      this.setState({error: 'Failed to list files'})
    })
  }

  render() {
    if (this.state.error) {
      return <View style={styles.container}>
        <Text>Failed to load files list</Text>
      </View>
    }
    if (!this.state.files) {
      return <View style={styles.container}>
        <Text>Loading files list</Text>
      </View>
    }
    return <View style={styles.container}>
      <Text>NotableMind: Files</Text>
      {this.state.files.map(file => (
        <View style={styles.item}>
          <Text>
            {file.title}
          </Text>
        </View>
      ))}
      <Text>
        Files: {this.state.files.length + ''}
      </Text>
    </View>
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 10,
  },
})
