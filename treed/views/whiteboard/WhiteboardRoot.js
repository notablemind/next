
import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import WhiteboardNode from './WhiteboardNode'
import dragger from './dragger'

export default class WhiteboardRoot extends Component {
  constructor(props) {
    super()
    this._sub = props.store.setupStateListener(
      this,
      store => [
        store.events.root(),
        store.events.node(store.getters.root())
      ],
      store => ({
        root: store.getters.root(),
        node: store.getters.node(store.getters.root()),
      }),
      store => store.getters.root() !== this.state.root,
    )
    this._unsub = props.store.on(['x-selection'], () => {
      this.setState({
        dx: 0,
        dy: 0,
      })
    })
    this.state.dx = 0
    this.state.dy = 0
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  offsetSelected(dx, dy) {
    const ids = Object.keys(this.props.store.state.selected)
    const updates = ids.map(id => this.props.store.db.data[id])
      .map(node => ({
        views: {
          ...node.views,
          whiteboard: {
            ...node.views.whiteboard,
            x: node.views.whiteboard.x + dx,
            y: node.views.whiteboard.y + dy,
          },
        },
      }))
    this.props.store.actions.updateMany(ids, updates)
    this.props.store.emit('x-selection')
  }

  onMouseDown = (e: any) => {
    if (e.button !== 0) return

    e.stopPropagation()
    e.preventDefault()

    this._dragger = dragger(e, {
      move: (x, y, w, h) => {
        this.setState({
          dx: w,
          dy: h,
        })
      },
      done: (x, y, w, h) => {
        this.offsetSelected(w, h)
        /*
        this.setState({
          dx: 0,
          dy: 0,
        })
        */
      },
    })
  }

  render() {
    const {dx, dy} = this.state
    return <div className={css(styles.container)}>
      {this.state.node.children.map(child => (
        <WhiteboardNode
          id={child}
          key={child}
          store={this.props.store}
          nodeMap={this.props.nodeMap}
          onSelectedDown={this.onMouseDown}
          dx={dx}
          dy={dy}
        />
      ))}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
  },
})

