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
    const {depth, editState, contentClassName} = this.props
    const pluginCls = this.props.store.plugins.node.className ?
      this.props.store.plugins.node.className(this.props.node, this.props.store) :
        ''
    const cls = `${contentClassName || ''} Node_body Node_body_level_${depth} ${pluginCls || ''}`

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
  container: {
    // cursor: 'text',
    padding: '1px 0',
    // cursor: 'pointer',
    zIndex: 1,
  },

})

