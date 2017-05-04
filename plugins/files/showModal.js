
import React from 'react'
import {css, StyleSheet} from 'aphrodite'
import {render, unmountComponentAtNode} from 'react-dom'

const Modal = ({onClose, render}) => (
  <div className={css(styles.container)}>
    <div
      className={css(styles.backdrop)}
      onClick={onClose}
    />
    <div className={css(styles.inner)}>
      {render(onClose)}
    </div>
  </div>
)

export default renderContent => {
  const container = document.createElement('div')
  const onClose = () => {
    unmountComponentAtNode(container)
    container.parentNode.removeChild(container)
  }
  document.body.appendChild(container)

  const node = <Modal
    onClose={onClose}
    render={renderContent}
  />
  render(node, container)
}

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backdrop: {
    position: 'absoute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },

  inner: {
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    backgroundColor: 'white',
    zIndex: 2,
  },
});
