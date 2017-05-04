// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import Icon from 'treed/views/utils/Icon'

export default class FilesTable extends Component {
  props: {
    remoteOnly: Array<{
      appProperties: {nmId: string, nmType: 'doc'},
      id: string,
      name: string,
      trashed: boolean,
      version: number
    }>,
    localFiles: Array<{
      id: string,
      title: string,
      lastModified: number,
      lastOpened: number,
      size: number,
      sync: ?{}
    }>
  }

  state: {selected: {[key: string]: boolean}, loading: boolean}
  constructor() {
    super()
    this.state = {
      selected: {},
      loading: false
    }
  }

  toggleAll = (allSelected: boolean) => {
    const selected = {}
    this.props.localFiles.forEach(f => (selected[f.id] = !allSelected))
    this.props.remoteOnly.forEach(
      f => (selected[f.appProperties.nmId] = !allSelected)
    )
    this.setState({selected})
  }

  toggle = (id: string) => {
    this.setState({
      selected: {
        ...this.state.selected,
        [id]: !this.state.selected[id]
      }
    })
  }

  deleteFiles = () => {
    const files = this.props.localFiles.filter(f => this.state.selected[f.id])
    this.props.deleteFiles(files)
  }

  syncFiles = () => {
    const files = this.props.localFiles.filter(f => this.state.selected[f.id])
    this.setState({loading: true})
    this.props
      .syncFiles(files)
      .then(() => this.setState({loading: false, selected: {}}))
  }

  downloadFiles = () => {
    const files = this.props.remoteOnly.filter(
      f => this.state.selected[f.appProperties.nmId]
    )
    this.setState({loading: true})
    this.props
      .downloadFiles(files)
      .then(() => this.setState({loading: false, selected: {}}))
  }

  renderActions() {
    const selecteds = this.props.localFiles
      .filter(f => this.state.selected[f.id])
      .concat(
        this.props.remoteOnly.filter(
          f => this.state.selected[f.appProperties.nmId]
        )
      )
    if (!selecteds.length) return
    let status = null
    selecteds.forEach(f => {
      const st = f.appProperties ? 'remote' : f.sync ? 'synced' : 'local'
      if (status && status !== st) status = 'mixed'
      if (!status) status = st
    })
    // TODO not totally true, e.g. deleting
    if (status === 'mixed') {
      return 'To perform bulk operations, all files must have the same status'
    }

    const name = selecteds.length === 1 ? 'file' : selecteds.length + ' files'
    return (
      <div style={{flexDirection: 'row'}}>
        <DeleteButton label={'Delete ' + name} onClick={this.deleteFiles} />
        {status === 'local' &&
          <Button
            label={'Enable syncing for ' + name}
            onClick={this.syncFiles}
          />}
        {status === 'remote' &&
          <Button label={'Download ' + name} onClick={this.downloadFiles} />}
      </div>
    )
  }

  render() {
    const {localFiles, remoteOnly, remoteById} = this.props
    const {selected, loading} = this.state
    // TODO render remoteOnly files too
    const allSelected = !localFiles.some(f => !selected[f.id])
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.header)}>
          <Check
            checked={allSelected}
            onClick={() => this.toggleAll(allSelected)}
          />
        </div>
        <div className={css(styles.scroll)}>
          {localFiles.map(file => (
            <div
              key={file.id}
              className={css(styles.file)}
              onClick={() => this.toggle(file.id)}
            >
              <Check checked={selected[file.id]} />
              <div style={{flexBasis: 10}} />
              {file.title}
              <div style={{flex: 1}} />
              {file.size}
              <div style={{flexBasis: 10}} />
              <div className={css(styles.status)}>
                {file.sync ? 'synced' : 'local'}
              </div>
            </div>
          ))}
          {remoteOnly.map(file => (
            <div
              key={file.appProperties.nmId}
              className={css(styles.file)}
              onClick={() => this.toggle(file.appProperties.nmId)}
            >
              <Check checked={selected[file.appProperties.nmId]} />
              <div style={{flexBasis: 10}} />
              {file.name}
              <div style={{flex: 1}} />
              <div style={{flexBasis: 10}} />
              <div className={css(styles.status)}>
                remote
              </div>
            </div>
          ))}
        </div>
        {this.renderActions()}
        {loading && <div className={css(styles.overlay)}>Loading</div>}
      </div>
    )
  }
}

const Check = ({checked, onClick}) => (
  <Icon
    name={checked ? 'ios-checkmark' : 'ios-checkmark-outline'}
    className={css(styles.icon)}
    onClick={onClick}
    color={checked ? 'rgb(0, 193, 58)' : '#ccc'}
  />
)

class DeleteButton extends Component {
  state: {doublecheck: boolean}
  constructor() {
    super()
    this.state = {doublecheck: false}
  }

  render() {
    const {label, onClick} = this.props
    if (!this.state.doublecheck) {
      return (
        <Button
          label={label}
          color="red"
          textColor="white"
          onClick={() => this.setState({doublecheck: true})}
        />
      )
    }

    return (
      <div style={{flexDirection: 'row'}}>
        <Button
          label="Just kidding"
          onClick={() => this.setState({doublecheck: false})}
        />
        <div style={{flexBasis: 4}} />
        <Button
          label="Really delete"
          color="red"
          textColor="white"
          onClick={onClick}
        />
      </div>
    )
  }
}

const Button = ({label, onClick, color = 'white', textColor = '#555'}) => (
  <button
    className={css(styles.button)}
    style={{
      backgroundColor: color,
      color: textColor
    }}
    onClick={onClick}
  >
    {label}
  </button>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative'
  },

  button: {
    borderRadius: 4,
    border: 'none',
    boxShadow: '0 1px 4px #555',
    margin: 4,
    padding: '5px 10px',
    textWrap: 'nowrap',
    whiteSpace: 'nowrap'
    // backgroundColor: 'white',
  },

  scroll: {
    flex: 1,
    overflow: 'auto'
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#aaa',
    cursor: 'normal',
    opacity: 0.3,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    fontWeight: 'bold'
  },

  header: {
    padding: '5px 10px',
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0 1px 2px #ccc'
  },

  status: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 12
  },

  icon: {
    fontSize: 24,
    cursor: 'pointer',
    ':hover': {
      color: 'rgb(0, 232, 70)'
    }
  },

  file: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '5px 10px',
    cursor: 'pointer',

    ':hover': {
      backgroundColor: '#eee'
    }
  }
})
