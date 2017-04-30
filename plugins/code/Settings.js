
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

const uniqueId = (id, obj) => {
  if (!obj[id]) return id
  for (let i=2; i < 1000; i++) {
    if (!obj[id + '-' + i]) return id + '-' + i
  }
  throw new Error('seriously 1000 kernels are you mad')
}

export default class Settings extends Component {
  constructor() {
    super()
    this.state = {
      kernelSpecs: {},
      loading: {},
    }
  }

  componentDidMount() {
    Promise.all(this.props.manager.connectedSources().map(({source: {id}, connection}) => {
      this.setState(({loading}) => ({loading: {...loading, [id]: true}}))
      return connection.getKernelSpecs().then(specs => {
        this.setState(({kernelSpecs, loading}) => ({
          kernelSpecs: {...kernelSpecs, [id]: specs},
          loading: {...loading, [id]: false},
        }))
      }, errorGettingSpecs => {
        connection.status = 'disconnected'
      })
    })).then(() => {
      console.log('good done')
    }, err => {
      console.log('bad fail', err)
    })
  }

  // TODO figure out spec more
  addKernel(sourceId, spec) {
    // TODO maybe a better algorithm for choosing these ids?
    const id = uniqueId(sourceId + '-' + spec.language, this.props.config.kernels)
    const kernelConfig = {
      id,
      title: id,
      sourceId,
      language: spec.language,
      config: spec,
    }
    this.props.store.actions.setNested('settings', ['plugins', 'code', 'kernels', id], kernelConfig)
    // TODO refresh state from this somehow
    // TODO I also want to maybe automatically get a session too.
  }

  renderSources() {
    const {manager} = this.props
    return Object.keys(manager.sources).map(sid => {
      const source = manager.sources[sid]
      // TODO I think I want to have "expanded" and "collapsed" stuffs,
      // if the thing isn't connected, then maybe it'll be in expanded mode
      // (showing config)
      // if it is, then collapsed mode, along with the # of kernels it has
      // available.
      // If there's only one, (and there's no configuration?), then have a
      // quick add button?
      const specs = this.state.kernelSpecs[sid] || [] // TODO handle not connected yet
      return <div key={sid}>
        <div className={css(styles.sourceTitle)}>
          {source.source.name || source.source.id}
        </div>
        {!specs.length && <span>No kernels available...</span>}
        {specs.map(spec => (
          <div style={{flexDirection: 'row'}} key={spec.name} className={css(styles.kernel)}>
            {spec.display_name}
            <div style={{flex: 1}}/>
            <div style={{fontSize: '.8em', padding: '0 10px'}}>
            {spec.language}
            </div>
            <button
              onClick={() => this.addKernel(sid, spec)}
            >
              Add kernel
            </button>
          </div>
        ))}
      </div>
    })
  }

  renderKernels() {
    const kernels = Object.values(this.props.config.kernels)
    const sessions = this.props.manager.kernelSessions
    return <div>
      {!kernels.length && 'No kernels yet'}
      {kernels.map(kernel => (
        <div
          className={css(styles.configuredKernel)}
          key={kernel.id}
        >
          {kernel.title}
          <div style={{flex: 1}}/>
          {sessions[kernel.id] && sessions[kernel.id].session.isConnected() ?
            'connected' : 'disconnected'}
        </div>
      ))}
    </div>
  }

  render() {
    return <div>
      <div className={css(styles.section)}>
        <div className={css(styles.sectionTitle)}>
          Sources
        </div>
        {this.renderSources()}
      </div>
      <div className={css(styles.section)}>
        <div className={css(styles.sectionTitle)}>
          Configured Kernels
        </div>
        {this.renderKernels()}
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  sourceTitle: {
    // fontWeight: 'bold',
    // fontWeight: 'bold',
    margin: 5,
  },

  kernel: {
    padding: '5px 10px',
    backgroundColor: 'white',
    marginBottom: 1,
    borderRadius: 3,
  },

  configuredKernel: {
    padding: '5px 0px',
    flexDirection: 'row',
  },

  section: {
    padding: '5px',
    margin: 5,
    borderRadius: 4,
    backgroundColor: '#eee',
  },

  sectionTitle: {
    fontSize: '.7em',
    textTransform: 'uppercase',
    // borderBottom: '1px solid #aaa',
  },
})

