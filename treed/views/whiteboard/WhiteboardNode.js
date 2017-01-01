
import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Body from '../body'

const edgeMargin = 5

const isAtEdge = (x, y, box) => {
  return (
    x - box.left < edgeMargin ||
    y - box.top < edgeMargin ||
    x > box.right - edgeMargin ||
    y > box.bottom - edgeMargin
  )
}

export default class WhiteboardNode extends Component {
  constructor(props) {
    super()
    this._sub = props.store.setupStateListener(
      this,
      store => [
        store.events.node(props.id),
        store.events.nodeView(props.id),
      ],
      store => ({
        node: store.getters.node(props.id),
        isActive: store.getters.isActive(id),
        // isCutting: store.getters.isCutting(id),
        editState: store.getters.editState(id),
      })
    )
    this.state.moving = false
  }

  onMouseMove = (e: any) => {
    if (this.state.moving) return
    if (isAtEdge(e.clientX, e.clientY, this.div.getBoundingClientRect())) {
      this.div.style.cursor = 'move'
    } else {
      this.div.style.cursor = 'default'
    }
  }

  onMouseDown = (e: any) => {
    if (!isAtEdge(e.clientX, e.clientY, this.div.getBoundingClientRect())) {
      return
    }

    e.preventDefault()
    this.setState({
      moving: {dx: 0, dy: 0, ox: e.clientX, oy: e.clientY}
    })
    window.addEventListener('mousemove', this.onDrag, true)
    window.addEventListener('mouseup', this.onMouseUp, true)
  }

  onDrag = (e: any) => {
    this.setState({
      moving: {
        ...this.state.moving,
        dx: e.clientX - this.state.moving.ox,
        dy: e.clientY - this.state.moving.oy,
      }
    })
  }

  stopDragging() {
    window.removeEventListener('mousemove', this.onDrag, true)
    window.removeEventListener('mouseup', this.onMouseUp, true)
  }

  componentWillUnmount() {
    this.stopDragging()
  }

  onMouseUp = () => {
    this.stopDragging()
    // TODO set the thing
    this.setState({
      moving: false,
    })
  }

  render() {
    const settings = this.state.node.views.whiteboard
    const {x, y} = settings || {x: 0, y: 0}
    const {dx, dy} = this.state.moving || {dx: 0, dy: 0}
    return <div
      ref={n => this.div = n}
      className={css(styles.container)}
      onMouseMove={this.onMouseMove}
      onMouseDownCapture={this.onMouseDown}
      style={{
        transform: `translate(${dx}px, ${dy}px)`,
      }}
    >
      <Body
        node={this.state.node}
        // depth={100}
        isActive={this.state.isActive}
        // isCutting={this.state.isCutting}
        editState={this.state.editState}
        actions={this.props.store.actions}
        store={this.props.store}
      />
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'white',
    height: 200,
    width: 200,
    border: '1px solid #ccc',
  },
})

