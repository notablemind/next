// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import CodeEditor from './CodeEditor'
import KernelSelector from './KernelSelector'
import show from './Output'

const kernelComplete = (kernel, variant) => {
  var func
  if (kernel.cmComplete) {
    func = function (cm, done) {
      return kernel.cmComplete(cm)
    }
  } else if (kernel.complete) {
    func = function (cm, done) {
      const {cursor, code, pos} = getCodeAndPos(cm)
      return kernel.complete(code, pos, cursor, variant, done)
    }
  } else {
    return function (cm) {
      return CodeMirror.hint.auto(cm)
    }
  }

  if (kernel.asyncComplete) {
    func.async = true
  }

  return func
}

const getCodeAndPos = cm => {
  const cursor = cm.getCursor()
  let code = ''
  for (let i=0; i<cursor.line; i++) {
    code += cm.getLine(i) + '\n'
  }
  const pos = code.length + cursor.ch
  const nums = cm.lineCount()
  for (let i=cursor.line; i<nums; i++) {
    code += cm.getLine(i) + '\n'
  }
  return {
    cursor,
    code: code.slice(0, -1),
    pos,
  }
}


export default class CodeBlock extends Component {
  constructor(props: any) {
    super()
    const {getOutputs} = props.store.getters.pluginState('code')
    this.state = {outputs: getOutputs(props.node._id)}
    this.onComplete = null
    this.onHint = null // TODO
    this.setupCompletion(props)
  }

  setupCompletion(props) {
    const {node} = props
    if (!node.types.code || !node.types.code.kernelId) return
    const kernelId = node.types.code.kernelId
    const manager = props.store.getters.pluginState('code')
    if (!manager.kernelSessions[kernelId]) return
    const session = manager.kernelSessions[kernelId].session
    this.onComplete = (cm, done) => {
      return session.getCompletion(getCodeAndPos(cm), done)
    }
    if (session.asyncCompletion) {
      this.onComplete.async = true
    }
  }

  componentDidMount() {
    // TODO also listen to kernel status, b/c that will affect rendering
    const {listen} = this.props.store.getters.pluginState('code')
    this._unsub = listen(this.props.node._id, outputs => this.setState({outputs}))
  }

  componentWillUnmount() {
    this._unsub()
  }

  renderOutput(output, i) {
    return <div key={i}>
      {show(output)}
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
        onHint={this.onHint}
        onComplete={this.onComplete}
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
