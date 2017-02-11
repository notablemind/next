
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

export default class Modal extends Component {
  container: any
  render() {
    const {className = '', style, children, onClose} = this.props
    return <div
      ref={node => this.container = node}
      onClick={e => e.target === this.container ? onClose() : null}
      className={css(styles.container)}
    >
      <div style={style} className={className + ' ' + css(styles.modal)}>
        {children}
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100000,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },

  modal: {
    boxShadow: '0 0 5px #555',
    padding: 10,
    backgroundColor: 'white',
  },
})
