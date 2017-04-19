// @flow

import React, {Component} from 'react'
import {StyleSheet, css} from './DescendantStyleSheet'
import CM from 'codemirror'
// import CodeMirror from 'react-codemirror'

require('codemirror/lib/codemirror.css')
// TODO maybe just load these as needed? Can probably do something fancy w/
// just adding a script tag to the page for these
require('codemirror/mode/javascript/javascript')
require('codemirror/mode/clojure/clojure')
require('codemirror/mode/python/python')
require('codemirror/mode/julia/julia')
require('codemirror/mode/mllike/mllike')
require('codemirror/mode/rust/rust')
require('codemirror/mode/css/css')
require('codemirror/keymap/vim')

require('codemirror/addon/fold/foldcode')
require('codemirror/addon/fold/foldgutter')
require('codemirror/addon/fold/brace-fold')
require('codemirror/addon/fold/xml-fold')
require('codemirror/addon/fold/comment-fold')

require('codemirror/addon/edit/closebrackets')
require('codemirror/addon/edit/matchbrackets')

require('codemirror/addon/hint/javascript-hint')
require('codemirror/addon/hint/show-hint')
require('codemirror/addon/hint/anyword-hint')
require('codemirror/addon/hint/show-hint.css')


const loadedModes = {}


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

const betterShiftTab = onInfo => cm => {
  var cursor = cm.getCursor()
    , line = cm.getLine(cursor.line)
    , pos = {line: cursor.line, ch: cursor.ch}
  if (cursor.ch > 0 && line[cursor.ch - 1] !== ' ') {
    return cm.showHint({
      hint: onInfo,
      completeSingle: false,
      alignWithWord: false,
    })
  }
  cm.execCommand('indentLess')
}

const betterTab = onComplete => cm => {
  if (cm.somethingSelected()) {
    return cm.indentSelection("add");
  }
  const cursor = cm.getCursor()
  const line = cm.getLine(cursor.line)
  const pos = {line: cursor.line, ch: cursor.ch}
  if (cursor.ch > 0 && line[cursor.ch - 1] !== ' ') {
    return cm.showHint({hint: onComplete})
  }
  cm.replaceSelection(Array(cm.getOption("indentUnit") + 1).join(" "), "end", "+input");
}


export default class CodeEditor extends Component {
  constructor(props: any) {
    super()
    this.state = {
      text: props.node.content,
    }
    this.options = {
      extraKeys: {
        Tab: betterTab(props.onComplete),
        'Shift-Tab': betterShiftTab(props.onHint),
      },
      viewportMargin: Infinity,
      lineWrapping: true,
    }
  }

  focus(at) {
    focusCm(this.cm, at)
  }

  componentDidMount() {
    const {node} = this.props
    const {text} = this.state
    this.cm = CM(this.node, {
      value: text,
      mode: node.types.code.language,
      lineNumbers: text.split('\n').length >= 10,
        // TODO update options as things change
      ...this.options,
    })

    this.cm.on('blur', this.onBlur)
    this.cm.on('focus', this.onFocus)
    this.cm.on('keydown', this.onKeyDown)
		this.cm.on('change', this.codemirrorValueChanged);
    if (this.props.editState) {
      this.focus(this.props.editState)
    }
  }

	codemirrorValueChanged = (doc, change) => {
		if (change.origin !== 'setValue') {
			this.setState({text: doc.getValue()})
		}
	}

  onKeyDown = (cm, evt) => {
    // TODO up & down navigation btw cells, n stuff
    if (evt.key === 'Enter') {
      if (evt.metaKey || evt.shiftKey) {
        if (this.state.text !== this.props.node.content) {
          this.props.keyActions.setContent(this.state.text)
        }
        evt.preventDefault()
      }
      // e.stopPropagation()
      return
    }
    if (evt.key === 'Tab') {
      evt.stopPropagation()
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.node.types.code.language !== this.props.node.types.code.language) {
      this.cm.setOption('mode', this.props.node.types.code.language)
    }
    if (!this.props.editState && this.cm.hasFocus()) {
      this.cm.getInputField().blur()
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
    if (this.props.node.content !== nextProps.node.content) {
      this.setState({text: nextProps.node.content})
    }
  }

  onFocus = () => {
    if (!this.props.editState) {
      this.props.actions.edit(this.props.node._id)
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
    return <div
      ref={node => this.node = node}
      className={css(styles.editor)}
    />
  }
}

const styles = StyleSheet.create({
  editor: {
    display: 'flex',
    backgroundColor: 'red',

    '>CodeMirror': {
      height: 'auto',
    },
  },
})

