// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

const isParent = (child, parent) => {
  if (child === parent) return true
  while (child.parentNode && child !== document.body) {
    child = child.parentNode
    if (child === parent) return true
  }
  return false
}

export default class ContextMenu extends Component {
  constructor() {
    super()
    this.state = {
      offX: 0,
      offY: 0,
    }
  }

  componentDidMount() {
    window.addEventListener('mousedown', this.closer, true)
    const box = this._node.getBoundingClientRect()
    // TODO set offX / offY if needed
  }

  componentWillUnmount() {
    window.removeEventListener('mousedown', this.closer, true)
  }

  closer = (e: any) => {
    if (!isParent(e.target, this._node)) {
      e.preventDefault()
      e.stopPropagation()
      this.props.onClose()
    }
  }

  render() {
    return <div
      className={css(styles.container)}
      style={{
        top: this.props.pos.top + this.state.offY,
        left: this.props.pos.left + this.state.offX,
      }}
      ref={n => this._node = n}
    >
      {renderMenu(this.props.onClose, this.props.menu)}
    </div>
  }
}

const renderItem = (onClose, item, i) => (
  <div
    className={css(styles.item)}
    key={i}
  >
    <div
      onMouseDown={e => {
        e.stopPropagation()
        e.preventDefault()
        onClose()
        item.action()
      }}
      className={css(styles.itemText, item.disabled && styles.itemTextDisabled)}
    >
      {item.text}
    </div>
    {item.children ?
      <div className={css(styles.subChildren)}>
        {renderMenu(onClose, item.children)}
      </div> : null}
  </div>
)

const renderMenu = (onClose, items) => (
  <div
    className={css(styles.menu)}
  >
    {items.map(renderItem.bind(null, onClose))}
  </div>
)

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000000,
  },

  menu: {
    boxShadow: '0 0px 2px #555',
    // border: '1px solid #ccc',
    minWidth: 200,
  },

  subChildren: {
    position: 'absolute',
    left: '100%',
    top: 0,
  },

  item: {
    padding: '5px 10px',
    position: 'relative',
    backgroundColor: 'white',
    cursor: 'pointer',

    ':hover': {
      backgroundColor: '#eef',
    },
  },

  itemTextDisabled: {
    fontStyle: 'italic',
    color: '#999',
  },
})
