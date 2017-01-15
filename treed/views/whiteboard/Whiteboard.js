// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import ContextMenu from '../context-menu/ContextMenu'
import WhiteboardRoot from './WhiteboardRoot'

import dragger from './dragger'
import selectBoxes from './selectBoxes'
import snapIndicators from './snapIndicators'
import * as colors from '../utils/colors'

const calcChildBoxes = (me, nodes, root, nodeMap) => {
  return nodes[root].children.map(id => {
    const box = nodeMap[id].getBoundingClientRect()
    let childIds = nodes[id].children
    const children = (childIds.length && !(nodes[id].views.whiteboard && nodes[id].views.whiteboard.collapsed)) ?
      nodes[id].children.map(
        id => nodeMap[id].getBoundingClientRect().top
      ).concat([box.bottom - 13 - 25])
      : [box.bottom - 10]
    return {
      id,
      top: box.top,
      left: box.left,
      right: box.right,
      bottom: box.bottom,
      children,
    }
  })
}

const calcChildInsertPos = (pid, oidx, boxes, x, y) => {
  for (let box of boxes) {
    if (box.left <= x && x <= box.right &&
        box.top <= y && y <= box.bottom) {
      let idx = 0
      for (;idx < box.children.length; idx++) {
        if (idx === box.children.length - 1) break
        if ((box.children[idx + 1] + box.children[idx]) / 2 >= y) {
          break
        }
      }
      const top = box.children[idx]
      if (pid === box.id && idx > oidx) {
        idx -= 1
      }
      return {
        insertPos: {idx, pid: box.id},
        indicator: {
          left: box.left + 15,
          width: (box.right - box.left) - 30,
          // right: box.right - 5,
          top,
        },
      }
    }
  }
  return {insertPos: null, indicator: null}
}

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
  selectBox: any,
  childDrag: ?{
    pos: {x: number, y: number},
    insertPos: any,
    indicator: ?{top: number, left: number, width: number},

  },
}

export default class Whiteboard extends Component {
  props: Props
  state: State
  nodeMap: any
  relative: any
  _sub: any
  _dragger: any
  _indicators: any
  _childDragger: any
  constructor(props: Props) {
    super()
    props.store.state.nodeMap = {}
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
    this._indicators = snapIndicators(this.relative)
  }

  componentWillUnmount() {
    this._sub.stop()
    this._indicators.destroy()
    if (this._dragger) this._dragger()
    if (this._childDragger) this._childDragger()
  }

  onWheel = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    this.setState({
      x: this.state.x - e.deltaX,
      y: this.state.y - e.deltaY,
    })
  }

  onDragDone() {
    // TODO maybe save it or something?
  }

  onMouseDown = (e: any) => {
    if (e.target !== this.relative) return
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
      this.setupSelector(e)
      this.clearSelection()
    }
  }

  startChildDragging = (evt: any, id: string) => {
    let moved = false
    const childBoxes = calcChildBoxes(
      id,
      this.props.store.db.data,
      this.props.store.state.root,
      this.props.store.state.nodeMap,
    )
    const pid = this.props.store.db.data[id].parent
    const oidx = this.props.store.db.data[pid].children.indexOf(id)

    this._childDragger = dragger(evt, {
      move: (x, y, w, h) => {
        if (!moved) {
          if (Math.abs(w) > 5 || Math.abs(h) > 5) {
            moved = true
            this.props.store.actions.setActive(id)
            this.props.store.actions.setMode('dragging')
          } else {
            return
          }
        }
        const {insertPos, indicator} = calcChildInsertPos(pid, oidx, childBoxes, x + w, y + h)
        this.setState({
          childDrag: {
            pos: {x: x + w, y: y + h},
            insertPos,
            indicator,
          },
        })
      },

      done: (x, y, w, h) => {
        if (!moved) {
          this.props.store.actions.edit(id)
          return
        }
        this.props.store.actions.normalMode()
        const {childDrag} = this.state
        if (!childDrag) return
        if (childDrag.insertPos) {
          const {pid, idx} = childDrag.insertPos
          this.props.store.actions.move(
            id,
            pid,
            idx,
            false
          )
          console.log(childDrag)
          // TODO move the child into the place
          this.setState({
            childDrag: null,
          })
        }
      },
    })
  }

  onDblClick = (e: any) => {
    if (e.target !== this.relative) return
    const box = this.relative.getBoundingClientRect()
    const x = e.clientX - box.left + this.state.x
    const y = e.clientY - box.top + this.state.y
    console.warn('TODO create a new node')
    const viewData = { x, y }
    let nid = this.props.store.actions.createLastChild(this.state.root, '', viewData)
    if (nid) {
      this.props.store.actions.edit(nid)
    }
  }

  setupSelector(e: any) {
    let moved = false
    let boxes = []
    this.props.store.db.data[this.props.store.state.root].children.forEach(id => {
      boxes.push([id, this.props.store.state.nodeMap[id].getBoundingClientRect()])
    })

    this._dragger = dragger(e, {
      move: (x, y, w, h) => {
        if (!moved && Math.abs(w) > 5 && Math.abs(h) > 5) {
          moved = true
        }
        if (moved) {
          this.setState({
            selectBox: {x, y, w, h},
          })
          const ids = selectBoxes(x, y, w, h, boxes)
          if (ids.length) {
            this.props.store.actions.setSelection(ids)
          }
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

  clearSelection() {
    if (!this.props.store.state.selected) return
    const events = []
    for (let id in this.props.store.state.selected) {
      events.push(this.props.store.events.nodeView(id))
    }
    this.props.store.state.selected = null
    this.props.store.emitMany(events)
    // this.props.store.actions.normalMode()
  }

  onContextMenu = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    this.props.store.actions.openGeneralContextMenu(e.clientX, e.clientY)
  }

  renderSelectBox() {
    let {x, y, w, h} = this.state.selectBox
    if (w < 0) {
      x += w
      w *= -1
    }
    if (h < 0) {
      y += h
      h *= -1
    }
    return <div
      className={css(styles.selectBox)}
      style={{
        top: y,
        left: x,
        height: h,
        width: w,
      }}
    />
  }

  renderChildDrag() {
    if (!this.state.childDrag) return null
    const {pos, indicator} = this.state.childDrag
    return <div>
      {indicator &&
        <div style={{
          top: indicator.top,
          left: indicator.left,
          width: indicator.width,
        }} className={css(styles.childDragIndicator)} />}
      <div style={{
        top: pos.y,
        left: pos.x,
      }} className={css(styles.childDragCircle)}>
        1
      </div>
    </div>
  }

  showIndicators = (x: number, y: number, relative: bool) => {
    if (relative) {
      const box = this.relative.getBoundingClientRect()
      this._indicators.set(
        x !== null ? x - box.left : null,
        y !== null ? y - box.top : null,
      )
    } else {
      // this._indicators.set(x, y)
      this._indicators.set(
        x !== null ? x + this.state.x : null,
        y !== null ? y + this.state.y: null,
      )
    }
    /*
    if (this._indicators) {
      this._indicators.destroy()
      this._indicators = null
    }
    */
  }

  render() {
    const {x, y, zoom} = this.state
    // TODO zoom?
    return <div className={css(styles.container)}>
      <div
        onMouseDown={this.onMouseDown}
        onDoubleClick={this.onDblClick}
        onContextMenu={this.onContextMenu}
        onWheel={this.onWheel}
        className={css(styles.relative)}
        ref={rel => this.relative = rel}
      >
        {/*<div className={css(styles.status)}>
          {x}:{y}:: {zoom}
        </div>*/}
        <div
          className={css(styles.offset)}
          style={{
            transform: `translate(${x}px, ${y}px)`,
          }}
        >
          <WhiteboardRoot
            store={this.props.store}
            nodeMap={this.props.store.state.nodeMap}
            showIndicators={this.showIndicators}
            startChildDragging={this.startChildDragging}
          />
        </div>
      </div>
      {this.state.selectBox &&
        this.renderSelectBox()}

      {this.renderChildDrag()}

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
    outline: `3px solid ${colors.selected}`,
    position: 'absolute',
    pointerEvents: 'none',
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

  childDragCircle: {
    position: 'absolute',
    width: 20,
    height: 20,
    marginLeft: 5,
    marginTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7fa',
    borderRadius: '50%',
  },

  childDragIndicator: {
    height: 5,
    backgroundColor: '#555',
    opacity: .2,
    borderRadius: 5,
    position: 'absolute',
    marginTop: -2,
  },

})

