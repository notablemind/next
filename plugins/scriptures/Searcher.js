// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

type Props = {
  onResults: () => void,
}

export default class Searcher extends Component {
  state: {
    text: string,
  }

  constructor(props: Props) {
    super()
    this.state = {
      text: '',
    }
  }

  onChange = (e: any) => {
    this.setState({text: e.target.value})
    if (e.target.value.length > 2) {
      this.props.onSearch(e.target.value)
    } else {
      this.props.onResults([])
    }
  }

  render() {
    return <div>
      <input
        className={css(styles.input)}
        value={this.state.text}
        onChange={this.onChange}
        onKeyDown={e => e.stopPropagation()}
      />
    </div>
  }
}

const styles = StyleSheet.create({
  input: {
    padding: '5px 10px',
    fontSize: 16,
  },
})
