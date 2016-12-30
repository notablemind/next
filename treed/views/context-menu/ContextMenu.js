// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import './menu.less'

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
      offX: 5,
      offY: 5,
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
    className={'menu__item ' + css(styles.item)}
    key={i}
  >
    <div
      onMouseDown={item.action && !item.disabled ? (e => {
        e.stopPropagation()
        e.preventDefault()
        onClose()
        item.action()
      }) : null}
      className={css(styles.itemTop)}
    >
      <div className={css(styles.text, item.disabled && styles.itemTextDisabled)}>
        {item.text}
      </div>
      {item.children && item.children.length ?
        <div className={css(styles.childMarker)}>▸</div> : null}
      {item.checked ?
        <div className={css(styles.checked)}>✔</div> : null}
    </div>
    {item.children ?
      <div className={'menu__children ' + css(styles.subChildren)}>
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
    boxShadow: '0px 0px 1px #555',
    // border: '1px solid #ccc',
    minWidth: 200,
  },

  subChildren: {
    position: 'absolute',
    left: '100%',
    top: 0,
    zIndex: 100000000000,
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

  itemTop: {
    flexDirection: 'row',
  },

  text: {
    flex: 1,
  },

  itemTextDisabled: {
    // fontStyle: 'italic',
    color: '#999',
  },
})
