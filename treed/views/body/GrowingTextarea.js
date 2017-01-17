// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

const getTestContent = (text, pos) => {
  let start = text.slice(0, pos)
  if (!text[pos].match(/\s/)) {
    start += text.slice(pos).match(/[^\s]+/)[0]
  }
  return start
}

export default class GrowingTextarea extends Component {
  textarea: any
  shadow: any
  _prevHeight: ?string

  componentDidMount() {
    this.resize()
    window.addEventListener('resize', this.resize)
    this._prevHeight = null
  }

  componentDidUpdate() {
    this.resize()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize)
  }

  getCursorSplit() {
    return this.textarea.selectionEnd
  }

  resize = () => {
    const style = window.getComputedStyle(this.shadow)
    let height
    if (!this.props.value.trim()) {
      const lineHeight = parseFloat(style.lineHeight)
      const paddingTop = parseFloat(style.paddingTop)
      const paddingBottom = parseFloat(style.paddingBottom)
      height = (lineHeight + paddingTop + paddingBottom) + 'px'
    } else {
      height = style.height
    }
    if (this.props.onHeightChange && this._prevHeight && this._prevHeight !== height) {
      this.props.onHeightChange(parseFloat(height))
    }
    this.textarea.style.height = height
    this._prevHeight = height
  }

  // 0 == start
  // -1 == end
  // 1 == there's only one line
  // 2 == middle somewhere
  getCursorLine() {
    if (this.textarea !== document.activeElement) return 2
    const style = window.getComputedStyle(this.shadow)
    const box = this.shadow.getBoundingClientRect()
    const lineHeight = parseFloat(style.lineHeight)
    const fullLines = Math.round(box.height / lineHeight)
    if (fullLines < 2) return 1
    if (this.textarea.selectionStart !== this.textarea.selectionEnd) return 2
    if (this.textarea.selectionStart === 0) return 0
    if (this.textarea.selectionStart === this.props.value.length) return -1
    const prevContent = this.shadow.firstChild.nodeValue
    const testContent = getTestContent(this.props.value, this.textarea.selectionStart)
    this.shadow.firstChild.nodeValue = testContent
    const testHeight = this.shadow.getBoundingClientRect().height
    this.shadow.firstChild.nodeValue = prevContent
    const testLines = Math.round(testHeight / lineHeight)
    if (testLines < 2) return 0
    if (testLines === fullLines) return -1
    return 2
  }

  // -1 at end
  // 0 at start
  // 1 no content
  // 2 selection not collapsed
  // 3 somewhere in the middle
  getCursorPos() {
    if (this.textarea.selectionStart !== this.textarea.selectionEnd) {
      return 2
    }
    if (!this.props.value.length) return 1
    if (this.textarea.selectionStart === 0) return 0
    if (this.textarea.selectionStart === this.props.value.length) return -1
    return 3
  }

  focus(at: string | number) {
    let pos = 0
    if (at === 'end' || !at || at === 'default') {
      pos = this.props.value.length
    }
    if (typeof at === 'number') {
      pos = at
    }
    if (this.textarea !== document.activeElement) {
      this.textarea.focus()
    }
    if (at === 'change') {
      this.textarea.selectionStart = 0
      this.textarea.selectionEnd = this.props.value.length
    } else {
      this.textarea.selectionStart = this.textarea.selectionEnd = pos
    }
  }

  blur() {
    this.textarea.blur()
  }

  isFocused() {
    return this.textarea === document.activeElement
  }

  render() {
    const {onHeightChange, ...props} = this.props
    return <div className={css(styles.container)}>
      <textarea
        {...props}
        ref={n => this.textarea = n}
        className={css(styles.textarea) + ' ' + this.props.className}
      />
      <div
        ref={n => this.shadow = n}
        className={css(styles.shadow) + ' ' + this.props.className}
      >
        {this.props.value + ' '}
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    cursor: 'text',
    flex: 1,
  },

  textarea: {
    cursor: 'text',
    width: '100%',
    // height: 0; // will be overridden
    // border: 0,
    // padding: 0,
    resize: 'none',
    // fontSize: '1em',
    overflow: 'hidden',
    // fontFamily: 'sans-serif',
  },

  shadow: {
    whiteSpace: 'pre-wrap',
    position: 'absolute',
    // fontFamily: 'sans-serif',
    width: '100%',
    top: 0,
    left: 0,
    visibility: 'hidden',
  },
})

css(styles.container)
css(styles.textarea)
css(styles.shadow)
