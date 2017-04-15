// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'
import KernelSelector from './KernelSelector'

import Content from 'treed/views/body/Content'

type Props = any

class BlurInput extends Component {
  constructor(props) {
    super()
    this.state = {focused: !!props.editState, text: props.node.content}
  }

  componentDidMount() {
    if (this.props.editState) {
      this.node.focus()
    } else {
      this.node.blur()
    }
  }

  componentDidUpdate(prevProps) {
    if (!!prevProps.editState !== !!this.props.editState) {
      if (prevProps.editState) {
        this.props.keyActions.setContent(this.node.value)
        this.node.blur()
      } else {
        this.node.focus()
        const editState = this.props.editState
        const node = this.node
        let s = 0
        let e = 0
        if (editState === 'start') {
          s = e = 0
        } else if (editState === 'default') {
          return
        } else if (editState === 'change') {
          s = 0
          e = node.value.length
        } else if (typeof editState === 'number') {
          s = e = editState
        } else { // if (editState === 'end') {
          s = e = node.value.length
        }
        console.log('edit state', editState, s, e)
        node.selectionStart = s
        node.selectionEnd = e
      }
    }
  }

  setText = text => {
    this.setState({text: text.replace(/[^a-zA-Z_0-9]/g, '_')})
  }

  render() {
    return <input
      ref={node => this.node = node}
      className={this.props.className}
      value={this.state.text}
      onChange={e => this.setText(e.target.value)}
    />
  }
}

export default (props: Props) => {
  const {node, store} = props
  const config = node.types.codeScope || {}
  return <div className={css(styles.container)}>
    <div className={css(styles.label)}>Scope:</div>
    <div style={{flexBasis: 5}} />
    <BlurInput
      node={node}
      className={css(styles.input)}
      editState={props.editState}
      keyActions={props.keyActions}
    />
    <div style={{flexBasis: 5}} />
    <KernelSelector
      inline
      plugin={store.getters.pluginState('code').manager}
      current={config}
      onChange={(kernelId, language) => store.actions.setNodeKernel(node._id, kernelId, language)}
    />
    <div style={{flexBasis: 5}} />
  </div>
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  label: {
    // textTransform: 'uppercase',
    // fontSize: '.6em',
    fontFamily: 'monospace',
    padding: 5,
    borderRadius: 3,
    backgroundColor: '#ffdaab',
  },

  input: {
    flex: 1,
    outline: 'none',
    border: 'none',
    fontSize: 'inherit',
    fontWeight: 'bold',
    padding: '0 5px',
    fontFamily: 'monospace',
  },
})

