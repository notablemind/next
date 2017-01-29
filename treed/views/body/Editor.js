// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import GrowingTextarea from './GrowingTextarea'
import textStyle from './textStyle'

export default class Editor extends Component {
  state: {
    tmpText: string,
  }
  _unmounted: bool
  input: any

  constructor(props: any) {
    super()
    this.state = {
      tmpText: props.node.content,
    }
    this._unmounted = false
  }

  componentDidMount() {
    this.input.focus(this.props.editState)
  }

  onBlur = () => {
    setTimeout(() => {
      if (this._unmounted || !this.props) return
      if (!document.hasFocus()) return
      this.props.keyActions.setContent(this.state.tmpText)
      this.props.actions.normalMode()
    }, 10)
  }

  onKeyDown = (e: any) => {
    switch (e.keyCode) {
    case 8: // delete
      if (!e.target.value.length) {
        this.props.actions.remove(this.props.node._id, true)
      } else {
        return
      }
      break
    case 9: // tab
      if (!this.props.keyActions.onTab) return // ignore
      // TODO these should be the same "history" item maybe? probably.
      // So I need the concept of a transaction.
      // this.props.store.beginTransaction()
      const pos = e.target.selectionEnd
      this.props.keyActions.setContent(this.state.tmpText)
      this.props.keyActions.onTab(e.shiftKey)
      this.props.actions.editAt(this.props.node._id, pos)
      // this.props.store.endTransaction()
      // I won't allow nested transactions until I see a need for them
      break
    case 13: // enter
      if (e.shiftKey) return
      if (!e.ctrlKey && e.target.value.indexOf('\n') !== -1) return
      const prev = e.target.value.slice(0, e.target.selectionStart)
      const next = e.target.value.slice(e.target.selectionStart)
      this.setState({tmpText: prev})
      // TODO these two things should be a transaction probably? maybe
      this.props.keyActions.setContent(prev)
      this.props.keyActions.onEnter(next)
      break
    case 27: // escape
      this.props.keyActions.setContent(this.state.tmpText)
      this.props.actions.normalMode()
      break

    case 38: // up
      if (e.shiftKey) return
      var line = this.input.getCursorLine()
      if (line !== 1 && line !== 0) return
      this.props.keyActions.setContent(this.state.tmpText)
      this.props.keyActions.onUp()
      break
    case 40: // down
      if (e.shiftKey) return
      var line = this.input.getCursorLine()
      if (line !== 1 && line !== -1) return
      this.props.keyActions.setContent(this.state.tmpText)
      this.props.keyActions.onDown()
      break
    case 39: // right
      if (e.shiftKey) return
      if (e.target.selectionStart !== e.target.value.length) {
        return
      }
      this.props.keyActions.setContent(this.state.tmpText)
      this.props.keyActions.onRight()
      break
    case 37: // left
      if (e.shiftKey) return
      if (e.target.selectionEnd !== 0) return
      this.props.keyActions.setContent(this.state.tmpText)
      this.props.keyActions.onLeft()
      break
    default:
      return
    }
    e.preventDefault()
    e.stopPropagation()
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.editState && !this.props.editState) {
      this.setState({
        tmpText: nextProps.node.content,
      })
    } else if (!nextProps.editState && this.props.editState) {
      this.props.keyActions.setContent(this.state.tmpText)
    } else if (this.props.editState && this.props.node.content !== nextProps.node.content) {
      this.setState({
        tmpText: nextProps.node.content,
      })
    }
  }

  componentWillUnmount() {
    this._unmounted = true
    if (this.props.editState) {
      this.props.keyActions.setContent(this.state.tmpText)
    }
  }

  render() {
    return <GrowingTextarea
      ref={node => this.input = node}
      value={this.state.tmpText}
      className={css(styles.input) + ' Node_input'}
      onChange={e => this.setState({tmpText: e.target.value})}
      onHeightChange={this.props.onHeightChange}
      onKeyDown={this.onKeyDown}
      onBlur={this.onBlur}
      style={this.props.style}
    />
  }
}

const styles = StyleSheet.create({
  input: textStyle,
})
