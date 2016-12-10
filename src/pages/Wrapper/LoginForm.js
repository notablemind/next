// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

export default class LoginForm extends Component {
  state: {
    email: string,
    pwd: string,
  }
  constructor() {
    super()
    this.state = {
      email: '',
      pwd: '',
    }
  }

  onLogin = () => {
    this.props.onLogout(this.state.email, this.state.pwd)
    this.setState({
      email: '',
      pwd: '',
    })
  }

  render() {
    return <div className={css(styles.container)}>
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
        onClick={() => this.props.onLogin(this.state.email, this.state.pwd)}
      >
        Login
      </button>
      {this.props.loginError ?
        <div>{this.props.loginError}</div> :
          null}
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
})
