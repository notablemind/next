// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Body from '../body'
import ensureInView from '../../ensureInView'
import * as colors from '../utils/colors'
import Icon from '../utils/Icon'


// TODO a settings to make editing be on double-click, or enter or something
export default class TableItem extends Component {
  props: {
    id: string,
    depth: number,
    store: any,
    nodeMap: {[key: string]: any},
  }
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
      // TODO I want to be able to disable these actions too I think? Although
      // maybe not at all.
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

  onContextMenu = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    this.props.store.actions.openContextMenuForNode(this.props.id, e.clientX, e.clientY)
  }

  startDragging = (e: any) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    this.props.store.actions.startDragging(this.props.id)
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
        ) + ' Node_top ListItem_top'}
        // onMouseMove={this.onMouseMove}
        // onMouseDownCapture={this.onMouseDown}
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
          <Icon
          className={css(styles.dragger, this.state.isDragging && styles.draggerDragging) + ' ListItem_dragger'}
          onMouseDown={this.startDragging}
          name="arrow-move"
          />
      </div>

      <div className={css(styles.children) + ' Node_children'}>
        {(!collapsed || isRoot) && this.state.node.children.map(id => (
          <TableItem
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

  top: {
    position: 'relative',
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

  dragger: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 30,
    // backgroundColor: '#aaa',
    zIndex: 100,
    cursor: 'move',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#aaa',
    ':hover': {
      color: '#000',
    },
  },

  draggerDragging: {
    display: 'flex',
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

