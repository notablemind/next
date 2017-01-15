
import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Body from '../body'
import trySnapping from './trySnapping'
import calcSnapLines from './calcSnapLines'
import isDomAncestor from '../utils/isDomAncestor'
import Child from './Child'
import Icon from '../utils/Icon'
import * as colors from '../utils/colors'

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

  render() {
    if (!this.state.node) return
    const settings = this.state.node.views.whiteboard
    let {x, y} = this.state.handoff || this.state.moving ||
      this.state.node.views.whiteboard || this.props.defaultPos

    const activityStyles = css(
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
      className={css(styles.container, hideSelected && styles.hide) + ' ' + activityStyles}
      onMouseDownCapture={this.onMouseDown}
      onContextMenu={this.onContextMenu}
      style={{
        transform: `translate(${x + dx}px, ${y + dy}px)`,
        zIndex: this.state.moving ? 10000 : undefined,
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
      {this.state.node.children.length > 0 &&
        (!collapsed ?
          <div
            ref={node => this.childrenNode = node}
            className={css(styles.children)}
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
    </div>
  }
}

const activeStyles = {}
;['active', 'selected', 'editing', 'cutting', 'dragging'].forEach(key => {
  activeStyles[key] =
    // {outline: `2px solid ${colors[key]}`}
    {boxShadow: `
      -2px -2px 0 ${colors[key]},
      -2px 2px 0 ${colors[key]},
      2px -2px 0 ${colors[key]},
      2px 2px 0 ${colors[key]}
    `, borderColor: 'white', }
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

  hide: {
    // visibility: 'hidden',
    opacity: 0,
  },

  activeContainer: {
    zIndex: 100000,
  },

  children: {
    backgroundColor: '#fafafa',
    boxShadow: '0 0 3px #777 inset',
    borderRadius: 5,
    marginTop: 4,
    overflow: 'hidden',
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
    textAlign: 'center',
    fontSize: '80%',
    padding: '5px 10px',
    cursor: 'pointer',
    transition: 'background-color .2s ease',
    ':hover': {
      backgroundColor: '#ccc',
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
})

css(styles.container)
