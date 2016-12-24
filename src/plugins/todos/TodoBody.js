// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Content from '../../../treed/views/body/Content'

export default props => {
  const todo = props.node.types.todo || {}
  return <div className={css(styles.container)}>
    <input
      type="checkbox"
      className={css(styles.checkbox)}
      onMouseDown={e => e.stopPropagation()}
      onChange={e => props.store.actions.setNested(props.node._id, ['types', 'todo'], {
        // TODO dedup w/ the key handler
        ...todo,
        done: !todo.done,
        didDate: todo.done ? null : Date.now(),
      })}
      checked={todo.done}
    />
    <Content {...props} style={{flex: 1}}/>
  </div>
}

// TODO show due date & done date iff the columns don't exist

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  checkbox: {
    margin: 6,
    fontSize: 16,
  },
})
