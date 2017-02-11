// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import ListItem from './ListItem'

import Dragger from './Dragger'
import ContextMenu from '../context-menu/ContextMenu'
import processDrop from './processDrop'
import getAllMeasurements from './getAllMeasurements'

type MenuItem = any
type Store = any

type State = {
  root: string,
  mode: string,
  isActiveView: bool,
  contextMenu: ?{
    menu: Array<MenuItem>,
    pos: {top: number, left: number},
  },
  store: Store,
}
type Props = {
  store: any,
}

export default class ListView extends Component {
  state: State
  props: Props
  _sub: any
  _nodes: {[key: string]: any}
  dragger: Dragger
  dropper: Dragger
  dropAgain: bool

  constructor(props: Props) {
    super()
    this._sub = props.store.setupStateListener(
      this,
      store => [
        store.events.root(),
        store.events.mode(),
        store.events.activeView(),
        store.events.contextMenu(),
      ],
      store => ({
        root: store.getters.root(),
        mode: store.getters.mode(),
        isActiveView: store.getters.isActiveView(),
        contextMenu: store.getters.contextMenu(),
      }),
    )

    this._nodes = {}
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  // Reorder Nodes

  componentDidUpdate(prevProps: Props, prevState: State) {
    const nowDragging = this.state.mode === 'dragging' && this.state.isActiveView
    const prevDragging = prevState.mode === 'dragging' && prevState.isActiveView
    if (nowDragging && !prevDragging) {
      this.startDragging()
    } else if (!nowDragging && prevDragging) {
      this.stopDragging()
    }
  }

  startDragging() {
    // TODO use offsets from the scrollTop, also manage the scrolliness
    const measurements = getAllMeasurements(
      this.props.store.db.data,
      this._nodes,
      this.props.store.getters.isCollapsed,
      this.props.store.state.root,
      this.props.store.state.active,
    )
    this.dragger = new Dragger(measurements)
    window.addEventListener('mousemove', this.dragger.onMove)
    window.addEventListener('mouseup', this.onMouseUp, true)
  }

  stopDragging() {
    window.removeEventListener('mousemove', this.dragger.onMove)
    window.removeEventListener('mouseup', this.onMouseUp, true)
    this.dragger.destroy()
    this.dragger = null
  }

  onMouseUp = () => {
    if (!this.dragger) return
    if (!this.dragger.current) {
      this.props.store.actions.normalMode()
      return
    }
    const {id, at} = this.dragger.getCurrent()
    this.props.store.actions.dragTo(id, at)
  }

  // Drag & drop files n stuff

  onDrag = (e: any) => {
    this.dropAgain = true
    e.stopPropagation()
    if (!this.dropper) {
      const measurements = getAllMeasurements(
        this.props.store.db.data,
        this._nodes,
        this.props.store.getters.isCollapsed,
        this.props.store.state.root,
      )
      this.dropper = new Dragger(measurements, true)
    }
    this.dropper.onMove(e)
  }

  onDrop = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    if (!this.dropper) {
      return
    }
    if (!this.dropper.current) {
      this.dropper.destroy()
      this.dropper = null
      return
    }
    const {id, at} = this.dropper.getCurrent()
    this.dropper.destroy()
    this.dropper = null
    const data = e.dataTransfer
    processDrop(data).then(result => {
      if (result.type === 'string') {
        this.props.store.actions.dropString(id, at, result.text, result.mimeType)
      } else {
        const files = result.files
        if (files.length === 1) {
          this.props.store.actions.dropFile(id, at, files[0])
        } else {
          this.props.store.actions.dropFiles(id, at, files)
        }
      }
    })
  }

  stopDropping = (e: any) => {
    this.dropAgain = false
    if (!this.dropper) return
    setTimeout(() => {
      if (!this.dropAgain) {
        console.log('stop dropping')
        this.dropper.destroy()
        this.dropper = null
      }
    }, 10)
  }

  onContextMenu = (e: any) => {
    e.preventDefault()
    this.props.store.actions.openGeneralContextMenu(e.clientX, e.clientY)
  }

  render() {
    const root = this.props.store.state.root
    const depth = findDepth(root, this.props.store.db.data)
    return <div
      className={css(styles.container)}
      onDragOver={this.onDrag}
      onDrop={this.onDrop}
      onDragLeave={this.stopDropping}
      onContextMenu={this.onContextMenu}
    >
      <div className={css(styles.scroller)}>
        <div
          className={css(styles.thinWidth)}
        >
          <ListItem
            id={root}
            key={root}
            depth={depth}
            nodeMap={this._nodes}
            store={this.props.store}
          />
        </div>
      </div>
      {this.state.contextMenu &&
        <ContextMenu
          pos={this.state.contextMenu.pos}
          menu={this.state.contextMenu.menu}
          onClose={this.props.store.actions.closeContextMenu}
        />}
    </div>
  }
}

const findDepth = (id, data) => {
  if (id === 'root' || !id) return 0
  return 1 + findDepth(data[id].parent, data)
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'stretch',
  },

  scroller: {
    flex: 1,
    alignSelf: 'stretch',
    overflow: 'auto',
    padding: 20,
  },

  thinWidth: {
    width: 1000,
    maxWidth: '100%',
    alignSelf: 'center',
  },
})

