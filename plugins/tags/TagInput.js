// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'


type Tag = {
  id: string,
  label: string,
  color: string,
}


export default class Input extends Component {
  node: *
  state: {text: string, position: number, results: Tag[], focused: boolean}
  constructor({tags, ids}: any) {
    super()
    this.state = {
      text: '',
      position: 0,
      focused: false,
      results: tags.filter(tag => ids.indexOf(tag.id) === -1)
    }
  }

  onChange = (e: any) => {
    const needle = e.target.value.toLowerCase()
    const results = this.props.tags
        .filter(tag => tag.label.toLowerCase().indexOf(needle) !== -1)
        .filter(tag => this.props.ids.indexOf(tag.id) === -1)
    this.setState({
      text: e.target.value,
      results,
      position: results.length ? 1 : 0,
    })
  }

  select = (tag: Tag) => {
  }

  onKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation()
    switch (e.key) {
      case 'Escape':
        this.props.onNormalMode()
        return
      case 'Enter':
        if (this.state.position === 0) {
          // $FlowFixMe
          this.props.onCreateTag(e.target.value)
        } else {
          const tag = this.state.results[this.state.position - 1]
          if (tag) {
            this.props.onAddTag(tag)
          }
        }
        this.setState({text: '', results: []})
        return
      case 'ArrowUp':
        this.goUp()
        e.preventDefault()
        return
      case 'ArrowDown':
        this.goDown()
        e.preventDefault()
        return
    }
  }

  goUp() {
    const {position, results} = this.state
    this.setState({position: position <= 0 ? results.length : position - 1})
  }

  goDown() {
    const {position, results} = this.state
    this.setState({position: position >= results.length ? 0 : position + 1})
  }

  componentDidMount() {
    if (this.props.autoFocus) {
      this.node.focus()
    }
  }

  onFocus = () => {
    this.setState({focused: true})
  }

  onBlur = () => {
    this.setState({focused: false})
    if (this.props.onNormalMode) {
      this.props.onNormalMode()
    }
  }

  render() {
    const {results, position} = this.state
    return <div
      className={css(styles.container)}
    >
      <input
        value={this.state.text}
        className={css(styles.input)}
        ref={node => this.node = node}
        onKeyDown={this.onKeyDown}
        onChange={this.onChange}
        onFocus={this.onFocus}
        onBlur={this.onBlur}
      />
      {this.state.focused && <div className={css(styles.autocomplete)}>
        {this.props.onCreateTag && this.state.text && <div
          className={css(styles.result, position === 0 && styles.selected)}
        >
          Create new tag "{this.state.text}"
        </div>}
        {this.state.results.map((tag, i) => (
          <div
            className={css(styles.result, position === i + 1 && styles.selected)}
            key={tag.id}
            onClick={() => this.select(tag)}
          >
            {tag.label}
          </div>
        ))}
      </div>}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },

  input: {
    width: 50,

  },

  result: {
    padding: '3px 5px',
    whiteSpace: 'nowrap',
    fontSize: 12,
  },

  selected: {
    backgroundColor: '#eee',
  },

  autocomplete: {
    boxShadow: '0 2px 5px #d0d0d0',
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    borderRadius: 3,
    zIndex: 10000,
    minWidth: '100%',
  },
})
