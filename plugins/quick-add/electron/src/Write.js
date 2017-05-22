
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'
// import {comp: Write} from './Write.re'
import AutoGrowTextarea from './AutoGrowTextarea'
import ensureInView from 'treed/ensureInView'

let savedText = ''

const getMostRecent = meta => {
  let at = null
  for (let doc of Object.values(meta)) {
    if (!at || doc.lastOpened > at.lastOpened) at = doc
  }
  return at
}

export default class Write extends Component {
  state = {
    text: savedText,
    searching: false,
  }
  unmounted = false

  componentWillUnmount() {
    savedText = this.state.text
    this.unmounted = true
  }

  onKeyDown = e => {
    if (e.key === 'ArrowDown') {
      // navigate between documents
      // also cmd+j
    } else if (e.key === 'Tab') {
      e.preventDefault()
      e.stopPropagation()
      if (e.shiftKey) {
        this.props.onPrev()
      } else {
        this.props.onNext()
      }
    } else if (e.key === 'Enter') {
      if (e.shiftKey) return
      e.preventDefault()
      e.stopPropagation()
      if (e.metaKey) {
        this.finish(getMostRecent(this.props.nm.meta))
        return
      }
      if (!this.state.searching) {
        this.setState({searching: true})
      } else {
        this.searcher.focus()
      }
    } else if (e.key === 'Escape') {
      this.props.cancel()
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.searching && this.state.searching) {
      this.props.setSize(500, 500)
    }
  }

  setText = (text: string) => {
    this.setState({text})
    savedText = text
  }

  componentDidMount() {
    this.input.focus()
    setTimeout(() => {
      this.resizeWindow()
    }, 10)
  }

  resizeWindow = (diff: number = 0) => {
    this.props.setSize(500, document.getElementById('container').offsetHeight + diff)
  }

  onBlur = () => {
    setTimeout(() => {
      if (!this.unmounted) {
        // console.log('should close plz')
        // dunno if I need this actually
      }
    }, 100)
  }

  finish = (doc: {id: string}) => {
    console.log('trying to do things now')
    this.props.nm.remote.send('quick-add', {text: this.state.text, doc: doc.id})
    this.setState({searching: false, text: ''})
    this.props.cancel()
  }

  render() {
    return <div className={css(styles.container)}>
      <div>
        <AutoGrowTextarea
          onChange={e => this.setText(e.target.value)}
          onHeightChange={(height, prevHeight) => {
            this.resizeWindow(height - prevHeight)
          }}
          onBlur={this.onBlur}
          ref={input => this.input = input}
          value={this.state.text}
          onKeyDown={this.onKeyDown}
          placeholder="Write something"
          className={css(styles.input, styles.text)}
        />
      </div>
      {this.state.searching
        ? <DocSearcher
            docs={Object.values(this.props.nm.meta)}
            cancel={this.props.cancel}
            onSubmit={doc => this.finish(doc)}
            onPrev={this.props.onPrev}
            onNext={this.props.onNext}
            focusUp={() => this.input.focus()}
            ref={n => this.searcher = n}
          />
        : <div className={css(styles.explanation)}>
          <div className={css(styles.row)}>
            <span className={css(styles.code)}>cmd+enter</span> to add to <span className={css(styles.title)}>{getMostRecent(this.props.nm.meta).title}</span>
            </div>
          <div className={css(styles.row)}>
            <span className={css(styles.code)}>enter</span> to select a target document
            </div>
          </div>}
    </div>
  }
}

const searchDocs = (docs, text) => {
  if (!text) return docs.sort((a, b) => b.lastOpened - a.lastOpened)
  text = text.toLowerCase()
  return docs
    .filter(d => d.title.toLowerCase().indexOf(text) !== -1)
    // TODO fuzzy search
    .sort((a, b) => b.lastOpened - a.lastOpened)
}

class DocSearcher extends Component {
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

  setText = text => {
    this.setState({
      text,
      results: searchDocs(this.props.docs, text),
      selected: 0,
    })
  }

  focus = () => {
    this.input.focus()
  }

  onKeyDown = e => {
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
        this.props.focusUp()
      } else {
        this.props.onSubmit(this.state.results[this.state.selected])
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        this.props.onPrev()
      } else {
        this.props.onNext()
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
            onClick={() => this.props.onSubmit(doc)}
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
  container: {
    flex: 1,
  },

  input: {
    outline: 'none',
    border: 'none',
    padding: 10,
  },

  row: {
    display: 'block',
    padding: '5px 10px',
  },

  explanation: {
    paddingBottom: 5,
  },

  code: {
    backgroundColor: '#eee',
    borderRadius: 3,
    padding: '2px 3px',
  },

  title: {
    backgroundColor: '#eef',
    borderRadius: 3,
    padding: '2px 3px',
  },

  text: {
    fontSize: 20,
  },

  searcher: {
    flex: 1,
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
css(styles.input, styles.text)
