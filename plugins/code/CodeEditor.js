// @flow

import React, {Component} from 'react'
import {StyleSheet as BaseStyleSheet} from 'aphrodite'
import CodeMirror from 'react-codemirror'

require('codemirror/lib/codemirror.css')
// TODO maybe just load these as needed? Can probably do something fancy w/
// just adding a script tag to the page for these
require('codemirror/mode/javascript/javascript')
require('codemirror/mode/python/python')
require('codemirror/mode/swift/swift')
require('codemirror/mode/clojure/clojure')

const loadedModes = {}

const descendantHandler = (selector, baseSelector, generateSubtreeStyles) => {
  if (selector[0] !== '>') { return null; }
  return generateSubtreeStyles( `${baseSelector} > .${selector.slice(1)}`);
};

const {StyleSheet, css} = BaseStyleSheet.extend([{selectorHandler: descendantHandler}]);

const focusCm = (cm, at) => {
  if (!cm.hasFocus()) {
    cm.focus()
  }
  if (at === 'end' || !at) {
    cm.setCursor(cm.lineCount(), 0)
  } else if (at === 'change') {
    cm.execCommand('selectAll')
  } else if (at === 'start') {
    cm.setCursor(0, 0)
  } else if (at === 'default') {
    // TODO if we've never been focused, then focus to the end.
    // We let codemirror remember the last focus
  } else {
    console.warn('Selecting in the middle not supported')
    cm.setCursor(cm.lineCount(), 0)
  }
}

export default class CodeEditor extends Component {
  constructor(props: any) {
    super()
    this.state = {
      text: props.node.content,
    }
  }

  focus(at) {
    focusCm(this.cm, at)
  }

  componentDidMount() {
    this.cm.on('blur', this.onBlur)
    this.cm.on('keydown', this.onKeyDown)
    if (this.props.editState) {
      this.focus(this.props.editState)
    }
  }

  onKeyDown = (cm, evt) => {
    evt.stopPropagation()
    // console.log(evt.key)
    if (evt.key === 'Escape') {
      this.onBlur()
    } else if (evt.key === 'Enter' && evt.metaKey) {
      if (this.state.text !== this.props.node.content) {
        // TODO set dirty. I probably need to support setMultipleNested
        this.props.keyActions.setContent(this.state.text)
      }
      this.props.actions.executeNode(this.props.node._id)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.editState && !this.props.editState) {
      this.focus(nextProps.editState)
    } else if (!nextProps.editState && this.props.editState) {
      // dunno why I need this timeout
      setTimeout(() => this.cm.getInputField().blur(), 10)
    } else if (this.props.editState && this.props.node.content !== nextProps.node.content) {
      this.setState({text: nextProps.node.content})
    }
  }

  onBlur = () => {
    setTimeout(() => {
      if (this._unmounted || !this.props) return
      if (this.state.text !== this.props.node.content) {
        // TODO set dirty. I probably need to support setMultipleNested
        this.props.keyActions.setContent(this.state.text)
      }
      if (!document.hasFocus()) return
      this.props.actions.normalMode()
    }, 10)
  }

  render() {
    const {node} = this.props
    const {text} = this.state
    return <CodeMirror
      value={text}
      className={css(styles.editor)}
      onChange={text => this.setState({text})}
      ref={node => node && (this.cm = node.getCodeMirror())}
      style={{
        height: 'auto',
      }}
      options={{
        mode: node.types.code.language,
        lineNumbers: text.split('\n').length >= 10,
        viewportMargin: Infinity,
      }}
    />
  }
}

const styles = StyleSheet.create({
  editor: {
    '>CodeMirror': {
      height: 'auto',
    },
  },
})

