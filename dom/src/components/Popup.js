// @flow

import React, {Component} from 'react'

type Props = {}

type State = {isOpen: boolean}
type E = {}

export default class Popup extends Component {
  state: State
  node: any
  constructor() {
    super()
    this.state = {
      isOpen: false,
    }
  }

  componentDidUpdate(prevProps: {}, prevState: State) {
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

  onClose = (e: any) => {
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

  setOpen = (isOpen: boolean) => {
    if (isOpen == null) isOpen = !this.state.isOpen
    this.setState({isOpen})
  }

  render() {
    return this.props.children(
      this.state.isOpen,
      this.setOpen,
      node => (this.node = node),
    )
  }
}
