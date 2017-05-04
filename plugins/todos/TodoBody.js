// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Content from 'treed/views/body/Content'

type Props = {
  node: any,
  store: any,
  editState: any,
  actions: any,
}

export default (props: Props) => {
  const todo = props.node.types.todo || {}
  const completed = props.node.completed
  return <div className={css(styles.container)}>
    <input
      type="checkbox"
      className={css(styles.checkbox)}
      onMouseDown={e => e.stopPropagation()}
      onChange={e => props.store.actions.toggleDone(props.node._id)}
      checked={!!completed}
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
