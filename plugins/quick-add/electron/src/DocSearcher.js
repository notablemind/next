
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import ensureInView from 'treed/ensureInView'

const searchDocs = (docs, text) => {
  if (!text) return docs.sort((a, b) => b.lastOpened - a.lastOpened)
  text = text.toLowerCase()
  return docs
    .filter(d => d.title.toLowerCase().indexOf(text) !== -1)
    // TODO fuzzy search
    .sort((a, b) => b.lastOpened - a.lastOpened)
}

export default class DocSearcher extends Component {
  constructor({docs}) {
    super()
    this.state = {
      text: '',
      results: searchDocs(docs, ''),
      selected: 0,
    }
  }

  state: {
    text: string,
    results: any[],
    selected: number
  }
  input: any

  componentDidMount() {
    this.input.focus()
  }

  setText = (text: string) => {
    this.setState({
      text,
      results: searchDocs(this.props.docs, text),
      selected: 0,
    })
  }

  focus = () => {
    this.input.focus()
  }

  onKeyDown = (e: KeyboardEvent) => {
    const {selected, results} = this.state
    if (e.key === 'ArrowUp' || (e.key === 'k' && e.metaKey)) {
      this.setState({
        selected: selected > 0 ? selected - 1 : results.length - 1,
      })
    } else if (e.key === 'ArrowDown' || (e.key === 'j' && e.metaKey)) {
      this.setState({
        selected: selected < results.length - 1 ? selected + 1 : 0,
      })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        if (this.props.focusUp) {
          this.props.focusUp()
        }
      } else {
        this.props.onSubmit(this.state.results[this.state.selected], e.metaKey)
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
    return <div className={css(styles.searcher)}>
      <input
        ref={n => this.input = n}
        placeholder="Search for a target document"
        className={css(styles.input, styles.search)}
        onChange={e => this.setText(e.target.value)}
        onKeyDown={this.onKeyDown}
      />
      <div className={css(styles.docs)}>
        {this.state.results.map((doc, i) => (
          <EnsureInView
            key={doc.id}
            active={i === this.state.selected}
            className={css(styles.result, i === this.state.selected && styles.selectedResult)}
            onClick={(e) => this.props.onSubmit(doc, e.metaKey)}
          >
            {doc.title}  
          </EnsureInView>
        ))}
        {!this.state.results.length &&
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