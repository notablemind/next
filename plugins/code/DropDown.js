
import React, {Component} from 'react';

const isAncestor = (parent, child) => {
  while (child !== parent && child.parentNode && child.parentNode !== document && child.parentNode !== document.body) {
    child = child.parentNode
  }
  return child === parent
}

export default class DropDown extends Component {
  constructor() {
    super()
    this.state = {open: false}
  }

  componentDidUpdate(_, prevState) {
    if (prevState.open && !this.state.open) {
      window.removeEventListener('mousedown', this.onMouseDown, true)
    } else if (!prevState.open && this.state.open) {
      window.addEventListener('mousedown', this.onMouseDown, true)
    }
  }

  componentWillUnmount() {
    window.removeEventListener('mousedown', this.onMouseDown, true)
  }

  toggleOpen = () => {
    this.setState(state => ({open: !state.open}))
  }

  onMouseDown = e => {
    if (isAncestor(this.container, e.target)) {
      return
    } else {
      e.stopPropagation()
      e.preventDefault()
      this.toggleOpen()
    }
  }

  render() {
    return <div onMouseDown={e => e.stopPropagation()} ref={node => this.container = node} className={this.props.className}>
      {this.props.head(this.toggleOpen)}
      {this.state.open && this.props.body(this.toggleOpen)}
    </div>
  }
}

