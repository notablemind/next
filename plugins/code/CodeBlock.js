// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import CodeEditor from './CodeEditor'
import KernelSelector from './KernelSelector'

export default class CodeBlock extends Component {
  constructor(props: any) {
    super()
    const {getOutputs} = props.store.getters.pluginState('code')
    this.state = {outputs: getOutputs(props.node._id)}
  }

  componentDidMount() {
    // TODO also listen to kernel status, b/c that will affect rendering
    const {listen} = this.props.store.getters.pluginState('code')
    this._unsub = listen(this.props.node._id, outputs => this.setState({outputs}))
  }

  componentWillUnmount() {
    this._unsub()
  }

  renderOutput(output) {
    return <div>
      {JSON.stringify(output, null, 2)}
    </div>
  }

  render() {
    const {node, keyActions, actions, editState} = this.props
    const {outputs} = this.state
    return <div className={css(styles.container)}>
      <KernelSelector
        plugin={this.props.store.getters.pluginState('code')}
        current={node.types.code}
        onChange={(kernelId, language) => this.props.store.actions.setNodeKernel(node._id, kernelId, language)}
      />
      <CodeEditor
        node={node}
        keyActions={keyActions}
        actions={actions}
        editState={editState}
      />
      <div className={css(styles.outputs)}>
        {outputs && outputs.map(this.renderOutput)}
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'stretch',
    position: 'relative',
  },
})
