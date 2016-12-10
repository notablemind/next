// @flow

import React, {Component} from 'react'

export default class Popup extends Component {
  constructor() {
    super()
    this.state = {
      isOpen: false,
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.isOpen && !prevState.isOpen) {
      window.addEventListener('mousedown', this.onClose, true)
    }
    if (!this.state.isOpen && prevState.isOpen) {
      window.removeEventListener('mousedown', this.onClose, true)
    }
  }

  componentWillUnmount() {
    window.removeEventListener('mousedown', this.onClose, true)
  }

  onClose = (e) => {
    // TODO check if we're within the target. if so, we can go w/ capture
    if (this.node) {
      let node = e.target
      while (node && node !== document.body) {
        if (node === this.node) return
        node = node.parentNode
      }
    }
    e.preventDefault()
    e.stopPropagation()
    this.setState({isOpen: false})
  }

  setOpen = isOpen => {
    if (isOpen == null) isOpen = !this.state.isOpen
    this.setState({isOpen})
  }

  render() {
    return this.props.children(
      this.state.isOpen,
      this.setOpen,
      node => this.node = node
    )
  }
}
