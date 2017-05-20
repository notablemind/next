
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

let savedText = ''

export default class Write extends Component {
  state = {
    text: savedText,
  }

  componentWillUnmount() {
    savedText = this.state.text
  }

  onKeyDown = e => {
    if (e.key === 'ArrowDown') {
      // navigate between documents
      // also cmd+j
    }
  }

  render() {
    return <div className={css(styles.container)}>
      <div>
        <input
          onChange={e => this.setState({text: e.target.value})}
          onKeyDown={this.onKeyDown}
          placeholder="Write something"
          className={css(styles.input)}
        />
      </div>
      <input
        placeholder="Search for a document, or cmd+enter to reuse most recent"
      />
      Document list here
    </div>
  }
}

const styles = StyleSheet.create({
})

