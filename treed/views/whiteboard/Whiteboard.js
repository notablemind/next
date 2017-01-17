// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import ContextMenu from '../context-menu/ContextMenu'
import WhiteboardRoot from './WhiteboardRoot'

import dragger from './dragger'
import selectBoxes from './selectBoxes'
import snapIndicators from './snapIndicators'
import * as colors from '../utils/colors'

import calcChildBoxes from './calcChildBoxes'
import calcChildInsertPos from './calcChildInsertPos'

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
    moveCount: number,
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
      if (!e.shiftKey) {
        this.clearSelection()
      }
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
    // const oidx = this.props.store.db.data[pid].children.indexOf(id)
    let moveCount = 1
    let wasSelected = true

    this._childDragger = dragger(evt, {
      move: (x, y, w, h) => {
        let selected = this.props.store.state.selected
        if (!moved) {
          if (Math.abs(w) > 5 || Math.abs(h) > 5) {
            moved = true
            this.props.store.actions.setActive(id)
            if (!selected || !selected[id]) {
              wasSelected = false
              this.props.store.actions.selectWithSiblings(id)
              selected = this.props.store.state.selected
            }
            moveCount = Object.keys(selected).length
            this.props.store.actions.setMode('dragging')
          } else {
            return
          }
        }
        const {insertPos, indicator} = calcChildInsertPos(childBoxes, x + w, y + h)
        this.setState({
          childDrag: {
            pos: {x: x + w, y: y + h},
            insertPos,
            indicator,
            moveCount,
          },
        })
      },

      done: (x, y, w, h) => {
        if (!moved) {
          this.props.store.actions.edit(id)
          return
        }
        const {childDrag} = this.state
        if (!childDrag) {
          return
        }

        if (childDrag.insertPos) {
          const {pid, idx} = childDrag.insertPos
          this.props.store.actions.moveSelected(
            pid,
            idx,
          )
          this.setState({
            childDrag: null,
          })
        } else {
          const {x, y} = childDrag.pos
          this.props.store.actions.moveSelected(
            this.state.root,
            -1,
          )
          // TODO set their positions to make sense
          console.log(childDrag.pos)
          this.setState({
            childDrag: null,
          })
        }

        if (!wasSelected) {
          this.props.store.actions.normalMode()
        } else {
          this.props.store.actions.setMode('visual')
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
    const adding = e.shiftKey
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
            this.props.store.actions.setSelection(ids, adding)
          }
        }
      },
      done: (x, y, w, h) => {
        if (!moved) {
          this.props.store.actions.normalMode()
          // this.props.store.actions.setActive(this.props.store.state.root)
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
    const {pos, indicator, moveCount} = this.state.childDrag
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
      {moveCount}
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
            setChildDrag={childDrag => this.setState({childDrag})}
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
    fontSize: '80%',
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

