
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

const round = (n, by) => parseInt(n * by) / by

const readableSize = size => {
  const kbs = size / 1000
  if (kbs < 500) return `${parseInt(kbs)}k`
  const mbs = kbs / 1000
  return `${round(mbs, 10)}m`
}

export default class Importer extends Component {
  state: any
  constructor(props) {
    super()
    this.state = {
    }
  }

  onGotFile = (evt: any) => {
    const file = evt.target.files[0]
    if (!file) {
      console.log('no file')
    } else {
      this.setState({file})
    }
  }

  onImport = () => {
    console.log('gonna import')
    importAll(this.state.file).then(
      files => this.props.onImported(files),
      err => {
        console.error(err)
      }
    )
  }

  render() {
    if (this.state.file) {
      return <div className={css(styles.container)}>
        <div>{this.state.file.name}</div>
        <div>{readableSize(this.state.file.size)}</div>
        <button
          onClick={this.onImport}
        >
          Import from zip
        </button>
      </div>
    }

    return <div className={css(styles.container)}>
      <div>
        <input
          onChange={this.onGotFile}
          type="file"
        />
        Drag & drop your zip, folder, or `.nm` here.
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
  },
})

