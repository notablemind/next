
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

const STR_LEN = 100

const trunc = (v, m) => v.length > m ? (v.slice(0, m) + '…') : v

const commad = items => items.reduce((ar, item, i) => (
  ( ar.push(item),
    i < items.length - 1 && ar.push(
      <div key={'comma-' + i} className={css(styles.comma)}>,</div>),
    ar)
), [])

const renderAbbreviated = value => {
  if (!value) return value + ''
  switch (typeof value) {
    case 'number': return value + ''
    case 'string': return JSON.stringify(trunc(value, 20))
    case 'function': return `function ${value.name}`
    case 'symbol': return value.toString()
    case 'object':
      if (Array.isArray(value)) {
        return `Array[${value.length}]`
      }
      return value.constructor.name//  + '{}'
  }
  return 'something? ' + typeof value
}

class ObjectReveal extends Component {
  constructor() {
    super()
    this.state = {
      open: false,
    }
  }

  renderInline(names) {
    const {value, isFunction} = this.props
    if (Array.isArray(value)) {
      return <div
        onClick={() => this.setState({open: true})}
        className={css(styles.inline)}
      >
        Array[{value.length}]
      </div>
    }
    if (isFunction) {
      return <div
        onClick={() => this.setState({open: true})}
        className={css(styles.inline)}
      >
        function {value.name}
      </div>
    }
    return <div onClick={() => this.setState({open: true})}
      className={css(styles.inline)}>
      <div className={css(styles.objectName)}>
        {value.constructor.name}
      </div>
      <div className={css(styles.brace)}>{'{'}</div>
      {commad(names.slice(0, 3).map((name, i) => (
        <div key={i} className={css(styles.item)}>
          <div className={css(styles.attrname)}>
            {name}:
          </div>
          <div className={css(styles.attrvalue)}>
            {renderAbbreviated(value[name])}
          </div>
        </div>
      )))}
      {names.length > 3 && ', …'}
      <div className={css(styles.brace)}>{'}'}</div>
    </div>
  }

  renderFull(names) {
    const {value, isFunction} = this.props
    return <div className={css(styles.openObject)}>
      <div
        onClick={() => this.setState({open: false})}
        className={css(styles.objectName)}>
        {isFunction ? 'function ' + value.name : value.constructor.name}
        <div style={{flexBasis: 5}} />
        <div className={css(styles.brace)}>{'{'}</div>
      </div>
      <div className={css(styles.items)}>
      {names.map(name => (
        <div className={css(styles.item)}>
          <div className={css(styles.attrname)}>
            {name}:
          </div>
          <div className={css(styles.attrvalue)}>
            <Output value={value[name]} />
          </div>
        </div>
      ))}
      </div>
      <div className={css(styles.brace)}>{'}'}</div>
    </div>
  }

  render() {
    const {value, isFunction} = this.props
    const names = Object.getOwnPropertyNames(value)
    return <div className={css(styles.container, styles.object)}>
      <div className={css(styles.expander)}
        onClick={() => this.setState(({open}) => ({open: !open}))}>
        &gt;
      </div>
      {this.state.open ? this.renderFull(names) : this.renderInline(names)}
    </div>
  }
}

class StringReveal extends Component {
  constructor() {
    super()
    this.state = {
      revealed: 1,
    }
  }

  render() {
    const {value} = this.props
    const len = STR_LEN * this.state.revealed
    return <div className={css(styles.container, styles.string)}>
      {JSON.stringify(value.slice(0, len))}
      {value.length > len && <div onClick={() => this.setState(({revealed}) => ({revealed: revealed + 1}))}>
        Reveal more
      </div>}
    </div>
  }
}

// This is for in-runtime values, will need to do something else for proxied
// values.
const Output = ({value}) => {
  switch (typeof value) {
    case 'string':
      if (value.length < STR_LEN) {
        return <div className={css(styles.container, styles.string)}>
          {JSON.stringify(value)}
        </div>
      } else {
        return <StringReveal value={value} />
      }
    case 'undefined':
    case 'symbol':
    case 'boolean':
    case 'number':
      return <div className={css(styles.container, styles[typeof value])}>
        {value ? value.toString() : value + ''}
      </div>
    case 'function':
      // TODO?
      return <ObjectReveal value={value} isFunction />
    case 'object':
      if (value === null) {
        return <div className={css(styles.container, styles.null)}>
          {value ? value.toString() : value + ''}
        </div>
      }
      return <ObjectReveal value={value} />
    default:
      console.log('unexpected type')
      return <div className={css(styles.container, styles[typeof value])}>
        {value ? value.toString() : value + ''}
      </div>
  }
}

export default Output

/*
const show = value => {
  if (value instanceof Error) {
    return `Error: ${value.message}`
  }
  if (typeof value === 'function') {
    return <pre className={css(styles.small)}>{value + ''}</pre>
  }
  try {
    return <pre className={css(styles.small)}>{JSON.stringify(value, null, 2)}</pre>
  } catch (e) {
    return 'non-jsonable'
  }
}
*/

const styles = StyleSheet.create({
  container: {
    fontFamily: 'monospace',
    fontSize: 10,
    whiteSpace: 'pre',
  },

  small: {
    fontSize: '.6em',
  },

  openObject: {
    alignItems: 'flex-start',
  },

  object: {
    flexDirection: 'row',
  },

  expander: {
    fontWeight: 'bold',
    marginRight: 5,
  },

  comma: {
    marginRight: 5,
  },

  objectName: {
    marginRight: 5,
    flexDirection: 'row',
  },

  items: {
    paddingLeft: 10,
  },

  item: {
    flexDirection: 'row',
  },

  attrname: {
    marginRight: 5,
    color: 'blue',
  },

  inline: {
    flexDirection: 'row',
  },
})

