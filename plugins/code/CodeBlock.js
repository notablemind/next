// @flow

import React, {Component} from 'react'
import {StyleSheet as BaseStyleSheet} from 'aphrodite'
import CodeMirror from 'react-codemirror'

require('codemirror/lib/codemirror.css')
require('codemirror/mode/javascript/javascript')

const descendantHandler = (selector, baseSelector, generateSubtreeStyles) => {
  if (selector[0] !== '>') { return null; }
  return generateSubtreeStyles( `${baseSelector} > .${selector.slice(1)}`);
};

const {StyleSheet, css} = BaseStyleSheet.extend([{selectorHandler: descendantHandler}]);

export default class CodeBlock extends Component {
  constructor(props: any) {
    super()
    this.state = {
      text: props.node.content,
    }
  }

  focus(at) {
    if (!this.cm.hasFocus()) {
      this.cm.focus()
    }
    if (at === 'end' || !at) {
      this.cm.setCursor(this.cm.lineCount(), 0)
    } else if (at === 'change') {
      this.cm.execCommand('selectAll')
    } else if (at === 'start') {
      this.cm.setCursor(0, 0)
    } else if (at === 'default') {
      // We let codemirror remember the last focus
    } else {
      console.warn('Selecting in the middle not supported')
      this.cm.setCursor(this.cm.lineCount(), 0)
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

  componentDidMount() {
    this.cm.on('blur', this.onBlur)
  }

  onBlur = () => {
    if (!this.props.editState) return
    setTimeout(() => {
      if (this._unmounted || !this.props) return
      if (!document.hasFocus()) return
      this.props.keyActions.setContent(this.state.text)
      this.props.actions.normalMode()
    }, 10)
  }

  render() {
    const {node} = this.props
    const {text} = this.state
    return <CodeMirror
      value={text}
      className={css(styles.container)}
      onChange={text => this.setState({text})}
      ref={node => node && (this.cm = node.getCodeMirror())}
      style={{
        height: 'auto',
      }}
      options={{
        mode: 'javascript',
        lineNumbers: text.split('\n').length >= 10,
        viewportMargin: Infinity,
      }}
    />
  }
}

const styles = StyleSheet.create({
  container: {
    '>CodeMirror': {
      height: 'auto',
    },
  },
})
