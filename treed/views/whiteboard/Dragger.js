
import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'


export default class Dragger extends Component {
  props: {
    onDragStart?: () => void,
    onDrag: (x: number, y: number) => void,
    onDone: () => void,
    x: number,
    y: number,
  }

  onMouseDown = (e: any) => {
    e.preventDefault()
    if (this.props.onDragStart) {
      this.props.onDragStart()
    }
    window.addEventListener('mousemove', this.onMouseMove, true)
    window.addEventListener('mouseup', this.onMouseUp, true)
    this._sx = e.clientX - this.props.x
    this._sy = e.clientY - this.props.y
  }

  onMouseMove = (e: any) => {
    e.preventDefault()
    const dx = e.clientX - this._sx
    const dy = e.clientY - this._sy
    this.props.onDrag(dx, dy)
  }

  onMouseUp = (e: any) => {
    e.preventDefault()
    const dx = e.clientX - this._sx
    const dy = e.clientY - this._sy
    this.props.onDrag(dx, dy)
    this.stopDragging()
  }

  stopDragging() {
    window.removeEventListener('mousemove', this.onMouseMove, true)
    window.removeEventListener('mouseup', this.onMouseUp, true)
  }

  componentWillUnmount() {
    this.stopDragging()
  }

  render() {
    return <div
      onMouseDown={this.onMouseDown}
      className={css(styles.dragger)}
    />
  }
}

const styles = StyleSheet.create({
  dragger: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: 'white',
    // cursor: 'move',
  },
})
