// @-flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

export default class KeyCompleter extends Component {
  _waiting: number
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
      clearTimeout(this._waiting)
      if (!prefix) {
        return this.setState({prefix, completions})
      }
      this._waiting = setTimeout(() => {
        this.setState({prefix, completions})
      }, 300)
    })
  }

  componentWillUnmount() {
    this._unsub()
    clearTimeout(this._waiting)
  }

  render() {
    if (!this.state.prefix) return null
    const prefixLen = this.state.prefix.length
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.shortcut, styles.prefix)}>
          {this.state.prefix}
        </div>
        {this.state.completions.map((n, i) => (
          <div className={css(styles.item)} key={i}>
            <div className={css(styles.shortcut)}>
              {n.original.slice(prefixLen)}
            </div>
            <div className={css(styles.description)}>
              {n.description}
            </div>
          </div>
        ))}
      </div>
    )
  }
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    padding: '5px 10px 5px 5px',
    alignItems: 'center',
    backgroundColor: '#555',
    borderRadius: 5,
    marginRight: 5,
    marginBottom: 5,
  },

  shortcut: {
    fontFamily: 'monospace',
    padding: '0 4px',
    borderRadius: 4,
    // boxShadow: '0px 0px 5px white inset',
    backgroundColor: '#999',
    color: 'white',
    textShadow: '1px 1px 2px #999',
    marginRight: 5,
    fontSize: 14,
  },

  prefix: {
    backgroundColor: '#3030ff',
    marginBottom: 5,
  },

  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    alignContent: 'center',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    color: 'white',
    backgroundColor: 'rgba(85, 85, 85, .5)',
    // opacity: .5,
    zIndex: 1000000,
    paddingTop: 5,
    fontSize: 12,
  },
})
