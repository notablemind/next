// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Content from './Content'

export default class Body extends Component {
  onClick = (e: any) => {
    if (e.button !== 0) return
    if (e.target.nodeName === 'A') {
      if (e.metaKey) return
      window.open(e.target.href, '_blank')
      e.preventDefault()
      e.stopPropagation()
      return
    }
    e.preventDefault()
    e.stopPropagation()
    if (e.metaKey) {
      if (this.props.onMetaClick) {
        this.props.onMetaClick()
      } else {
        this.props.actions.setActive(this.props.node._id)
        this.props.actions.rebase(this.props.node._id)
      }
    } else if (this.props.onClick) {
      this.props.onClick()
    } else {
      this.props.actions.edit(this.props.node._id)
    }
  }

  render() {
    const {store, depth, editState, contentClassName, textClassName, node, orientation} = this.props
    const {className, blocks} = store.plugins.node
    const nodeTypeConfig = node.type !== 'normal' &&
      store.plugins.nodeTypes[node.type] || {}
    const pluginCls = className ? className(node, store) || '' : ''
    const typeCls = nodeTypeConfig.className ? nodeTypeConfig.className({id: node._id, node, depth}) : ''
    const cls = `${contentClassName || ''} Node_body Node_body_${node.type} Node_body_level_${depth} ${pluginCls} ${typeCls}`

    const Component = nodeTypeConfig.render || Content

    const main = <Component
      node={node}
      store={store}
      actions={this.props.actions}
      editState={editState}
      keyActions={this.props.keyActions}
      onHeightChange={this.props.onHeightChange}
      Content={Content}
      style={this.props.style}
      className={textClassName}
    />

    return <div
      onMouseDown={editState ? null : this.onClick}
      className={css(styles.container)}
    >
      <div className={cls}>
        {surroundWithBlocks(main, organizeBlocks(blocks, orientation), node, store)}
      </div>
    </div>
  }
}

const organizeBlocks = (blocks, orientation) => {
  let top = blocks.top
  let bottom = blocks.bottom
  let left = blocks.left
  let right = blocks.right
  if (blocks.before) {
    if (orientation === 'tall') {
      top = (top || []).concat(blocks.before)
    } else {
      left = (left || []).concat(blocks.before)
    }
  }

  if (blocks.after) {
    if (orientation === 'tall') {
      bottom = (bottom || []).concat(blocks.after)
    } else {
      right = (right || []).concat(blocks.after)
    }
  }
  return {top, left, bottom, right}
}

const surroundWithBlocks = (main, blocks, node, store) => {
  let wrapped = false
  if (blocks.left || blocks.right) {
    wrapped = true
    main = <div className={css(styles.vert)}>
      {(blocks.left || []).map((item, i) => item(i, node, store))}
      {<div className={css(styles.wrapper)}>{main}</div>}
      {(blocks.right || []).map((item, i) => item(i, node, store))}
    </div>
  }
  if (blocks.top || blocks.bottom) {
    main = <div className={css(styles.horiz)}>
      {(blocks.top || []).map((item, i) => item(i, node, store))}
      {wrapped ? main : <div className={css(styles.wrapper)}>{main}</div>}
      {(blocks.bottom || []).map((item, i) => item(i, node, store))}
    </div>
  }
  return main
}

const styles = StyleSheet.create({
  container: {
    // cursor: 'text',
    padding: '1px 0',
    // cursor: 'pointer',
    // zIndex: 1,
  },

  vert: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    alignSelf: 'stretch',
    flex: 1,
  },

  horiz: {
    alignItems: 'stretch',
    justifyContent: 'center',
    alignSelf: 'stretch',
    flex: 1,
  },

  wrapper: {
    flex: 1,
  },
})

