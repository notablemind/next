// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Editor from './Editor'

export default class Body extends Component {
  onClick = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    this.props.actions.edit(this.props.node._id)
  }

  render() {
    const {depth, isActive, editState} = this.props
    const cls = css(
      styles.outline,
      isActive && styles.active,
      editState && styles.editing,
    ) + ` Node_body Node_body_level_${depth}`
    if (editState) {
      return <div className={css(styles.container)}>
        <div className={cls}>
          <Editor
            node={this.props.node}
            actions={this.props.actions}
            editState={editState}
            className={css(styles.text) + ' Node_input'}
          />
        </div>
      </div>
    }

    return <div onMouseDown={this.onClick} className={css(styles.container)}>
      <div className={cls}>
        <div className={
          css(
            styles.text,
              !this.props.node.content && styles.empty
          ) + ' Node_rendered'
        }>
          {this.props.node.content}
        </div>
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  text: {
    fontSize: '1em',
    margin: 0,
    padding: 0,
    border: 'none',
    fontFamily: 'sans-serif',
    outline: 'none',
    lineHeight: '1.2em',
  },

  outline: {
    padding: '4px 5px',
  },

  empty: {
    borderBottom: '2px dotted #ccc',
    height: '1.2em',
  },

  container: {
    padding: '1px 0',
    cursor: 'pointer',
    zIndex: 1,
  },

  active: {
    outline: '2px solid magenta',
  },

  editing: {
    outlineColor: 'lime',
  },
})

