// @flow

import React, {Component} from 'react'
// YOLO move this to somewhere better
import withStore from '../../dom/src/pages/Document/withStore'

import Icon from 'treed/views/utils/Icon'
import type {Store, Plugin, GlobalStore} from 'treed/types'

import {css, StyleSheet} from 'aphrodite'

const PLUGIN_ID = 'files'

export default class FileNode extends Component {
  constructor({nm, node}) {
    super()
    this.state = {
      file: nm.meta[node.types.file.fileid],
    }
  }

  componentWillMount() {
    this._unsub = this.props.nm.onMetaById(this.props.node.types.file.fileid, file => this.setState({file}))
  }

  componentWillUnmount() {
    this._unsub()
  }

  onNav = e => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    this.props.store.actions.navigateToFile(this.props.node._id)
  }

  render() {
    const {node} = this.props
    const {file} = this.state
    return file
      ? <div
          className={css(styles.row)}
          onMouseDownCapture={this.onNav}
        >
          <Icon className={css(styles.icon)} name="document-text" />
          {file.title}
          <div style={{flex: 1}}/>
          <div className={css(styles.date)}>
          {readableDate(file.lastOpened)}
          </div>
          <Strut size={10} />
          {file.size + ''}
          <Strut size={10} />
          <SyncIcon synced={file.synced} />
          <Strut size={5} />
        </div>
      : <div
          className={css(styles.row, styles.rowDisabled)}
          onMouseDownCapture={this.onNav}
        >
          <Icon className={css(styles.icon)} name="document-text" />
          {node.content}
        </div>
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },

  rowDisabled: {
    fontStyle: 'italic',
    color: '#aaa',
  },

  date: {
    fontSize: '70%',
  },

  icon: {
    fontSize: 24,
    marginLeft: 5,
    marginRight: 10,
    color: '#6f63ff',
  },
})

const startOfDay = date => {
  const d = new Date(date)
  d.setHours(0)
  d.setMinutes(0)
  d.setSeconds(0)
  d.setMilliseconds(0)
  return d.getTime()
}

const daysOfWeek = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun']

const readableDate = date => {
  const today = Date.now()
  const startOfToday = startOfDay(today)
  const startOfThat = startOfDay(date)
  const d = new Date(date)
  if (startOfToday === startOfThat) {
    let h = d.getHours()
    let pm = false
    let m = d.getMinutes()
    if (h >= 12) pm = true
    if (h > 12) {
      h -= 12
    }
    if (m < 10) m = `0${m}`
    return `${h}:${m}${pm ? 'pm' : 'am'}`
  }
  const daysBetween = Math.round((startOfToday - startOfThat) / (1000 * 60 * 60 * 24))
  if (daysBetween === 1) {
    return 'Yesterday'
  } else if (daysBetween < 7) {
    return daysOfWeek[d.getDay()]
  } else {
    return d.toLocaleDateString()
  }
}

const Strut = ({size}) => <div style={{flexBasis: size}} />

const SyncIcon = ({synced}) => {
  if (synced) {
    return <Icon size={24} name="ios-loop" />
  } else {
    return <div style={{position: 'relative'}}>
      <Icon size={24} color="#aaa" name="ios-loop" />
      <Icon size={24} color="#aaa" name="ios-close-empty" style={{
        // transform: 'rotate(-45deg)',
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        // left: -1,
      }} />
    </div>
  }
}

