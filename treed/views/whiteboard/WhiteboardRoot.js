// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import WhiteboardNode from './WhiteboardNode'
import dragger from './dragger'

import trySnapping from './trySnapping'
import calcSnapLines from './calcSnapLines'

const findEnclosingBox = (selected, nodeMap) => {
  let box
  Object.keys(selected).forEach(id => {
    const rect = nodeMap[id].getBoundingClientRect()
    if (!box) {
      box = {
        left: rect.left,
        top: rect.top, right: rect.right, bottom: rect.bottom,
        width: 0,
        height: 0,
      }
    } else {
      box.left = Math.min(box.left, rect.left)
      box.right = Math.min(box.right, rect.right)
      box.top = Math.min(box.top, rect.top)
      box.bottom = Math.min(box.bottom, rect.bottom)
    }
  })
  if (!box) throw new Error('Nothing selected')
  box.width = box.right - box.left
  box.height = box.bottom - box.top
  return box
}

type State = {
  dx: number,
  dy: number,
  node: any,
  root: string,
  defaultPositions: ?Array<any>,
}

export default class WhiteboardRoot extends Component {
  _dragger: any
  _sub: any
  _unsub: () => void
  state: State
  div: any

  constructor(props: any) {
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

    this.calcDefaultPositions()
  }

  componentWillUnmount() {
    this._sub.stop()
    this._unsub()
  }

  componentDidUpdate(prevProps: any, prevState: State) {
    if (prevState.root !== this.state.root) {
      this.calcDefaultPositions()
    }
  }

  calcDefaultPositions() {
    // const root = this.div.offsetParent
    console.log(this.div)
    let top = 0
    let x = 0
    let nextX = 0
    let defaultPositions = []
    this.state.node.children.forEach(id => {
      const box = this.props.nodeMap[id].getBoundingClientRect()
      if (top + box.height > window.innerHeight) {
        console.log(x, top, nextX)
        top = 0
        x = nextX + 5
      }
      defaultPositions.push({
        x: x,
        y: top,
      })
      if (x + box.width > nextX) {
        console.log('wat', box.width, x, box, nextX, id)
      }
      nextX = Math.max(nextX, x + box.width)
      top += box.height + 5
    })
    console.log('positions', defaultPositions)
    this.setState({defaultPositions})
  }

  offsetSelected(dx: number, dy: number) {
    const ids = Object.keys(this.props.store.state.selected)
    const defaultPositions = this.state.defaultPositions || []
    const updates = ids.map(id => this.props.store.db.data[id])
      .map(node => {
        const pos = node.views.whiteboard || defaultPositions[
          this.state.node.children.indexOf(node._id)
        ]
        return {
          views: {
            ...node.views,
            whiteboard: {
              ...node.views.whiteboard,
              x: pos.x + dx,
              y: pos.y + dy,
            },
          },
        }
      })
    this.props.store.actions.updateMany(ids, updates)
    this.props.store.emit('x-selection')
  }

  onMouseDown = (e: any) => {
    if (e.button !== 0) return

    const {store, nodeMap} = this.props
    if (!Object.keys(store.state.selected).length) return

    e.stopPropagation()
    e.preventDefault()

    let box = findEnclosingBox(store.state.selected, nodeMap)
    let snapLines = calcSnapLines(
      store.state.selected,
      nodeMap,
      e.clientX,
      e.clientY,
      box,
    )

    this._dragger = dragger(e, {
      move: (x, y, w, h) => {
        let news = trySnapping(
          x + w,
          y + h,
          box.width,
          box.height,
          snapLines,
        )
        this.setState({
          dx: news.x - x,
          dy: news.y - y,
        })
      },
      done: (x, y, w, h) => {
        let news = trySnapping(
          x + w,
          y + h,
          box.width,
          box.height,
          snapLines,
        )
        this.offsetSelected(
          news.x - x,
          news.y - y
        )
      },
    })
  }

  render() {
    const {dx, dy, defaultPositions} = this.state
    return <div className={css(styles.container)} ref={node => this.div = node}>
      {this.state.node.children.map((child, i) => (
        <WhiteboardNode
          id={child}
          key={child}
          store={this.props.store}
          nodeMap={this.props.nodeMap}
          onSelectedDown={this.onMouseDown}
          showIndicators={this.props.showIndicators}
          dx={dx}
          dy={dy}
          defaultPos={defaultPositions &&
            defaultPositions[i] || {
              x: 0,
              y: i * 100,
            }
          }
        />
      ))}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
  },
})

