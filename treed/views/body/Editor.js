// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

export default class Editor extends Component {
  state: {
    tmpText: string,
  }
  _unmounted: bool
  node: any

  constructor(props: any) {
    super()
    this.state = {
      tmpText: props.node.content,
    }
    this._unmounted = false
  }

  componentWillUnmount() {
    this._unmounted = true
  }

  componentDidMount() {
    this.node.focus()
    let pos = this.node.value.length
    switch (this.props.editState) {
      case 'start':
        pos = 0
        break
      case 'end':
      case 'default':
        break
      case 'change':
        this.node.selectionStart = 0
        this.node.selectionEnd = this.node.value.length
        return
      default:
        if (parseInt(this.props.editState) === this.props.editState) {
          pos = this.props.editState
        }
    }
    this.node.selectionStart = this.node.selectionEnd = pos
  }

  onBlur = () => {
    setTimeout(() => {
      if (this._unmounted) return
      if (!document.hasFocus()) return
      this.props.actions.setContent(this.props.node._id, this.state.tmpText)
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
    case 13: // enter
      this.props.actions.setContent(this.props.node._id, this.state.tmpText)
      const nid = this.props.actions.createAfter(this.props.node._id)
      if (nid) {
        this.props.actions.editStart(nid)
      }
      break
    case 27:
      this.props.actions.setContent(this.props.node._id, this.state.tmpText)
      this.props.actions.normalMode()
      break
    case 38:
      this.props.actions.setContent(this.props.node._id, this.state.tmpText)
      this.props.actions.focusPrev()
      break
    case 40:
      this.props.actions.setContent(this.props.node._id, this.state.tmpText)
      this.props.actions.focusNext()
      break
    case 39: // right
      if (e.target.selectionStart !== e.target.value.length) {
        return
      }
      this.props.actions.setContent(this.props.node._id, this.state.tmpText)
      this.props.actions.focusNext(this.props.node._id, 'start')
      break
    case 37: // left
      if (e.target.selectionEnd !== 0) return
      this.props.actions.setContent(this.props.node._id, this.state.tmpText)
      this.props.actions.focusPrev(this.props.node._id, 'end')
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
    }
    if (!nextProps.editState && this.props.editState) {
      this.props.actions.setContent(this.props.node._id, this.state.tmpText)
    }
  }

  render() {
    return <input
      ref={node => this.node = node}
      value={this.state.tmpText}
      className={this.props.className}
      onChange={e => this.setState({tmpText: e.target.value})}
      onKeyDown={this.onKeyDown}
      onBlur={this.onBlur}
    />
  }
}

