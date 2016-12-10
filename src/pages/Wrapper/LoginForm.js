// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

export default class LoginForm extends Component {
  state: {
    signup: bool,
    name: string,
    email: string,
    pwd: string,
  }

  constructor() {
    super()
    this.state = {
      signup: false,
      name: '',
      email: '',
      pwd: '',
    }
  }

  onLogin = () => {
    this.props.onLogin(this.state.email, this.state.pwd)
    this.setState({
      name: '',
      email: '',
      pwd: '',
    })
  }

  onSignUp = () => {
    this.props.onSignUp(this.state.name, this.state.email, this.state.pwd)
    this.setState({
      name: '',
      email: '',
      pwd: '',
    })
  }

  render() {
    return <div className={css(styles.container)}>
      {this.state.signup && <input
          value={this.state.name}
          placeholder="Name"
          className={css(styles.input)}
          onChange={e => this.setState({name: e.target.value})}
        />}
      <input
        value={this.state.email}
        placeholder="Email"
        className={css(styles.input)}
        onChange={e => this.setState({email: e.target.value})}
      />
      <input
        value={this.state.pwd}
        placeholder="Password"
        type="password"
        className={css(styles.input)}
        onChange={e => this.setState({pwd: e.target.value})}
      />
      <button
        onClick={this.state.signup ? this.onSignUp : this.onLogin}
      >
        {this.state.signup ? 'Sign up' : 'Login'}
      </button>
      {this.props.loginError ?
        <div>{this.props.loginError}</div> :
          null}
      <button
        onClick={() => this.setState({signup: !this.state.signup})}
        className={css(styles.linkButton)}
      >
        switch to {this.state.signup ? 'login' : 'sign up'}
      </button>
    </div>
  }
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 10,
    border: 'none',
    padding: '3px 5px',
    fontSize: '1.2em',
    width: 300,
  },

  linkButton: {
    color: 'blue',
    border: 'none',
    backgroundColor: 'white',
  },
})
