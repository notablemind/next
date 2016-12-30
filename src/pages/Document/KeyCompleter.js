// @-flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

export default class KeyCompleter extends Component {
  constructor(props) {
    super()
    this.state = {
      prefix: '',
      completions: [],
    }
  }

  componentDidMount() {
    const {treed} = this.props
    this._unsub = treed.keyManager.addPrefixListener((prefix, completions) => {
      this.setState({prefix, completions})
    })
  }

  componentWillUnmount() {
    this._unsub()
  }

  render() {
    if (!this.state.prefix) return null
    return <div className={css(styles.container)}>
      Completing keys in the here: {this.state.prefix}
      {this.state.completions.map((n, i) => (
        <div key={i}>
          {n}
        </div>
      ))}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    color: 'white',
    backgroundColor: '#555',
    zIndex: 1000000,
  },
})
