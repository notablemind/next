// @flow

import React, {Component} from 'react'
import {StyleSheet as BaseStyleSheet} from 'aphrodite'

import CodeEditor from './CodeEditor'

export default class CodeBlock extends Component {
  constructor(props: any) {
    super()
    const {getOutputs} = this.props.store.getters.pluginState('code')
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
  },
})
