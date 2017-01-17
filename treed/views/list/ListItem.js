// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Body from '../body'
import ensureInView from '../../ensureInView'
import * as colors from '../utils/colors'

const isAtEdge = (box, x, y) => {
  return (
    x - box.left < 5 ||
    y - box.top < 5 ||
    x > box.right - 5 ||
    y > box.bottom - 5
  )
}

export default class ListItem extends Component {
  _sub: any
  _div: any
  state: any
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
        activeIsJump: store.state.activeIsJump,
        isCutting: store.getters.isCutting(id),
        isDragging: store.getters.isDragging(id),
        isCollapsed: store.getters.isCollapsed(id),
        editState: store.getters.editState(id),
      }),
    )

    this.keyActions = {
      onTab: shiftKey => {
        if (shiftKey) {
          store.actions.makeParentsNextSibling()
        } else {
          store.actions.makePrevSiblingsLastChild()
        }
      },
      onEnter: text => {
        const nid = store.actions.createAfter(id, text)
        if (nid) {
          store.actions.editStart(nid)
        }
      },
      onLeft: () => store.actions.focusPrev(id, 'end'),
      onRight: () => store.actions.focusNext(id, 'start'),
      onUp: store.actions.focusPrev,
      onDown: store.actions.focusNext,

      setContent: text => store.actions.setContent(id, text),
    }
  }

  shouldComponentUpdate(nextProps: any, nextState: any) {
    return nextState !== this.state
  }

  componentDidMount() {
    this._sub.start(this)
    if (this.state.isActive && this._div) {
      this.ensureInView()
    }
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  componentDidUpdate(_: any, prevState: any) {
    if (!prevState.isActive && this.state.isActive && this._div) {
      this.ensureInView()
    }
  }

  ensureInView = () => {
    ensureInView(this._div, this.state.activeIsJump, 100)
  }

  onMouseMove = (e: any) => {
    if (!this.state.isActive || this.state.isDragging) return
    if (this.props.store.state.root === this.props.id) return
    const box = this._div.getBoundingClientRect()
    const atEdge = isAtEdge(box, e.clientX, e.clientY)
    const deff = this.state.editState ? 'text' : 'default'
    this._div.style.setProperty('cursor', atEdge ? 'move' : deff, 'important')
  }

  onMouseDown = (e: any) => {
    if (e.button !== 0) return e.preventDefault()
    if (!this.state.isActive) return
    if (this.props.store.state.root === this.props.id) return
    const box = this._div.getBoundingClientRect()
    const atEdge = isAtEdge(box, e.clientX, e.clientY)
    if (!atEdge) {
      return
    }
    e.preventDefault()
    e.stopPropagation()
    this.props.store.actions.startDragging(this.props.id)
  }

  onContextMenu = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    this.props.store.actions.openContextMenuForNode(this.props.id, e.clientX, e.clientY)
  }

  render() {
    if (!this.state.node) {
      return <div>loading...</div>
    }

    const collapsed = this.state.isCollapsed
    const isRoot = this.props.store.state.root === this.props.id
    const contentClassName = css(
      styles.contentWrapper,
      this.state.isActive && styles.active,
      this.state.isSelected && styles.selected,
      this.state.isCutting && styles.cutting,
      this.state.isDragging && styles.dragging,
      this.state.editState && styles.editing,
    )

    return <div className={css(styles.container) + ` Node_item Node_level_${this.props.depth}` + (isRoot ? ' Node_root' : '')}>
      <div
        className={css(
          styles.top,
          !this.state.editState && styles.topNormal
        ) + ' Node_top'}
        onMouseMove={this.onMouseMove}
        onMouseDownCapture={this.onMouseDown}
        onContextMenu={this.onContextMenu}
        ref={node => {
          this._div = node
          this.props.nodeMap[this.props.id] = node
        }}
      >
        {!isRoot && this.state.node.children.length > 0 &&
          <div
            className={css(styles.collapser,
                          collapsed && styles.collapsed) + ' Node_collapser'}
            onClick={() => this.props.store.actions.toggleCollapse(this.props.id)}
          />}

        <Body
          node={this.state.node}
          depth={this.props.depth}
          editState={this.state.editState}
          actions={this.props.store.actions}
          contentClassName={contentClassName}
          onHeightChange={this.ensureInView}

          keyActions={this.keyActions}

          store={this.props.store}

        />
      </div>

      <div className={css(styles.children) + ' Node_children'}>
        {(!collapsed || isRoot) && this.state.node.children.map(id => (
          <ListItem
            store={this.props.store}
            depth={this.props.depth + 1}
            nodeMap={this.props.nodeMap}
            id={id}
            key={id}
          />
        ))}
      </div>
    </div>
  }
}

const activeStyles: any = {}
;['active', 'selected', 'editing', 'cutting', 'dragging'].forEach(key => {
  activeStyles[key] =
    // {outline: `2px solid ${colors[key]}`}
    {boxShadow: `
      -2px -2px 0 ${colors[key]},
      -2px 2px 0 ${colors[key]},
      2px -2px 0 ${colors[key]},
      2px 2px 0 ${colors[key]}
    `}
})
activeStyles.dragging.backgroundColor = colors.draggingBackground

const styles = StyleSheet.create({
  ...activeStyles,

  container: {
    position: 'relative',
  },

  contentWrapper: {
    borderRadius: 3,
  },

  topNormal: {
    ':hover': {
      // backgroundColor: '#fafafa',
    },
  },

  collapser: {
    width: '.7em',
    height: '.7em',
    borderRadius: '.35em',
    backgroundColor: '#ccc',
    position: 'absolute',
    top: '.5em',
    // marginTop: -10,
    right: '100%',
    marginRight: 'calc(.35em + 1px)',
    cursor: 'pointer',
    opacity: .2,
    ':hover': {
      opacity: 1,
    },
  },

  collapsed: {
    opacity: 1,
  },

  children: {
    paddingLeft: '.7em',
    borderLeft: '2px solid #eee',
    marginLeft: '.7em',
  },
})
