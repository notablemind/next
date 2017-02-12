
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import uuid from 'treed/uuid'
import newNode from 'treed/newNode'
import PouchDB from 'pouchdb'

import importAll from './importAll'

const round = (n, by) => parseInt(n * by) / by

const readableSize = size => {
  const kbs = size / 1000
  if (kbs < 500) return `${parseInt(kbs)}k`
  const mbs = kbs / 1000
  return `${round(mbs, 10)}m`
}

export default class Importer extends Component {
  state: *
  constructor(props) {
    super()
    this.state = {
      error: null,
    }
  }

  onGotFile = (evt: any) => {
    const file = evt.target.files[0]
    if (!file) {
      console.log('no file')
    } else {
      this.setState({file, error: null})
    }
  }

  onImport = () => {
    console.log('gonna import')
    this.setState({loading: true})
    importAll(this.state.file).then(
      files => this.onImported(files),
      err => {
        console.error(err)
      }
    )
  }

  onImported(files) {
    console.log('ok got some things', files)
    const npid = uuid()
    const now = Date.now()
    const tree = {
      ...newNode(npid, null, now, `Imported documents ${new Date().toLocaleDateString()}`),
      children: files.map(({file}) => ({
        ...newNode(file._id, npid, now, file.title),
        type: 'file',
        types: {file: {
          size: file.size,
          lastOpened: file.opened,
          lastModified: file.modified,
          synced: false, // TODO use a global setting to prefill this
        }},
      })),
    }
    const {store} = this.props
    store.actions.insertTreeAfter(store.state.active, tree, true)
    console.log('ok gonna get the dbs in the house')
    const actions = files.map(({file, getContents}) => () => {
      const {withAttachments, withoutAttachments} = getContents()
      console.log('now inserting', file.title)
      const pouchDb = new PouchDB(`doc_${file._id}`)
      let p = Promise.resolve()
      if (withoutAttachments.length) {
        p = pouchDb.bulkDocs({docs: withoutAttachments, new_edits: false})
      }
      withAttachments.forEach(fn => {
        p = p.then(() => fn().then(doc => {
          return pouchDb.bulkDocs({docs: [doc], new_edits: false})
        }))
      })
      return p.then(() => pouchDb.close())
    })
    this.setState({left: actions.length, total: actions.length})
    const next = () => (
      this.setState({left: actions.length}),
      actions.length ? actions.pop()().then(next) : Promise.resolve()
    )
    // TODO maybe sequentially?
    next().then(() => {
      console.log('finished importing!')
      this.setState({loading: false, file: null, error: null})
    }, err => {
      console.error(err)
      this.setState({loading: false, error: err.message})
    })
    // TODO actually sync the stuff
  }

  render() {
    if (this.state.loading) {
      return <div>Processing {this.state.total && `${this.state.total - this.state.left} / ${this.state.total}`}...</div>
    }
    if (this.state.file) {
      return <div className={css(styles.container)}>
        <div>{this.state.file.name}</div>
        <div>{readableSize(this.state.file.size)}</div>
        <button
          onClick={this.onImport}
        >
          Import from zip
        </button>
        {this.state.error}
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

