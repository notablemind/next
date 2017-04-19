// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from './DescendantStyleSheet'

import CM from 'codemirror'
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
    const {manager: {getOutputs, getStreams}} = props.store.getters.pluginState('code')
    this.state = {outputs: getOutputs(props.node._id), streams: getStreams(props.node._id)}
    this.onComplete = null
    this.onHint = null // TODO
    this.setupCompletion(props)
  }

  setupCompletion(props) {
    const {node} = props
    if (!node.types.code || !node.types.code.kernelId) return
    const kernelId = node.types.code.kernelId
    const {manager} = props.store.getters.pluginState('code')
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
    const {manager: {listen}} = this.props.store.getters.pluginState('code')
    this._unsub = listen(this.props.node._id, (outputs, streams) => this.setState({outputs, streams}))
  }

  componentWillUnmount() {
    this._unsub()
  }

  renderData(data, i) {
    if (!data) return 'no data?'
    const {renderers} = this.props.store.getters.pluginState('code')
    for (let renderer of renderers) {
      if (Object.keys(data).includes(renderer.mime)) {
        return renderer.render(data[renderer.mime], i)
      }
    }
    console.log(data)
    return 'Something unknown mime type here'
  }

  renderOutput = (output, i) => {
    if (!output) return
    switch (output.type) {
      case 'console':
        // TODO show multiple args side by side tho
        return <Output key={i} value={output.args} />
      case 'display':
        return this.renderData(output.data, i)
      case 'result':
        return this.renderData(output.data, i)
        // return <Output key={i} value={output.value} />
      case 'error':
        return <div className={css(styles.error)} key={i}>
          {output.name}
          <pre>
          {output.message}
          </pre>
        </div>
        // return <Output key={i} value={output.error} />
      default:
        return 'Unexpected output type ' + output.type
    }
  }

  renderOutputs() {
    const {outputs, streams} = this.state
    if ((!outputs || !outputs.length) && (!streams || (!streams.stderr && !streams.stdout))) {
      return
    }
    return <div className={css(styles.outputBlock)}>
      {streams && streams.stdout && <div className={css(styles.stdout)}>{streams.stdout}</div>}
      {streams && streams.stderr && <div className={css(styles.stderr)}>{streams.stderr}</div>}
      {outputs && outputs.length > 0 && <div onMouseDown={e => e.stopPropagation()} className={css(styles.outputs)}>
        {outputs.map(this.renderOutput)}
      </div>}
    </div>
  }

  getStatus() {
    const {lastRun} = this.props.node.types.code
    if (!lastRun) return 'pristine'
    if (!lastRun.end) return 'running'
    if (lastRun.content !== this.props.node.content) return 'dirty'
    return 'finished'
  }

  render() {
    const {node, keyActions, actions, editState} = this.props
    const status = this.getStatus()
    return <div className={css(styles.container)}>
      <div className={css(styles.top)}>
        <div style={{flex: 1}}>
        <CodeEditor
          node={node}
          keyActions={keyActions}
          actions={actions}
          editState={editState}
          onHint={this.onHint}
          onComplete={this.onComplete}
        />
        </div>
        <div
          className={css(styles.right, styles[status])}
        >
          {!editState && <KernelSelector
              plugin={this.props.store.getters.pluginState('code').manager}
              current={node.types.code}
              onChange={(kernelId, language) => this.props.store.actions.setNodeKernel(node._id, kernelId, language)}
            />}
        </div>
      </div>
      {this.renderOutputs()}
    </div>
  }
}

const styles = StyleSheet.create({
  stdout: {
    whiteSpace: 'pre',
    fontFamily: 'monospace',
    overflowX: 'auto',
  },

  pristine: {
    backgroundColor: 'white',
  },

  finished: {
    backgroundColor: 'green',
  },

  running: {
    backgroundColor: 'yellow',
  },

  dirty: {
    backgroundColor: 'pink',
  },

  top: {
    flexDirection: 'row',
  },

  right: {
    flexBasis: 20,

    '>kernel_selector': {
      visibility: 'hidden',
    },

    ':hover': {
      '>kernel_selector': {
        visibility: 'visible',
      },
    },
  },

  stderr: {
    backgroundColor: '#ffe5e2',
    whiteSpace: 'pre',
    fontFamily: 'monospace',
    overflowX: 'auto',
  },

  error: {
    whiteSpace: 'pre',
    fontFamily: 'monospace',
    backgroundColor: '#ffe5e2',
  },

  outputBlock: {
    padding: 10,
    boxShadow: '0 0 2px #aaa inset',
    borderRadius: 4,
  },

  container: {
    flexDirection: 'column',
    alignItems: 'stretch',
    position: 'relative',
  },

  outputs: {
    maxHeight: 500,
    overflow: 'auto',
    // cursor: 'pointer',
    flexDirection: 'column',
    alignItems: 'stretch',
    borderRadius: 3,
    // backgroundColor: '#eee',
  },
})
