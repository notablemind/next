
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'
import AutoGrowTextarea from './AutoGrowTextarea'
// import BothSearcher from './BothSearcher'
import AltSearcher from './AltSearcher'

let savedText = ''

const getMostRecent = (meta): any => {
  let at = null
  for (let doc of Object.values(meta)) {
    if (!at || doc.lastModified > at.lastModified) at = doc
  }
  if (!at) return null
  return {
    title: at.title,
    id: at.id,
    root: 'root',
    subtitle: null,
  }
}

export default class Write extends Component {
  state = {
    text: savedText,
  }
  unmounted = false
  input: {focus: () => void}

  componentWillUnmount() {
    savedText = this.state.text
    this.unmounted = true
  }

  focus() {
    this.input.focus()
  }

  onKeyDown = e => {
    if (e.key === 'ArrowDown') {
      // navigate between documents
      // also cmd+j
    } else if (e.key === 'Tab') {
      e.preventDefault()
      e.stopPropagation()
      if (e.shiftKey) {
        // this.props.onPrev()
      } else {
        this.goToSearch()
        // this.props.onNext()
      }
    } else if (e.key === 'Enter') {
      if (e.shiftKey) return
      e.preventDefault()
      e.stopPropagation()
      if (e.metaKey) {
        this.finish(getMostRecent(this.props.nm.meta))
        return
      }
      this.goToSearch()
    } else if (e.key === 'Escape') {
      this.props.cancel()
    } else if (e.key === 's' && e.metaKey) {
      // TODO get `home` from settings as "scratchTarget"
      this.finish({id: 'home', root: 'root'}, true)
    }
  }

  goToSearch() {
    this.searcher.focus()
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
    // this.props.setSize(500, document.getElementById('container').offsetHeight + diff)
  }

  onBlur = () => {
    setTimeout(() => {
      if (!this.unmounted) {
        // console.log('should close plz')
        // dunno if I need this actually
      }
    }, 100)
  }

  finish = (result: {id: string, root: string}, sticky: boolean) => {
    console.log('trying to do things now')
    this.props.nm.remote.send('quick-add', {text: this.state.text, doc: result.id, root: result.root, sticky})
    this.setState({text: ''})
    this.props.cancel()
  }

  renderInput() {
    return <AutoGrowTextarea
      onChange={e => this.setText(e.target.value)}
      onBlur={this.onBlur}
      ref={input => this.input = input}
      value={this.state.text}
      onKeyDown={this.onKeyDown}
      placeholder="Write something"
      className={css(styles.input, styles.text)}
    />
  }

  render() {
    return <div className={css(styles.container)}>
      <div>
        {this.renderInput()}
      </div>
      <AltSearcher 
        docs={Object.values(this.props.nm.meta)}
        remote={this.props.nm.remote}
        cancel={this.props.cancel}
        onSubmit={this.finish}
        focusUp={() => this.input.focus()}
        ref={n => this.searcher = n}
      />
      {/*{this.state.searching
        ? <BothSearcher
            docs={Object.values(this.props.nm.meta)}
            remote={this.props.nm.remote}
            cancel={this.props.cancel}
            onSubmit={this.finish}
            focusUp={() => this.input.focus()}
            ref={n => this.searcher = n}
          />
        : <div className={css(styles.explanation)}>
          <div className={css(styles.row)}>
            <span className={css(styles.code)}>cmd+enter</span> to add to <span className={css(styles.title)}>{getMostRecent(this.props.nm.meta).title}</span>
          </div>
          <div className={css(styles.row)}>
            <span className={css(styles.code)}>cmd+s</span> to add to <span className={css(styles.title)}>Home</span> & open sticky note
          </div>
          <div className={css(styles.row)}>
            <span className={css(styles.code)}>enter</span> to select a target document
            </div>
          </div>}
        */}
    </div>
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
})
css(styles.input, styles.text)

