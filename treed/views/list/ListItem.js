// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import Body from '../body'
import ensureInView from '../../ensureInView'
import * as colors from '../utils/colors'
import Icon from '../utils/Icon'

import './index.css'

type Props = {
  indentStyle: 'minimal' | 'lines' | 'dots',
  [key: any]: any,
}

export default class ListItem extends Component {
  _sub: any
  _div: any
  state: any
  keyActions: any
  props: Props

  constructor({store, id}: Props) {
    super()

    this._sub = store.setupStateListener(
      this,
      store => [store.events.node(id), store.events.nodeView(id)],
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
    return (
      nextState !== this.state ||
      nextProps.indentStyle !== this.props.indentStyle ||
      nextProps.hideCompleted !== this.props.hideCompleted
    )
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
    this.props.store.actions.openContextMenuForNode(
      this.props.id,
      e.clientX,
      e.clientY,
    )
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

    const isRoot = this.props.store.state.root === this.props.id

    if (this.props.hideCompleted && !isRoot && this.state.node.completed) {
      return <div />;
    }

    const {indentStyle} = this.props
    const collapsed = this.state.isCollapsed
    const contentClassName = css(
      styles.contentWrapper,
      this.state.isActive && styles.active,
      this.state.isSelected && styles.selected,
      this.state.isCutting && styles.cutting,
      this.state.isDragging && styles.dragging,
      this.state.editState && styles.editing,
    )

    const childrenStyle =
      styles['children_' + indentStyle] || styles.children_lines
    const isMinimal = indentStyle === 'minimal'

    const nodeTypeConfig = (this.state.node.type !== 'normal' &&
      this.props.store.plugins.nodeTypes[this.state.node.type]) || {}
    const containerCls = nodeTypeConfig.containerClassName
      ? ' ' +
          nodeTypeConfig.containerClassName(this.state.node, this.props.store)
      : ''

    return (
      <div
        className={
          css(styles.container) +
            ` Node_item Node_level_${this.props.depth} Node_container_${this.state.node.type}` +
            (isRoot ? ' Node_root' : '') +
            containerCls
        }
      >
        {!isRoot &&
          isMinimal &&
          this.state.node.children.length > 0 &&
          <div
            className={css(styles.leftPad)}
            style={{width: Math.max(5, 40 - this.props.depth * 8)}}
            onClick={() =>
              this.props.store.actions.toggleCollapse(this.props.id)}
          />}
        <div
          className={
            css(styles.top, !this.state.editState && styles.topNormal) +
              ' Node_top ListItem_top'
          }
          // onMouseMove={this.onMouseMove}
          // onMouseDownCapture={this.onMouseDown}
          onContextMenu={this.onContextMenu}
          ref={node => {
            this._div = node
            this.props.nodeMap[this.props.id] = node
          }}
        >
          {!isMinimal &&
            !isRoot &&
            this.state.node.children.length > 0 &&
            <div
              className={
                css(styles.collapser, collapsed && styles.collapsed) +
                  ' Node_collapser'
              }
              onClick={() =>
                this.props.store.actions.toggleCollapse(this.props.id)}
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
            orientation="wide"
          />
          <Icon
            className={
              css(
                styles.dragger,
                this.state.isDragging && styles.draggerDragging,
              ) + ' Treed_show_on_top_hover'
            }
            onMouseDown={this.startDragging}
            name="arrow-move"
          />
        </div>

        <div className={css(childrenStyle) + ' Node_children'}>
          {(!collapsed || isRoot) && this.renderChildren(nodeTypeConfig)}
        </div>
      </div>
    )
  }

  renderWrappedChildren(container) {
    return this.state.node.children.map((id, index) =>
      container({
        id,
        index,
        indentStyle: this.props.indentStyle,
        child: (
          <ListItem
            store={this.props.store}
            depth={this.props.depth + 1}
            nodeMap={this.props.nodeMap}
            indentStyle={this.props.indentStyle}
            hideCompleted={this.props.hideCompleted}
            id={id}
          />
        ),
      }),
    )
  }

  renderChildren(nodeTypeConfig) {
    if (nodeTypeConfig.childContainer) {
      return this.renderWrappedChildren(nodeTypeConfig.childContainer)
    }
    return this.state.node.children.map(id => (
      <ListItem
        store={this.props.store}
        depth={this.props.depth + 1}
        nodeMap={this.props.nodeMap}
        indentStyle={this.props.indentStyle}
        hideCompleted={this.props.hideCompleted}
        id={id}
        key={id}
      />
    ))
  }
}

const activeStyles: any = {}
;['active', 'selected', 'editing', 'cutting', 'dragging'].forEach(key => {
  activeStyles[key] =
    // {outline: `2px solid ${colors[key]}`}
    {
      boxShadow: `
      -2px -2px 0 ${colors[key]},
      -2px 2px 0 ${colors[key]},
      2px -2px 0 ${colors[key]},
      2px 2px 0 ${colors[key]}
    `,
    }
})
activeStyles.dragging.backgroundColor = colors.draggingBackground

const styles = StyleSheet.create({
  ...activeStyles,

  container: {
    position: 'relative',
  },

  leftPad: {
    position: 'absolute',
    right: '100%',
    top: 5,
    bottom: 5,
    marginRight: 20,
    // width: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },

  contentWrapper: {
    borderRadius: 3,
  },

  top: {
    position: 'relative',
    paddingRight: 30,
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
    opacity: 0.2,
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

  children: {},

  children_minimal: {},

  children_lines: {
    paddingLeft: '.7em',
    borderLeft: '2px solid #eee',
    marginLeft: '.7em',
  },
})
