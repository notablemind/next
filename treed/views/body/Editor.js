// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import GrowingTextarea from './GrowingTextarea'
import textStyle from './textStyle'

export default class Editor extends Component {
  props: {
    [key: string]: any,
    keyActions: {
      onTab: (shitfKey: boolean) => void,
      onEnter: (text: string) => void,
      onLeft: () => void,
      onRight: () => void,
      onUp: () => void,
      onDown: () => void,
      setContent: (text: string) => void,
    },
  }
  state: {
    tmpText: string,
    cancelledChange: boolean,
    changeSelection: number,
  }
  _unmounted: boolean
  input: any

  constructor(props: any) {
    super()
    this.state = {
      tmpText: props.node.content,
      changeSelection: 0,
      cancelledChange: false,
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

  moveChangeDown = () => {
    const {options} = this.getChangeOptions()
    this.setState(({changeSelection}) => ({
      changeSelection: changeSelection < options.length - 1
        ? changeSelection + 1
        : 0
    }))
  }

  moveChangeUp = () => {
    const {options} = this.getChangeOptions()
    this.setState(({changeSelection}) => ({
      changeSelection: changeSelection > 0
        ? changeSelection - 1
        : options.length - 1
    }))
  }

  onKeyDown = (e: any) => {
    switch (e.keyCode) {
      case 8: // delete
        if (!e.target.value.length && this.props.node.children.length === 0) {
          this.props.actions.remove(this.props.node._id, true)
        } else if (e.target.selectionEnd === 0) {
          this.props.actions.joinToPrevious(this.props.node._id, e.target.value)
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
        if (e.shiftKey) return e.stopPropagation()
        if (!e.ctrlKey && e.target.value.indexOf('\n') !== -1) return
        if (this.isChanging() && this.changeType()) break
        if (!this.props.keyActions.onEnter) break
        const prev = e.target.value.slice(0, e.target.selectionStart)
        const next = e.target.value.slice(e.target.selectionStart)
        this.setState({tmpText: prev})
        // TODO these two things should be a transaction probably? maybe
        this.props.keyActions.setContent(prev)
        this.props.keyActions.onEnter(next)
        break
      case 27: // escape
        if (this.isChanging()) {
          this.setState({cancelledChange: true})
        } else {
          this.props.keyActions.setContent(this.state.tmpText)
          this.props.actions.normalMode()
        }
        break

      case 74: // j
        if (!e.metaKey) return
        if (!this.isChanging()) return
        this.moveChangeDown()
        break
      case 75: // k
        if (!e.metaKey) return
        if (!this.isChanging()) return
        this.moveChangeUp()
        break

      case 38: // up
        if (e.shiftKey) return
        if (this.isChanging()) {
          this.moveChangeUp()
        } else {
          var line = this.input.getCursorLine()
          if (line !== 1 && line !== 0) return
          this.props.keyActions.setContent(this.state.tmpText)
          this.props.keyActions.onUp()
        }
        break
      case 40: // down
        if (e.shiftKey) return
        if (this.isChanging()) {
          this.moveChangeDown()
        } else {
          var line = this.input.getCursorLine()
          if (line !== 1 && line !== -1) return
          this.props.keyActions.setContent(this.state.tmpText)
          this.props.keyActions.onDown()
        }
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
    } else if (
      this.props.editState &&
      this.props.node.content !== nextProps.node.content
    ) {
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

  onChange = (e: any) => {
    this.setState({tmpText: e.target.value})
  }

  isChanging() {
    if (this.state.cancelledChange) return false
    const {nodeTypes} = this.props.store.plugins
    const {node, store} = this.props
    const typeNames = Object.keys(nodeTypes)
    const {tmpText} = this.state
    if (tmpText.match(/^\/f(i(le?)?)? /)) {
      return true
    }
    const changing =
      tmpText === '/' ||
      (tmpText.match(/^\/[a-z]/) &&
        typeNames.some(
          t =>
            t.length >= tmpText.length - 1
              ? ('/' + t).indexOf(tmpText) === 0
              : t === 'file' ? tmpText.indexOf('/' + t + ' ') === 0 : false,
        ))
    return changing
  }

  changeType() {
    const {help, options} = this.getChangeOptions()
    if (!options.length) return false
    this.setState({tmpText: ''})
    options[this.state.changeSelection].action()
    return true
  }

  getChangeOptions() {
    const {tmpText} = this.state
    if (tmpText === '/file') {
      return {help: 'Type file name', options: []}
    }

    const {nodeTypes} = this.props.store.plugins
    const handlers = Object.keys(nodeTypes)
      .map(k => nodeTypes[k].slashHandler)
      .filter(Boolean)

    for (let handler of handlers) {
      const res = handler(this.props.node._id, tmpText, this.props.store)
      if (res) return res
    }

    const {node, store} = this.props
    const typeOptions = Object.keys(nodeTypes)
      .sort()
      .filter(k => k !== node.type)
      .map(key => ({
        action: () => store.actions.setNodeType(node._id, key),
        label: key,
        // label: nodeTypes[key].title,
        type: key,
      }))
    const selectedTypes = tmpText === '/'
      ? typeOptions
      : // $FlowFixMe not working?
        typeOptions.filter(option => ('/' + option.type).indexOf(tmpText) === 0)
    return {
      options: selectedTypes,
      help: 'Set node type:',
    }
  }

  renderChangeList() {
    const {help, options} = this.getChangeOptions()
    const {changeSelection} = this.state
    return (
      <div
        style={{
          position: 'absolute',
          zIndex: 100,
          top: '100%',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px #555',
          borderRadius: 3,
          left: 0,
        }}
      >
        {help &&
          <div
            style={{
              padding: '3px 10px',
              fontSize: 12,
              color: '#777',
              // fontStyle: 'italic',
              // fontWeight: 400,
            }}
          >
            {help}
          </div>}
        {options.map((option, i) => (
          <div
            style={{
            }}
            key={option.label}
            onMouseDown={option.action}
            className={css(styles.option,
                           i === changeSelection && styles.optionSelected
                          )}
          >
            {option.label}
          </div>
        ))}
      </div>
    )
  }

  render() {
    return (
      <div className={css(styles.container)}>
        <GrowingTextarea
          ref={node => (this.input = node)}
          value={this.state.tmpText}
          className={
            css(styles.input) + ' Node_input ' + (this.props.className || '')
          }
          onChange={this.onChange}
          onHeightChange={this.props.onHeightChange}
          onKeyDown={this.onKeyDown}
          onBlur={this.onBlur}
          style={this.props.style}
        />
        {this.isChanging() && this.renderChangeList()}
      </div>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  input: textStyle,

  option: {
    padding: '2px 10px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#eee',
    },
  },
  optionSelected: {
    backgroundColor: '#eee',
  },
})
css(styles.input)
