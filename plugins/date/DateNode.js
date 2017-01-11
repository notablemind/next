
import React from 'react'
import {StyleSheet, css} from 'aphrodite'
import fecha from 'fecha'

const DateNode = ({node, store}) => (
  <div className={css(styles.container)}>
    {fecha.format(new Date(node.created), 'mediumDate')}
  </div>
)

export default DateNode

const styles = StyleSheet.create({
  container: {
    padding: 5,
    color: '#ff8426',
    fontWeight: 'normal',
  },
})

