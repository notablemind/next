// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import CodeEditor from './CodeEditor'
import KernelSelector from './KernelSelector'
import Output from './Output'

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

  renderData(data, i) {
    if (!data) return 'no data?'
    const k = 'application/in-process-js'
    const keys = Object.keys(data)
    if (keys.includes(k)) {
      return <Output key={i} value={data[k]} />
    }
    if (keys.includes('text/plain')) {
      return <pre key={i}>
        {data['text/plain']}
      </pre>
    }
    return 'Something'
  }

  renderOutput = (output, i) => {
    if (!output) return
    switch (output.type) {
      case 'console':
        // TODO show multiple args side by side tho
        return <Output key={i} value={output.args} />
      case 'result':
        return this.renderData(output.data, i)
        // return <Output key={i} value={output.value} />
      case 'error':
        return <Output key={i} value={output.error} />
      default:
        return 'Unexpected output type ' + output.type
    }
  }

  render() {
    const {node, keyActions, actions, editState} = this.props
    const {outputs} = this.state
    return <div className={css(styles.container)}>
    {!editState && <KernelSelector
        plugin={this.props.store.getters.pluginState('code')}
        current={node.types.code}
        onChange={(kernelId, language) => this.props.store.actions.setNodeKernel(node._id, kernelId, language)}
      />}
      <CodeEditor
        node={node}
        keyActions={keyActions}
        actions={actions}
        editState={editState}
        onHint={this.onHint}
        onComplete={this.onComplete}
      />
      {outputs && <div onMouseDown={e => e.stopPropagation()} className={css(styles.outputs)}>
        {outputs.map(this.renderOutput)}
      </div>}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'stretch',
    position: 'relative',
  },

  outputs: {
    maxHeight: 500,
    overflow: 'auto',
    // cursor: 'pointer',
    padding: 10,
    boxShadow: '0 1px 5px #aaa inset',
    flexDirection: 'column',
    alignItems: 'stretch',
    borderRadius: 3,
    // backgroundColor: '#eee',
  },
})
