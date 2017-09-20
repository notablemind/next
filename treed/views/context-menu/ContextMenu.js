// @-flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import './menu.less'

// import type {MenuItem: MenuItemT} from '../../types'
import isDomAncestor from '../utils/isDomAncestor'

export default class ContextMenu extends Component {
  state = {selected: null}
  componentDidMount() {
    window.addEventListener('mousedown', this.closer, true)
  }

  componentWillUnmount() {
    window.removeEventListener('mousedown', this.closer, true)
  }

  closer = (e: any) => {
    if (!isDomAncestor(e.target, this._node)) {
      e.preventDefault()
      e.stopPropagation()
      this.props.onClose()
    }
  }

  render() {
    const {menu, onClose} = this.props
    const {selected} = this.state
    return <div
      ref={n => this._node = n}
      className={css(styles.container)}
      style={{
        top: this.props.pos.top,
        left: this.props.pos.left,
      }}
    >
      <InWindow className={css(styles.menu)}>
        {menu.map((item, i) => (
          <MenuItem
            selected={i === selected}
            onHover={() => this.setState({selected: i})}
            onClose={onClose}
            item={item}
            key={i}
          />
        ))}
      </InWindow>
    </div>
  }
}

class SubMenu extends Component {
  state = {selected: null}

  render() {
    const {menu, onClose} = this.props
    const {selected} = this.state
    return <InWindow
      className={css(styles.menu, styles.subChildren)}
    >
      {menu.map((item, i) => (
        <MenuItem
          selected={i === selected}
          onHover={() => this.setState({selected: i})}
          onClose={onClose}
          item={item}
          key={i}
        />
      ))}
    </InWindow>
  }
}

const MenuItem = ({item, onHover, selected, onClose}) => (
  <div className={css(styles.item)}>
    <div
      onMouseDown={
        item.action && !item.disabled
          ? e => {
              e.stopPropagation()
              e.preventDefault()
              onClose()
              item.action()
            }
          : null
      }
      className={css(
        styles.itemTop,
        selected && styles.itemSelected,
        item.action && !item.disabled && styles.clickableItem,
      )}
      onMouseOver={onHover}
    >
      <div
        className={css(styles.text, item.disabled && styles.itemTextDisabled)}
      >
        {item.text}
      </div>
      {item.keyShortcut &&
        <div className={css(styles.keyShortcut)}>{item.keyShortcut}</div>}
      {item.children && item.children.length
        ? <div className={css(styles.childMarker)}>▸</div>
        : null}
      {item.radioChecked != null
        ? <div
            className={css(
              styles.radioChecked,
              !item.radioChecked && styles.notRadioChecked,
            )}
          />
        : null}
      {item.checked != null
        ? <div
            className={css(styles.checked, !item.checked && styles.notChecked)}
          >
            ✔
          </div>
        : null}
    </div>
    {selected && item.children
      ? /*<div className={css(styles.subChildren)}>
          {renderMenu(onClose, item.children)}
        </div>*/
        <SubMenu menu={item.children} onClose={onClose} />
      : null}
  </div>
)

class InWindow extends Component {
  state = {offY: 0}
  componentDidMount() {
    const box = this.node.getBoundingClientRect()
    if (box.bottom > window.innerHeight) {
      console.log('bottom', box.bottom, window.innerHeight)
      this.setState({
        offY: window.innerHeight - box.bottom - 15,
      })
    }
  }

  render() {
    return <div ref={n => this.node = n} {...this.props} style={{
      marginTop: this.state.offY,
    }} />
  }
}

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

  keyShortcut: {
    backgroundColor: '#eee',
    padding: '2px 4px',
    borderRadius: 4,
    fontSize: '70%',
    textShadow: '1px 1px 0 white',
  },

  subChildren: {
    position: 'absolute',
    left: '100%',
    top: 0,
    zIndex: 100000000000,
  },

  checked: {
    fontSize: 12,
    alignSelf: 'center',
  },
  notChecked: {
    color: '#ddd',
  },

  childMarker: {
    color: '#aaa',
    marginLeft: 5,
  },

  item: {
    position: 'relative',
    backgroundColor: 'white',

    // ':hover': {
    //   backgroundColor: '#eef',
    // },
  },

  itemSelected: {
    backgroundColor: '#eef',
  },

  clickableItem: {
    cursor: 'pointer',
  },

  radioChecked: {
    width: 10,
    height: 10,
    backgroundColor: '#ddd',
    border: '1px solid #aaa',
    borderRadius: 10,
    alignSelf: 'center',
  },

  notRadioChecked: {
    backgroundColor: 'white',
  },

  itemTop: {
    padding: '5px 10px',
    paddingRight: 5,
    flexDirection: 'row',
    cursor: 'default',
  },

  text: {
    flex: 1,
  },

  itemTextDisabled: {
    // fontStyle: 'italic',
    color: '#999',
  },
})
