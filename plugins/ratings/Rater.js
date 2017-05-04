// @flow

import type {Plugin} from 'treed/types'
import React from 'react'
import {css, StyleSheet} from 'aphrodite'
import Icon from 'treed/views/utils/Icon'
import Content from 'treed/views/body/Content'

export default ({value, onChange}) => {
  const choices = []
  for (let i=1; i<=5; i++) {
    choices.push(
      <div
        key={i}
        onMouseDown={(e) => (e.preventDefault(), e.stopPropagation(), onChange(i))}
        className={css(styles.choice, i === value && styles.selected)}
      >
        {i}
      </div>
    )
  }
  return <div className={css(styles.container)}>
    {choices}
  </div>
}


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  choice: {
    padding: '3px 5px',
    fontSize: '70%',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#eee',
    },
  },

  selected: {
    backgroundColor: '#ddd',
  },
})
