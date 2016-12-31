// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import GrowingTextarea from './GrowingTextarea'

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

  componentWillUnmount() {
    this._unmounted = true
  }

  componentDidMount() {
    this.input.focus(this.props.editState)
  }

  onBlur = () => {
    setTimeout(() => {
      if (this._unmounted || !this.props) return
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
    case 9: // tab
      // TODO these should be the same "history" item maybe? probably.
      // So I need the concept of a transaction.
      // this.props.store.beginTransaction()
      const pos = e.target.selectionEnd
      this.props.actions.setContent(this.props.node._id, this.state.tmpText)
      if (e.shiftKey) {
        this.props.actions.makeParentsNextSibling()
      } else {
        this.props.actions.makePrevSiblingsLastChild()
      }
      this.props.actions.editAt(this.props.node._id, pos)
      // this.props.store.endTransaction()
      // I won't allow nested transactions until I see a need for them
      break
    case 13: // enter
      const prev = e.target.value.slice(0, e.target.selectionStart)
      const next = e.target.value.slice(e.target.selectionStart)
      // TODO these two things should be a transaction probably? maybe
      this.props.actions.setContent(this.props.node._id, prev)
      const nid = this.props.actions.createAfter(this.props.node._id, next)
      if (nid) {
        this.props.actions.editStart(nid)
      }
      break
    case 27: // escape
      this.props.actions.setContent(this.props.node._id, this.state.tmpText)
      this.props.actions.normalMode()
      break
    case 38: // up
      if (e.shiftKey) return
      var line = this.input.getCursorLine()
      if (line !== 1 && line !== 0) return
      this.props.actions.setContent(this.props.node._id, this.state.tmpText)
      this.props.actions.focusPrev()
      break
    case 40: // down
      if (e.shiftKey) return
      var line = this.input.getCursorLine()
      if (line !== 1 && line !== -1) return
      this.props.actions.setContent(this.props.node._id, this.state.tmpText)
      this.props.actions.focusNext()
      break
    case 39: // right
      if (e.shiftKey) return
      if (e.target.selectionStart !== e.target.value.length) {
        return
      }
      this.props.actions.setContent(this.props.node._id, this.state.tmpText)
      this.props.actions.focusNext(this.props.node._id, 'start')
      break
    case 37: // left
      if (e.shiftKey) return
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
    } else if (!nextProps.editState && this.props.editState) {
      this.props.actions.setContent(this.props.node._id, this.state.tmpText)
    } else if (this.props.editState && this.props.node.content !== nextProps.node.content) {
      this.setState({
        tmpText: nextProps.node.content,
      })
    }
  }

  componentWillUnmount() {
    if (this.props.editState) {
      this.props.actions.setContent(this.props.node._id, this.state.tmpText)
    }
  }

  render() {
    return <GrowingTextarea
      ref={node => this.input = node}
      value={this.state.tmpText}
      className={this.props.className}
      onChange={e => this.setState({tmpText: e.target.value})}
      onKeyDown={this.onKeyDown}
      onBlur={this.onBlur}
      style={this.props.style}
    />
  }
}

