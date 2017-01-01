
import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Body from '../body'

// const edgeMargin = 5
const gridSize = 20

/*
const isAtEdge = (x, y, box) => {
  return (
    x - box.left < edgeMargin ||
    y - box.top < edgeMargin ||
    x > box.right - edgeMargin ||
    y > box.bottom - edgeMargin
  )
}
*/

const grid = (n, by) => Math.floor(n / by) * by

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
        isActive: store.getters.isActive(props.id),
        // isCutting: store.getters.isCutting(props.id),
        editState: store.getters.editState(props.id),
        handoff: null,
      })
    )
    this.state.moving = false
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this.stopDragging()
    this._sub.stop()
  }

  /*
  onMouseMove = (e: any) => {
    if (this.state.moving) return
    if (isAtEdge(e.clientX, e.clientY, this.div.getBoundingClientRect())) {
      this.div.style.cursor = 'move'
    } else {
      this.div.style.cursor = 'default'
    }
  }
  */

  onMouseDown = (e: any) => {
    if (e.button !== 0) return
    /*
    if (!isAtEdge(e.clientX, e.clientY, this.div.getBoundingClientRect())) {
      return
    }
    */

    e.stopPropagation()
    e.preventDefault()
    this.setState({
      moving: {dx: 0, dy: 0, ox: e.clientX, oy: e.clientY, moved: false}
    })
    window.addEventListener('mousemove', this.onDrag, true)
    window.addEventListener('mouseup', this.onMouseUp, true)
  }

  onDrag = (e: any) => {
    const dx = grid(e.clientX - this.state.moving.ox, gridSize)
    const dy = grid(e.clientY - this.state.moving.oy, gridSize)
    this.setState({
      moving: {
        ...this.state.moving,
        moved: this.state.moving.moved || (dx !== 0 || dy !== 0),
        dx,
        dy,
      }
    })
  }

  stopDragging() {
    window.removeEventListener('mousemove', this.onDrag, true)
    window.removeEventListener('mouseup', this.onMouseUp, true)
  }

  onContextMenu = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    this.props.store.actions.openContextMenuForNode(this.props.id, e.clientX, e.clientY)
  }

  onMouseUp = () => {
    if (!this.state.moving) return
    if (!this.state.moving.moved) {
      this.props.store.actions.edit(this.props.id)
      this.stopDragging()
      this.setState({
        moving: false,
      })
      return
    }
    console.log('mouseup', this.props.id)
    this.stopDragging()
    let {x, y} = this.state.node.views.whiteboard || {x: 0, y: 0}
    if (!x) x = 0
    if (!y) y = 0
    let {dx, dy} = this.state.moving
    dx = grid(dx, gridSize)
    dy = grid(dy, gridSize)
    if (dx !== 0 || dy !== 0) {
      x += dx
      y += dy
      this.props.store.actions.setNodeViewData(
        this.props.id,
        'whiteboard',
        {...this.state.node.views.whiteboard, x, y}
      )
    }

    this.setState({
      moving: false,
      handoff: {dx, dy},
    })
  }

  render() {
    const settings = this.state.node.views.whiteboard
    let {x, y} = settings || {x: 0, y: 0}
    if (!x) x = 0
    if (!y) y = 0
    const {dx, dy} = this.state.handoff || this.state.moving || {dx: 0, dy: 0}
    return <div
      ref={n => this.div = n}
      className={css(styles.container)}
      // onMouseMove={this.onMouseMove}
      onMouseDownCapture={this.onMouseDown}
      onContextMenu={this.onContextMenu}
      style={{
        transform: `translate(${x + dx}px, ${y + dy}px)`,
        zIndex: this.state.moving ? 10000 : undefined,
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
    borderRadius: 2,
    position: 'absolute',
    backgroundColor: 'white',
    padding: 10,
    // minHeight: 100,
    width: 200,
    border: '1px solid #ccc',
    cursor: 'move',
  },
})

