
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import ensureInView from 'treed/ensureInView'
import ipcPromise from '../../../../electron/src/ipcPromise'

type Result = {
  title: string,
  id: string,
  root: string,
  subtitle: ?string,
}

const searchDocs = (docs, text): Array<Result> => {
  if (!text) return docs.sort((a, b) => b.lastOpened - a.lastOpened)
  text = text.toLowerCase()
  return docs
    .filter(d => d.title.toLowerCase().indexOf(text) !== -1)
    // TODO fuzzy search
    .sort((a, b) => b.lastOpened - a.lastOpened)
    .map(doc => ({title: doc.title, id: doc.id, root: 'root', subtitle: null}))
}

const DEBOUNCE = 200

const debounce = <T>(fn: (a: T) => void, time): (a: T) => void => {
  let tout = null
  return (arg: T) => {
    clearTimeout(tout)
    tout = setTimeout(() => fn(arg), time)
  }
}

export default class DocSearcher extends Component {
  constructor({docs}: any) {
    super()
    this.state = {
      text: '',
      results: searchDocs(docs, ''),
      fullResults: [],
      selected: 0,
    }
  }

  state: {
    text: string,
    results: Result[],
    fullResults: Result[],
    selected: number
  }
  input: any
  remoteProm: any

  componentDidMount() {
    this.input.focus()
    this.remoteProm = ipcPromise(this.props.remote)
  }

  setText = (text: string) => {
    this.setState({
      text,
      results: searchDocs(this.props.docs, text),
      fullResults: [], // TODO?
      selected: 0,
    })
    this.fullSearch(text)
  }

  fullSearch: (a: string) => void = debounce((text: string) => {
    this.remoteProm.send('full-search', text).then(results => {
      this.setState(state => state.text === text ? {fullResults: results} : {})
    })
  }, DEBOUNCE)

  focus = () => {
    this.input.focus()
  }

  onKeyDown = (e: KeyboardEvent) => {
    const {selected, results, fullResults} = this.state
    if (e.key === 'ArrowUp' || (e.key === 'k' && e.metaKey)) {
      this.setState({
        selected: selected > 0 ? selected - 1 : (results.length + fullResults.length) - 1,
      })
    } else if (e.key === 'ArrowDown' || (e.key === 'j' && e.metaKey)) {
      this.setState({
        selected: selected < (results.length + fullResults.length) - 1 ? selected + 1 : 0,
      })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        if (this.props.focusUp) {
          this.props.focusUp()
        }
      } else {
        const result = selected < results.length
          ? results[selected]
          : fullResults[selected - results.length]
        this.props.onSubmit(result, e.metaKey)
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey && this.props.focusUp) {
        this.props.focusUp()
      } else {
        // this.props.onNext()
      }
    } else if (e.key === 'Escape') {
      this.props.cancel()
    }
  }

  render() {
    const {results, fullResults, selected} = this.state
    return <div className={css(styles.searcher)}>
      <input
        ref={n => this.input = n}
        placeholder="Search for a target document"
        className={css(styles.input, styles.search)}
        onChange={e => this.setText(e.target.value)}
        onKeyDown={this.onKeyDown}
      />
      <div className={css(styles.docs)}>
        {(results.concat(fullResults)).map((doc, i) => (
          <EnsureInView
            key={doc.id}
            active={i === selected}
            className={css(styles.result, i === selected && styles.selectedResult)}
            onClick={(e) => this.props.onSubmit(doc, e.metaKey)}
          >
            {doc.title} {/* TODO subtitle */}
          </EnsureInView>
        ))}
        {!results.length && !fullResults.length &&
          <div className={css(styles.result, styles.empty)}>No results</div>}
      </div>      
    </div>
  }
}

class EnsureInView extends Component {
  node: any
  componentDidMount() {
    if (this.props.active) {
      ensureInView(this.node, true, 50)
    }
  }
  
  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.active && this.props.active) {
      ensureInView(this.node, true, 50)
    }
  }
  
  render() {
    const {active, ...props} = this.props
    return <div {...props} ref={node => this.node = node} />
  }
}

const styles = StyleSheet.create({
  searcher: {
    flex: 1,
  },

  input: {
    outline: 'none',
    border: 'none',
    padding: 10,
  },

  search: {
    padding: '7px 10px',
    fontSize: 16,
  },

  result: {
    padding: '5px 10px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#eee',
    }
  },

  docs: {
    overflow: 'auto',
    flex: 1,
  },

  empty: {
    fontStyle: 'italic',
  },

  selectedResult: {
    backgroundColor: '#eee',
  },
})