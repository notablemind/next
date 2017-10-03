// @flow

import type {Plugin} from 'treed/types'
import React from 'react'
import {css, StyleSheet} from 'aphrodite'
import Icon from 'treed/views/utils/Icon'
import Content from 'treed/views/body/Content'


const days = ['M', 'T', 'W', 'Th', 'F', 'S', 'Su']
const Weekly = ({value, onChange}) => {
  value = value || {}
  const dayNodes = days.map((name, i) => (
    <div
      key={i}
      onMouseDown={(e) => (e.preventDefault(), e.stopPropagation(), onChange(i))}
      className={css(styles.day, value[i] && styles.selected)}
    >
      {name}
    </div>
  ))
  return <div className={css(styles.container)}>
    {dayNodes}
  </div>
}

const PLUGIN_ID = 'planner'

const plugin: Plugin<void, void> = {
  id: PLUGIN_ID,

  actions: {
    toggleWeekly(store, id: string, day: number) {
      const node = store.getters.node(id)
      if (node.type !== 'weekly') return
      const value = {...(node.types.weekly || {}).value}
      value[day] = !value[day]
      store.actions.setNested(node._id, ['types', 'weekly', 'value'], value)
    },
  },

  nodeTypes: {

    weekly: {
      title: 'Weekly To-Do',
      newSiblingsShouldCarryType: true,
      shortcut: 'w',

      render: props => {
        return <div className={css(styles.weeklyBody)}>
          <Weekly
            value={(props.node.types.weekly || {}).value}
            onChange={day => props.store.actions.toggleWeekly(props.node._id, day)}
          />
          <Content {...props} style={{flex: 1}}/>
        </div>
      },
    },
  },

}

export default plugin

const styles = StyleSheet.create({
  weeklyBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  container: {
    flexDirection: 'row',
    height: 28,
    alignItems: 'center',
  },

  day: {
    padding: '3px 5px',
    fontSize: '70%',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#eee',
    },
  },

  selected: {
    backgroundColor: '#aec7ff',
    ':hover': {
      backgroundColor: '#d9e4ff',
    }
  },
})

