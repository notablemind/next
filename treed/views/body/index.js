// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Content from './Content'

export default class Body extends Component {
  onClick = (e: any) => {
    if (e.button !== 0) return
    if (e.metaKey) {
      this.props.actions.setActive(this.props.node._id)
      this.props.actions.rebase(this.props.node._id)
      return
    }
    if (e.target.nodeName === 'A') {
      window.open(e.target.href, '_blank')
      e.preventDefault()
      e.stopPropagation()
      return
    }
    e.preventDefault()
    e.stopPropagation()
    this.props.actions.edit(this.props.node._id)
  }

  render() {
    const {depth, isActive, isSelected, editState, isCutting, isDragging} = this.props
    const pluginCls = this.props.store.plugins.node.className ?
      this.props.store.plugins.node.className(this.props.node, this.props.store) :
        ''
    const cls = css(
      styles.outline,
      isActive && styles.active,
      isSelected && styles.selected,
      editState && styles.editing,
      isCutting && styles.cutting,
      isDragging && styles.dragging,
    ) + ` Node_body Node_body_level_${depth} ${pluginCls || ''}`

    const Component = this.props.node.type !== 'normal' &&
      this.props.store.plugins.nodeTypes[this.props.node.type] &&
      this.props.store.plugins.nodeTypes[this.props.node.type].render ||
      Content

    return <div
      onMouseDown={editState ? null : this.onClick}
      className={css(styles.container)}
    >
      <div className={cls}>
        <Component
          node={this.props.node}
          store={this.props.store}
          actions={this.props.actions}
          editState={this.props.editState}
          keyActions={this.props.keyActions}
        />
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  outline: {
  },

  container: {
    // cursor: 'text',
    padding: '1px 0',
    // cursor: 'pointer',
    zIndex: 1,
  },

  active: {
    outline: '2px solid magenta',
  },

  selected: {
    outline: '2px solid cyan',
  },

  editing: {
    outlineColor: 'lime',
  },

  cutting: {
    outline: '2px dotted blue',
  },

  dragging: {
    outline: '2px dotted blue',
    backgroundColor: '#eee',
  },
})

