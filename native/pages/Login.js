
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TextInput,
} from 'react-native';

import Button from '../components/Button'

export default class Login extends Component {
  constructor() {
    super()
    this.state = {
      email: '',
      pwd: '',
      error: null,
      loading: false,
    }
  }

  canSubmit = () => {
    return this.state.email && this.state.pwd && !this.state.loading
  }

  onLogin = () => {
    if (this.state.loading) return
    this.setState({loading: true})
    this.props.onLogin(this.state.email, this.state.pwd, (err) => {
      if (err) {
        return this.setState({error: err, loading: false})
      }
    })
  }

  render() {
    return <View style={styles.container}>
      <Text style={styles.title}>Login!</Text>
      <TextInput
        value={this.state.email}
        onChangeText={email => this.setState({email})}
        style={styles.input}
        keyboardType="email-address"
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus
      />
      <TextInput
        value={this.state.pwd}
        onChangeText={pwd => this.setState({pwd})}
        style={styles.input}
        secureTextEntry
        autoCorrect={false}
        autoCapitalize="none"
      />
      {this.state.error &&
        <Text style={styles.error}>{this.state.error}</Text>}
      <Button
        action={this.onLogin}
        disabled={!this.canSubmit()}
      >
        {this.state.loading ? 'Logging in...' : 'Login'}
      </Button>
    </View>
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    padding: 20,
    paddingTop: 40,
  },

  title: {
    alignSelf: 'center',
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  error: {
    color: 'red',
    marginVertical: 10,
  },

  input: {
    alignSelf: 'stretch',
    borderWidth: 1,
    // width: 100,
    height: 50,
    marginBottom: 10,
    paddingLeft: 15,
  },
})
