// @flow

import React, {Component} from 'react';

const debounce = (fn, min) => {
  let wait = null
  return arg => {
    if (wait) clearTimeout(wait)
    wait = setTimeout(() => fn(arg), min)
  }
}

export default class BouncyInput extends Component {
  state: {text: string}
  update: *
  constructor(props: any) {
    super()
    this.state = {
      text: props.value,
    }
    this.update = debounce(props.onChange, 500)
  }

  onChange = (e: *) => {
    this.setState({text: e.target.value})
    this.update(e.target.value)
  }

  render() {
    return <input
      {...this.props}
      value={this.state.text}
      onChange={this.onChange}
      onKeyDown={e => e.stopPropagation()}
    />
  }
}

