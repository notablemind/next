
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import Icon from 'treed/views/utils/Icon'
import Renderer from 'treed/views/body/Renderer'
import ScrollIntoView from 'treed/ScrollIntoView'

export type Result = {
  title: string,
  id: string,
  root: string,
  type: string,
  subtitle: ?string,
}

export default class Searcher extends Component {
  state = {
    selected: 0
  }
  input: any

  componentDidMount() {
    this.input.focus()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.results !== this.props.results) {
      this.setState({selected: 0})
    }
  }

  setText = (text: string) => {
    this.props.onChange(text)
    // this.setState({
    //   text,
    // })
  }

  focus = () => {
    this.input.focus()
    this.input.selectionStart = 0
    this.input.selectionEnd = this.input.value.length
  }

  onKeyDown = (e: KeyboardEvent) => {
    const {selected} = this.state
    const {results} = this.props
    if (e.key === 'ArrowUp' || (e.key === 'k' && e.metaKey)) {
      this.setState({
        selected: selected > 0 ? selected - 1 : results.length - 1,
      })
    } else if (e.key === 'ArrowDown' || (e.key === 'j' && e.metaKey)) {
      this.setState({
        selected: selected < results.length - 1 ? selected + 1 : 0,
      })
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey && this.props.focusUp) {
        this.props.focusUp()
      } else {
        // this.props.onNext()
      }
    } else if (e.key === 'Backspace' && !e.target.value) {
      this.props.onBackspace && this.props.onBackspace()
    } else {
      const submission = this.props.submissionKey(e)
      if (submission) {
        e.preventDefault()
        e.stopPropagation()
        this.props.onSubmit(submission, results[selected])
      }
    }
    /* else if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        if (this.props.focusUp) {
          this.props.focusUp()
        }
      } else {
        this.props.onSubmit(results[selected], e.metaKey)
      }
    } else if (e.key === 's' && e.metaKey) {
      e.preventDefault()
      this.props.onSubmit(results[selected], true, true)
    }*/
  }

  render() {
    const {selected} = this.state
    const {placeholder, results, subtext} = this.props
    return <div className={css(styles.searcher)}>
      <div style={{flexDirection: 'row'}}>
        {this.props.inputLeft}
        <input
          value={this.props.text}
          ref={n => this.input = n}
          placeholder={placeholder}
          className={css(styles.input, styles.search)}
          onChange={e => this.setText(e.target.value)}
          onKeyDown={this.onKeyDown}
        />
      </div>
      <div className={css(styles.docs)}>
        {results.map((doc, i) => (
          <ScrollIntoView
            key={doc.id + ':' + doc.root}
            active={i === selected}
            className={css(styles.result, i === selected && styles.selectedResult)}
            onClick={(e) => this.props.onSubmit(e.metaKey ? 'meta-click' : 'click', doc)}
          >
            {renderItem(doc)}
            {doc.subtitle && 
              <div className={css(styles.subtitle)}>
                {doc.subtitle}
              </div>}
          </ScrollIntoView>
        ))}
        {!results.length &&
          <div className={css(styles.result, styles.empty)}>No results</div>}
      </div>
      {subtext}
    </div>
  }
}

const renderItem = doc => {
  let content
  if (doc.type === 'code') {
    content = <div className={css(styles.code)}>{doc.title}</div>
  } else {
    content = <Renderer content={doc.title} /> // TODO have an icon based on the type
  }
  const icon = (doc.type === ':doc:' || (!doc.type && doc.lastOpened))
    ? 'document-text'
    : 'ios-arrow-right'
  // console.log(doc.type, doc)
  return <div className={css(styles.titleRow)}>
    {icon
      ? <Icon
          className={css(styles.titleIcon)}
          name={icon}
        />
      : null}
    {content}
  </div>
}

const styles = StyleSheet.create({
  searcher: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
  },

  titleIcon: {
    fontSize: 16,
    lineHeight: '26px',
    marginRight: 5,
    color: '#66f',
  },

  code: {
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
  },

  input: {
    outline: 'none',
    border: 'none',
    flex: 1,
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
    flex: 1,
    maxHeight: 'auto',
  },

  selectedResult: {
    backgroundColor: '#eee',
  },
})