
import React from 'react'

const show = value => {
  if (value instanceof Error) {
    return `Error: ${value.message}`
  }
  return JSON.stringify(value)
}

export default show
