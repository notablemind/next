
import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Body from '../body'
import trySnapping from './trySnapping'
import calcSnapLines from './calcSnapLines'
import isDomAncestor from '../utils/isDomAncestor'
import Child from './Child'
import Icon from '../utils/Icon'
import * as colors from '../utils/colors'
import dragger from './dragger'

const roundBy = (n, by) => parseInt(n / by) * by

export const WhiteboardNodeRendered = ({
  id,
  node,
  nodeMap,
  store,
}) => {
  return <div
    ref={n => n && (nodeMap[id] = n)}
    className={css(styles.container, styles.inline)}
  >
    <Body
      // depth={100}
      node={node}
      actions={store.actions}
      // setChildDrop={setChildDrop}
      // releaseChildDrop={releaseChildDrop}
      editState={false}
      keyActions={null}
      store={store}
    />
  </div>
}

export default class WhiteboardNode extends Component {
  keyActions: any

  constructor({store, id}: any) {
    super()
    this._sub = store.setupStateListener(
      this,
      store => [
        store.events.node(id),
        store.events.nodeView(id),
      ],
      store => ({
        node: store.getters.node(id),
        isActive: store.getters.isActive(id),
        isSelected: store.state.selected &&
          store.state.selected[id],
        // isCutting: store.getters.isCutting(id),
        editState: store.getters.editState(id),
        handoff: null,
        height: (store.getters.nodeViewData(id) || {}).height,
      })
    )
    this.state.moving = false

    this.keyActions = {
      setContent: text => store.actions.setContent(id, text),
      onEnter: this.createAfter,
      onUp: () => null,
      onDown: () => null,
      onLeft: () => null,
      onRight: () => null,
      onTab: null,
    }
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
    delete this.props.nodeMap[this.props.id]
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState !== this.state ||
      (!!this.state.isSelected && (
        nextProps.dx !== this.props.dx ||
        nextProps.dy !== this.props.dy ||
        nextProps.hideSelected !== this.props.hideSelected)) ||
      nextProps.defaultPos !== this.props.defaultPos
  }

  createAfter = text => {
    console.log('want to create')
    const myData = this.state.node.views.whiteboard
    const viewData = myData ? {
      x: myData.x,
      y: myData.y + this.div.offsetHeight + 5, // TODO avoid obstacles
    } : null
    let nid = this.props.store.actions.createAfter(this.props.id, text, viewData)
    if (nid) {
      this.props.store.actions.setActive(nid)
    }
  }

  onContextMenu = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    this.props.store.actions.openContextMenuForNode(
      this.props.id, e.clientX, e.clientY)
  }

  onMouseDown = (e: any) => {
    if (e.target === this._heightDragger) return
    if (this.childrenNode && isDomAncestor(e.target, this.childrenNode)) return
    if (e.metaKey) {
      this.props.store.actions.rebase(this.props.id)
      e.preventDefault()
      e.stopPropagation()
      const children = this.state.node.children
      const nid = children.length ? children[0] : this.props.id
      this.props.store.actions.setActive(nid)
      return
    }
    if (this.state.isActive && this.state.editState) return
    // if (this.state.isSelected) return this.props.onSelectedDown(this.props.id, e)
    if (e.shiftKey) {
      this.props.store.actions.selectLimitingToSiblings(this.props.id)
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (e.button !== 0) return
    this.props.onSelectedDown(this.props.id, e)
  }

  startResizingHeight = (e: any) => {
    if (e.button === 2) {
      this.props.store.actions.setNodeViewData(this.props.id, 'whiteboard', {
        ...this.props.store.getters.nodeViewData(this.props.id),
        height: null,
      })
      return
    }
    let moved = false
    let oheight
    this._dragger = dragger(e, {
      move: (x, y, w, h) => {
        if (!moved) {
          if (Math.abs(h) < 5) return
          moved = true
          oheight = this.state.height || this.div.offsetHeight
        }
        this.setState({
          height: roundBy(oheight + h, 20),
        })
      },

      done: (x, y, w, h) => {
        this.props.store.actions.setNodeViewData(this.props.id, 'whiteboard', {
          ...this.props.store.getters.nodeViewData(this.props.id),
          height: roundBy(oheight + h, 20),
        })
        // this.setState({height: null})
      },
    })
  }

  collapseChildren = evt => {
    evt.preventDefault()
    evt.stopPropagation()
    this.props.store.actions.setNested(
      this.props.id,
      ['views', 'whiteboard', 'collapsed'],
      true
    )
    this.props.store.actions.setActive(this.props.id)
  }

  expandChildren = evt => {
    evt.preventDefault()
    evt.stopPropagation()
    this.props.store.actions.setNested(
      this.props.id,
      ['views', 'whiteboard', 'collapsed'],
      false
    )
    this.props.store.actions.setActive(this.props.id)
  }

  onWheel = (evt: any) => {
    if (!this.state.height) return
    return evt.stopPropagation()
    if (!evt.deltaX) {
      if (evt.deltaY < 0) {
        if (this.childrenNode.scrollTop > 0) {
          evt.stopPropagation()
          return
        }
      } else {
        if (this.childrenNode.scrollTop < this.childrenNode.scrollHeight - this.childrenNode.offsetHeight) {
          evt.stopPropagation()
          return
        }
      }
    }
  }

  render() {
    if (!this.state.node) return
    const settings = this.state.node.views.whiteboard
    let {x, y} = this.state.handoff || this.state.moving ||
      this.state.node.views.whiteboard || this.props.defaultPos

    const {inline} = this.props
    const activityStyles = inline ? '' : css(
      // styles.contentWrapper,
      this.state.isActive && styles.active,
      this.state.isSelected && styles.selected,
      this.state.isCutting && styles.cutting,
      this.state.isDragging && styles.dragging,
      this.state.editState && styles.editing,
    )

    const collapsed = (this.state.node.views.whiteboard || {}).collapsed
    if (!x) x = 0
    if (!y) y = 0
    const {dx, dy, hideSelected} = (this.state.isSelected ? this.props : {dx: 0, dy: 0, hideSelected: false})
    return <div
      ref={n => n && (this.div = this.props.nodeMap[this.props.id] = n)}
      className={css(styles.container, hideSelected && styles.hide, inline && styles.inline) + ' ' + activityStyles}
      onMouseDownCapture={this.onMouseDown}
      onContextMenu={this.onContextMenu}
      style={{
        transform: inline ? '' : `translate(${x + dx}px, ${y + dy}px)`,
        zIndex: this.state.moving ? 10000 : undefined,
        height: this.state.height,
      }}
    >
      <Body
        // depth={100}
        node={this.state.node}
        actions={this.props.store.actions}
        editState={this.state.editState}
        setChildDrop={this.props.setChildDrop}
        releaseChildDrop={this.props.releaseChildDrop}
        keyActions={this.keyActions}
        store={this.props.store}
      />
      {(this.state.node.children.length > 0 || this.state.height) &&
        (!collapsed ?
          <div
            className={css(styles.children)}
            ref={node => this.childrenNode = node}
          >
            <div
              onWheel={this.onWheel}
              className={css(this.state.height ? styles.fixedChildren : null)}
              style={{flex: 1}}
            >
            {this.state.node.children.map(child => (
              <Child
                id={child}
                key={child}
                store={this.props.store}
                nodeMap={this.props.nodeMap}
                startChildDragging={this.props.startChildDragging}
              />
            ))}
            </div>
            <div
              onMouseDown={() => this.props.store.actions.createLastChild(this.props.id)}
              className={css(styles.addChild)}>
              Add child
            </div>
            <Icon
              name="arrow-shrink"
              className={css(styles.collapser)}
              onClick={this.collapseChildren}
            />
          </div> :
          <div
            onClick={this.expandChildren}
            className={css(styles.kidBadge)}
            ref={node => this.childrenNode = node}
          >
            {this.state.node.children.length}
          </div>)}
      <div
        ref={node => this._heightDragger = node}
        className={css(styles.heightDragger)}
        onMouseDown={this.startResizingHeight}
        onContextMenu={e => (e.preventDefault(), e.stopPropagation())}
      />
    </div>
  }
}

const activeStyles = {}
;['active', 'selected', 'editing', 'cutting', 'dragging'].forEach(key => {
  activeStyles[key] =
    {outline: `2px solid ${colors[key]}`}
    /*{boxShadow: `
      -2px -2px 0 ${colors[key]},
      -2px 2px 0 ${colors[key]},
      2px -2px 0 ${colors[key]},
      2px 2px 0 ${colors[key]}
    `, borderColor: 'white', }*/
})
activeStyles.dragging.backgroundColor = colors.draggingBackground
activeStyles.selected.zIndex = 1000
// activeStyles.active.borderColor = 'white'

const styles = StyleSheet.create({
  ...activeStyles,

  container: {
    borderRadius: 2,
    position: 'absolute',
    backgroundColor: 'white',
    border: '1px solid #ccc',
    cursor: 'move',
    padding: 10,
    width: 200,
    transition: 'opacity .3s ease',
    opacity: 1,
  },

  inline: {
    position: 'relative',
    top: 0,
    left: 0,
    marginBottom: 5,
  },

  fixedChildren: {
    flex: 1,
    overflow: 'auto',
  },

  hide: {
    // visibility: 'hidden',
    opacity: 0,
  },

  activeContainer: {
    zIndex: 100000,
  },

  children: {
    flex: 1,
    backgroundColor: '#fafafa',
    boxShadow: '0 0 2px #777 inset',
    borderRadius: 5,
    marginTop: 4,
    overflow: 'hidden',
    cursor: 'default',
  },

  kidBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    padding: '2px 4px',
    borderRadius: 10,
    fontSize: 10,
    color: '#aaa',
    zIndex: 10,
    cursor: 'pointer',
    transition: 'background-color .2s ease',
    ':hover': {
      backgroundColor: '#eee',
    },
  },

  addChild: {
    color: '#999',
    textAlign: 'center',
    fontSize: '80%',
    padding: '5px 10px',
    cursor: 'pointer',
    transition: 'background-color .2s ease',
    ':hover': {
      backgroundColor: '#ddd',
      color: 'black',
    },
    // backgroundColor: 'white',
  },

  collapser: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 25,
    height: 25,
    fontSize: 15,
    textAlign: 'center',
    justifyContent: 'center',
    color: '#aaa',
    transition: 'background-color .2s ease',
    cursor: 'pointer',
    ':hover': {
      color: 'black',
    },
  },

  heightDragger: {
    cursor: 'ns-resize',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 5,
    transition: 'background-color .2s ease',
    ':hover': {
      backgroundColor: '#aaa',
    },
  },
})

css(styles.container)
