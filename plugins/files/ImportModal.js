// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

export default class ImportModal extends Component {
  props: {
    nm: *, // NotableClient
    store: *, // Store thing
    onClose: () => void,
  }

  constructor() {
    super()
    this.state = {
      filename: null,
      fileData: null,
    }
  }

  componentDidMount() {
    if (ELECTRON) {
      require('electron').remote.dialog.showOpenDialog({}, filenames => {
        console.log('got', filenames)
        if (filenames.length) {
          this.setState({
            filename: filenames[0],
            fileData:
              require('fs').readFileSync(filenames[0]),
          })
        }
      })
    }
  }

  doImport() {
    this.setState({importing: true})
    return this.props.nm.importDoc(this.state.filename, this.state.fileData)
      .then(docid => (this.setState({importing: false}), docid))
  }

  linkCurrentNode = docid => {
    this.props.store.actions.makeNodeFile(this.props.store.state.active, docid)
  }

  createNewNode = docid => {
    this.props.store.actions.createNewFileNode(docid)
  }

  render() {
    if (!this.state.fileData) {
      // TODO support non-electron
      return <div className={css(styles.container)}>
        Loading...
      </div>
    }
    // ok, choices are
    const actions = [{
      title: 'Import without creating a file node',
      action: () => this.doImport()
        .then(this.props.onClose),
    }, {
      title: 'Create new node linking to imported file',
      action: () => this.doImport()
        .then(this.createNewNode)
        .then(this.props.onClose),
    }, {
      title: 'Link current node to imported file',
      action: () => this.doImport()
        .then(this.linkCurrentNode)
        .then(this.props.onClose),
    }, {
      title: 'Cancel',
      action: this.props.onClose,
    }]
    return <div className={css(styles.container)}>
      <div className={css(styles.buttons)}>
        {actions.map(action => (
          <button
            key={action.title}
            onClick={action.action}
            className={css(styles.button)}
          >
            {action.title}
          </button>
        ))}
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    width: 400,
    // heigth: 200,
  },

  buttons: {
    flexDirection: 'column',
  },

  button: {
    backgroundColor: 'white',
    border: 'none',
    cursor: 'pointer',
    padding: '5px 10px',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    fontWeight: 'inherit',

    ':hover': {
      backgroundColor: '#eee',
    },
  },
})
