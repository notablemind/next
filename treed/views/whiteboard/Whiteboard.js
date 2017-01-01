// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import ContextMenu from '../context-menu/ContextMenu'
import WhiteboardRoot from './WhiteboardRoot'

type Props = {
  store: any,
}
type State = {
  x: number,
  y: number,
  zoom: number,
  contextMenu: any,
  root: string,
  mode: string,
}

const dragger = (e, fns) => {
  e.preventDefault()
  e.stopPropagation()
  const ox = e.clientX
  const oy = e.clientY
  const move = e => {
    e.preventDefault()
    e.stopPropagation()
    fns.move(ox, oy, e.clientX - ox, e.clientY - oy)
  }
  const stop = e => {
    fns.done(ox, oy, e.clientX - ox, e.clientY - oy)
    cleanup()
  }
  const cleanup = () => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', stop)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', stop)

  return cleanup
}

export default class Whiteboard extends Component {
  props: Props
  state: State
  _sub: any
  _dragger: any
  constructor(props: Props) {
    super()
    this._sub = props.store.setupStateListener(
      this,
      store => [
        store.events.root(),
        store.events.mode(),
        store.events.activeView(),
        store.events.contextMenu(),
      ],
      store => ({
        root: store.getters.root(),
        mode: store.getters.mode(),
        isActiveView: store.getters.isActiveView(),
        contextMenu: store.getters.contextMenu(),
      }),
    )
    this.state.x = 0
    this.state.y = 0
    this.state.zoom = 1
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
    if (this._dragger) this._dragger()
  }

  onDragDone() {
    // TODO maybe save it or something?
  }

  onMouseDown = e => {
    if (e.button === 0 && e.metaKey) {
      e.preventDefault()
      e.stopPropagation()
      const {x, y} = this.state
      this._dragger = dragger(e, {
        move: (a, b, w, h) => {
          this.setState({
            x: x + w,
            y: y + h,
          })
        },
        done: (x, y, w, h) => {
          this.onDragDone()
        },
      })
    } else if (e.button === 0) {
      let moved = false
      this._dragger = dragger(e, {
        move: (x, y, w, h) => {
          if (!moved && Math.abs(w) > 5 && Math.abs(h) > 5) {
            moved = true
          }
          if (moved) {
            this.setState({
              selectBox: {x, y, w, h},
            })
          }
        },
        done: (x, y, w, h) => {
          if (!moved) {
            this.props.store.actions.setActive(this.props.store.state.root)
          }
          this.setState({selectBox: null})
        },
      })
    }
  }

  render() {
    const {x, y, zoom} = this.state
    // TODO zoom?
    return <div className={css(styles.container)}>
      <div
        onMouseDown={this.onMouseDown}
        className={css(styles.relative)}
      >
        <div className={css(styles.status)}>
          {x}:{y}:: {zoom}
        </div>
        <div
          className={css(styles.offset)}
          style={{
            transform: `translate(${x}px, ${y}px)`,
          }}
        >
          <WhiteboardRoot
            store={this.props.store}
          />
        </div>
      </div>
      {this.state.selectBox &&
        <div
          className={css(styles.selectBox)}
          style={{
            top: this.state.selectBox.y,
            left: this.state.selectBox.x,
            height: this.state.selectBox.h,
            width: this.state.selectBox.w,
          }}
        />}

      {this.state.contextMenu &&
        <ContextMenu
          pos={this.state.contextMenu.pos}
          menu={this.state.contextMenu.menu}
          onClose={this.props.store.actions.closeContextMenu}
        />}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },

  selectBox: {
    outline: '5px solid blue',
    position: 'absolute',
  },

  relative: {
    position: 'relative',
    flex: 1,
  },

  offset: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  status: {
    position: 'absolute',
  },

})

