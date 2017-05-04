import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import exportAll from './exportAll'

const getFiles = data => {
  return Object.keys(data)
    .filter(id => data[id].type === 'file')
    .map(id => data[id])
    .map(file => ({
      id: file._id,
      title: file.content,
      lastOpened: file.types.file.lastOpened,
      size: file.types.file.size,
      selected: true,
    }))
    .sort((a, b) => a.lastOpened - b.lastOpened)
}

export default class ExportModal extends Component {
  constructor({store}) {
    super()

    this.state = {
      files: getFiles(store.db.data),
    }
  }

  toggle(id: string) {
    this.setState({
      files: this.state.files.map(
        file =>
          file.id === id
            ? {
                ...file,
                selected: !file.selected,
              }
            : file,
      ),
    })
  }

  deselectAll = () => {
    this.setState({
      files: this.state.files.map(file => ({...file, selected: false})),
    })
  }

  prepare = () => {
    this.setState({loading: true})
    exportAll(this.state.files.filter(f => f.selected)).then(
      blob => {
        this.setState({
          loading: false,
          link: URL.createObjectURL(blob),
        })
      },
      err => {
        console.error('failed', err)
        this.setState({loading: false})
      },
    )
  }

  render() {
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.title)}>
          Select docs to export
        </div>
        <button onClick={this.deselectAll}>
          Deselect all
        </button>
        <div className={css(styles.files)}>
          {this.state.files.map(file => (
            <div
              key={file.id}
              onClick={() => this.toggle(file.id)}
              className={css(styles.file, file.selected && styles.fileSelected)}
            >
              <div className={css(styles.fileTitle)}>
                {file.title}
              </div>
              <div className={css(styles.spacer)} />
              {file.size}
              <div className={css(styles.date)}>
                {file.lastOpened
                  ? new Date(file.lastOpened).toLocaleDateString()
                  : ''}
              </div>
            </div>
          ))}
        </div>
        <button onClick={this.prepare}>
          Export {this.state.files.filter(f => f.selected).length} docs
        </button>
        {this.state.loading && 'Loading...'}
        {this.state.link &&
          <a href={this.state.link} download="ExportedNotableMindDocuments.zip">
            Download
          </a>}
      </div>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  title: {
    padding: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontSize: '80%',
    fontWeight: 600,
    color: '#777',
  },

  file: {
    cursor: 'pointer',
    flexDirection: 'row',
    padding: '5px 10px',
    borderBottom: '2px solid #fff',
    alignItems: 'center',
    ':hover': {
      backgroundColor: '#eee',
    },
  },

  fileTitle: {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    flexShrink: 1,
    display: 'block',
  },

  fileSelected: {
    backgroundColor: '#fafafa',
    ':hover': {
      backgroundColor: '#ddd',
    },
  },

  spacer: {
    flex: 1,
  },

  files: {
    flex: 1,
    alignSelf: 'stretch',
    overflow: 'auto',
  },

  date: {
    width: 60,
    fontSize: '70%',
    alignItems: 'flex-end',
    fontFamily: 'monospace',
  },
})
