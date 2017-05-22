
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import Renderer from '../../../../treed/views/body/Renderer'
// import ensureInView from 'treed/ensureInView'
import ScrollIntoView from 'treed/ScrollIntoView'
import ipcPromise from '../../../../electron/src/ipcPromise'

type Result = {
  title: string,
  id: string,
  root: string,
  type: string,
  subtitle: ?string,
}

const searchDocs = (docs, text): Array<Result> => {
  if (!text) return docs.sort((a, b) => b.lastOpened - a.lastOpened)
  text = text.toLowerCase()
  return docs
    .filter(d => d.title.toLowerCase().indexOf(text) !== -1)
    // TODO fuzzy search
    .sort((a, b) => b.lastOpened - a.lastOpened)
    .map(doc => ({title: doc.title, id: doc.id, root: 'root', subtitle: null, type: ':doc:'}))
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
    const docs = searchDocs(this.props.docs, text)
    this.setState({
      text,
      results: docs,
      fullResults: docs.length > 0 ? [] : this.state.fullResults,
      // fullResults: [], // TODO?
      selected: 0,
    })
    this.fullSearch(text)
  }

  fullSearch: (a: string) => void = debounce((text: string) => {
    this.remoteProm.send('full-search', text).then(results => {
      console.log('full results', results)
      this.setState(state => state.text === text ? {fullResults: results} : {})
    }, err => {
      this.setState(state => state.text === text ? {fullResults: []} : {})
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
        placeholder="Search by document title or node content"
        className={css(styles.input, styles.search)}
        onChange={e => this.setText(e.target.value)}
        onKeyDown={this.onKeyDown}
      />
      <div className={css(styles.docs)}>
        {(results.concat(fullResults)).map((doc, i) => (
          <ScrollIntoView
            key={doc.id + ':' + doc.root}
            active={i === selected}
            className={css(styles.result, i === selected && styles.selectedResult)}
            onClick={(e) => this.props.onSubmit(doc, e.metaKey)}
          >
            {renderItem(doc)}
            {doc.subtitle && 
              <div className={css(styles.subtitle)}>
                {/*{doc.type} ::*/}
                {doc.subtitle}
              </div>}
          </ScrollIntoView>
        ))}
        {!results.length && !fullResults.length &&
          <div className={css(styles.result, styles.empty)}>No results</div>}
      </div>      
    </div>
  }
}

const renderItem = doc => {
  if (doc.type === 'code') {
    return <div className={css(styles.code)}>{doc.title}</div>
  }
  return <Renderer content={doc.title} /> // TODO have an icon based on the type
}

const styles = StyleSheet.create({
  searcher: {
    flex: 1,
  },

  code: {
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
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
    maxHeight: 200,
    overflow: 'hidden',
    ':hover': {
      backgroundColor: '#eee',
    }
  },

  subtitle: {
    fontSize: '.8em',
    fontWeight: 'normal',
    textAlign: 'right',
    color: '#66f',
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