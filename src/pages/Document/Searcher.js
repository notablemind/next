// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

const debounce = (fn, wait) => {
  let last = Date.now()
  let _wait = null
  return (...args) => {
    clearTimeout(_wait)
    if (Date.now() - last < wait) {
      _wait = setTimeout(() => {
        fn(...args)
      }, wait)
      return
    }
    fn(...args)
  }
}

export default class Searcher extends Component {
  constructor() {
    super()
    this.state = {
      results: [],
      selected: 0,
      /* TODO maybe
      results: {
        local: [],
        deep: [],
        global: [],
      },
      */
      text: '',
    }
  }

  bouncyUpdate = debounce(() => {
    const newSearched = this.state.text.trim().toLowerCase()
    if (newSearched === this._lastSearched) return
    this._lastSearched = newSearched
    // TODO maybe have incremental searching? or something. probs not though
    const results = this.props.treed.searchFromCurrentView(newSearched)
    this.setState({
      results,
      selected: 0,
    })
  }, 100)

  componentDidMount() {
    this.bouncyUpdate()
  }

  onChange = (e: any) => {
    this.setState({
      text: e.target.value,
    }, () => this.bouncyUpdate())
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.results !== this.state.results) {
      this._results.scrollTop = this._results.scrollHeight
    }
  }

  onKeyDown = e => {
    e.stopPropagation()
    if (e.keyCode === 27) {
      return this.props.onClose()
    }
  }

  renderResult(i) {
    const result = this.state.results[i]
    return <div
      key={i}
      className={css(styles.result)}
    >
      {result.content}
    </div>
  }

  render() {
    // TODO indicate the node type? yeah.
    const items = []
    const numResults = this.state.results.length
    for (let i=0; i<numResults; i++) {
      items.push(this.renderResult(numResults - i - 1))
    }
    return <div className={css(styles.container)}>
      <div ref={n => this._results = n} className={css(styles.results)}>
        {items}
      </div>

      <input
        className={css(styles.input)}
        value={this.state.text}
        onChange={this.onChange}
        onBlur={this.props.onClose}
        onKeyDown={this.onKeyDown}
        autoFocus
      />
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    bottom: 10,
    left: '50%',
    width: 600,
    marginLeft: -300,
    backgroundColor: 'white',
    zIndex: 100000,
    boxShadow: '0 -2px 5px #aaa',
  },

  results: {
    borderBottom: '1px solid #ccc',
    overflow: 'auto',
    maxHeight: 500,
  },

  result: {
    padding: '5px 10px',
    fontSize: '1.5em',
  },

  input: {
    padding: '3px 5px',
    fontSize: '1.5em',
    border: 'none',
    outline: 'none',
  },
})

