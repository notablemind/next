
import React, {Component} from 'react'
import ensureInView from './ensureInView'

export default class EnsureInView extends Component {
  node: any
  componentDidMount() {
    if (this.props.active) {
      ensureInView(this.node, true, this.props.scrollMargin || 50)
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.active && this.props.active) {
      ensureInView(this.node, true, this.props.scrollMargin || 50)
    }
  }
  
  render() {
    const {active, scrollMargin, ...props} = this.props
    return <div {...props} ref={node => this.node = node} />
  }
}
