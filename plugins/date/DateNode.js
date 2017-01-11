
import React from 'react'
import {StyleSheet, css} from 'aphrodite'

const DateNode = ({node, store}) => (
  <div className={css(styles.container)}>
    {new Date(node.created).toLocaleDateString()}
  </div>
)

export default DateNode

const styles = StyleSheet.create({
})

