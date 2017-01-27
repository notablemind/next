// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'
import Icon from 'treed/views/utils/Icon'

export default class ContentViewer extends Component {
  state: any
  constructor() {
    super()
    this.state = {
      awesome: null,
    }
  }

  onMouseDown = (e: any) => {
    if (e.target.className === 'scripture-ref') {
      e.preventDefault()
      e.stopPropagation()
      const [uri, id] = e.target.href.split('://content/')[1].split('#')
      this.props.navigateTo('/' + uri.split('?')[0], id)
      return
    }

    const selection: any = document.getSelection()
    if (!selection || selection.rangeCount !== 1) return
    const range = selection.getRangeAt(0)
    const box = range.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (box.left < x && x < box.right && box.top < y && y < box.bottom) {
      e.preventDefault()
      e.stopPropagation()
      const start = selection.anchorNode.parentElement.getAttribute('data-id')
      const end = selection.extentNode.parentElement.getAttribute('data-id')
      const contents = range.cloneContents()
      ;[...contents.querySelectorAll('.note-ref')].forEach(m => m.parentNode.removeChild(m))
      const text = contents.textContent
      console.log('booyah', text, start, end, this.props.item.uri)
      this.props.onDragStart(text, start, end)
    }
  }

  render() {
    return <div
      className={css(styles.container)}
      onMouseDown={this.onMouseDown}
    >
      <div
        onClick={this.props.onBack}
        className={css(styles.top)}
      >
        <Icon
          name="chevron-left"
        />
        <div className={css(styles.title)}>
          {this.props.item.title_html}
          <div className={css(styles.parentTitle)}>
          {this.props.parent}
          </div>
        </div>
      </div>
      <div
        className={css(styles.contents)}
      >
      {this.props.item.content.extras.map(paragraph => (
        <div
          key={paragraph.id}
          data-id={paragraph.id}
          dangerouslySetInnerHTML={{__html: paragraph.contents}}
          className={css(styles.paragraph)}
        />
      ))}
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  contents: {
    flex: 1,
    overflow: 'auto',
  },

  top: {
    flexDirection: 'row',
    cursor: 'pointer',
    padding: '5px 10px',
    boxShadow: '0px 0px 5px #aaa',

    ':hover': {
      backgroundColor: '#eee',
    },
  },

  title: {
    flex: 1,
    marginLeft: 10,
    // flexDirection: '
  },

  parentTitle: {
    fontSize: '90%',
    color: '#555',
  },

  paragraph: {
    display: 'block',
    textIndent: 15,
    padding: '5px 0',
    lineHeight: 1.4,
  },
})
