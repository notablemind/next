
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'
// import {comp: Write} from './Write.re'
import AutoGrowTextarea from './AutoGrowTextarea'

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
      if (e.metaKey) {
        console.log('gonna submit right here y know')
        return
      }
      this.setState({searching: true})
      // this.searcher.focus()
    }
  }

  setText = text => {
    this.setState({text})
    savedText = text
  }

  componentDidMount() {
    this.input.focus()
    setTimeout(() => {
      this.resizeWindow()
    }, 10)
  }

  resizeWindow = (diff = 0) => {
    this.props.setSize(500, document.getElementById('container').offsetHeight + diff)
  }

  onBlur = () => {
    setTimeout(() => {
      if (!this.unmounted) {
        console.log('should close plz')
      }
    }, 100)
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
            docs={[]}
            // ref={n => this.searcher = n}
          />
        : <div className={css(styles.explanation)}>
          <div className={css(styles.row)}>
            <span className={css(styles.code)}>cmd+enter</span> to add to {getMostRecent(this.props.nm.meta).title}
            </div>
          <div className={css(styles.row)}>
            <span className={css(styles.code)}>enter</span> to select a target document
            </div>
          </div>}
    </div>
  }
}

class DocSearcher extends Component {
  state = {
    text: '',
  }

  componentDidMount() {
    this.input.focus()
  }

  setText = text => {
    this.setState({
      text,
      results: searchDocs(this.props.docs, text),
    })
  }

  focus = () => {
    this.input.focus()
  }

  render() {
    return <div className={css(styles.searcher)}>
      <input
        ref={n => this.input = n}
        placeholder="Search for a document, or cmd+enter to reuse most recent"
        className={css(styles.input, styles.search)}
        onChange={e => this.setText(e.target.value)}
      />
      <div className={css(styles.docs)}>
      </div>      
    </div>
  }
}

const styles = StyleSheet.create({
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

  text: {
    fontSize: 20,
  },

  search: {
    padding: '7px 10px',
    fontSize: 16,
  },

})
css(styles.input, styles.text)

