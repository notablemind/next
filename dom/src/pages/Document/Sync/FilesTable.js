// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Icon from 'treed/views/utils/Icon'

export default class FilesTable extends Component {
  constructor() {
    super()
    this.state = {
      selected: {}
    }
  }

  toggleAll = (allSelected) => {
    const selected = {}
    this.props.files.forEach(f => selected[f.id] = !allSelected)
    this.setState({selected})
  }

  toggle = id => {
    this.setState({
      selected: {
        ...this.state.selected,
        [id]: !this.state.selected[id],
      }
    })
  }

  renderActions() {
    const selecteds = this.props.files.filter(f => this.state.selected[f.id])
    if (!selecteds.length) return
    let status = null
    selecteds.forEach(f => {
      const st = !f.local ? 'remote' : f.sync ? 'synced' : 'local'
      if (status && status !== st) status = 'mixed'
      if (!status) status = st
    })
    if (status === 'mixed') {
      return 'To perform bulk operations, all files must have the same status'
    }

    const name = selecteds.length === 1 ? 'file' : (selecteds.length + ' files')
    return <div>
      <DeleteButton
        label={"Delete " + name}
        onClick={() => this.deleteFiles}
      />
    </div>
  }

  render() {
    const {files} = this.props
    const {selected} = this.state
    const allSelected = !files.some(f => !selected[f.id])
    return <div className={css(styles.container)}>
      <div className={css(styles.header)}>
        <Check
          checked={allSelected}
          onClick={() => this.toggleAll(allSelected)}
        />
      </div>
      <div className={css(styles.scroll)}>
      {files.map(file => (
        <div
          key={file.id}
          className={css(styles.file)}
          onClick={() => this.toggle(file.id)}
        >
          <Check checked={selected[file.id]} />
          <div style={{flexBasis: 10}}/>
          {file.title}
          <div style={{flex: 1}} />
          {file.size}
          <div style={{flexBasis: 10}} />
          <div className={css(styles.status)}>
            {!file.local
              ? 'remote'
              : file.sync
              ? 'synced'
              : 'local'}
          </div>
        </div>
      ))}
      </div>
      {this.renderActions()}
    </div>
  }
}

const Check = ({checked, onClick}) => (
  <Icon
    name={checked
      ? "ios-checkmark"
      : "ios-checkmark-outline"}
    className={css(styles.icon)}
    onClick={onClick}
    color={checked ? "rgb(0, 193, 58)" : "#ccc"}
  />
)


class DeleteButton extends Component {
  constructor() {
    super()
    this.state = {doublecheck: false}
  }

  render() {
    const {label, onClick} = this.props
    if (!this.state.doublecheck) {
      return <Button
        label={label}
        onClick={() => this.setState({doublecheck: true})}
      />
    }

    return <div style={{flexDirection: 'row'}}>
      <Button
        label="Really delete?"
        onClick={onClick}
      />
      <div style={{flexBasis: 4}} />
      <Button
        label="Just kidding"
        onClick={() => this.setState({doublecheck: false})}
      />
    </div>
  }
}

const Button = ({label, onClick, color='white'}) => (
  <button
    className={css(styles.button)}
    style={{
      backgroundColor: color,
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
  },

  button: {
    borderRadius: 4,
    border: 'none',
    boxShadow: '0 1px 2px #ccc',
    // backgroundColor: 'white',
  },

  scroll: {
    flex: 1,
    overflow: 'auto',
  },

  header: {
    padding: '5px 10px',
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0 1px 2px #ccc',
  },

  status: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 12,
  },

  statusIcon: {
    fontSize: 14,
    marginLeft: 5,
  },

  icon: {
    fontSize: 24,
    cursor: 'pointer',
    ':hover': {
      color: 'rgb(0, 232, 70)',
    },
  },

  file: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '5px 10px',
    cursor: 'pointer',

    ':hover': {
      backgroundColor: '#eee',
    },
  },
})
