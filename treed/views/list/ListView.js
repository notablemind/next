// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import ListItem from './ListItem'
import actions from './actions'

import Dragger from './Dragger'

const preWalk = (nodes, root, viewType, fn) => {
  const node = nodes[root]
  const hasOpenChildren = node.children.length > 0 &&
    !(node.views[viewType] && node.views[viewType].collapsed)
  fn(root, hasOpenChildren)
  if (hasOpenChildren) {
    nodes[root].children.forEach(child => preWalk(nodes, child, viewType, fn))
  }
}

const getAllMeasurements = (nodes, divs, viewType, root) => {
  const measurements = []
  preWalk(
    nodes,
    root,
    viewType,
    (id, hasOpenChildren) => {
      measurements.push([id, divs[id].getBoundingClientRect(), hasOpenChildren])
    }
  )
  return measurements
}

export default class ListView extends Component {
  state: any
  _sub: any
  _nodes: {[key: string]: any}

  constructor(props: any) {
    super()
    const store = props.treed.registerView('root', 'list', actions)
    this._sub = store.setupStateListener(
      this,
      store => [
        store.events.root(),
        store.events.mode(),
        store.events.activeView(),
      ],
      store => ({
        root: store.getters.root(),
        mode: store.getters.mode(),
        isActiveView: store.getters.isActiveView(),
      }),
    )
    this.state.store = store

    this._nodes = {}
  }

  // drag
  // drop
  // hmmmmm so I want "onmousemove" while dragging

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
    this.props.treed.unregisterView(this.state.store.id)
  }

  componentDidUpdate(prevProps, prevState) {
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
      this.state.store.db.data,
      this._nodes,
      this.state.store.state.viewType,
      this.state.store.state.root,
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
      this.state.store.actions.normalMode()
      return
    }
    const {id, at} = this.dragger.getCurrent()
    this.state.store.actions.dragTo(id, at)
  }

  onDrag = (e: any) => {
    e.stopPropagation()
    if (!this.dropper) {
      const measurements = getAllMeasurements(
        this.state.store.db.data,
        this._nodes,
        this.state.store.state.viewType,
        this.state.store.state.root,
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
    console.log('dropping', id, at)
    this.dropper.destroy()
    this.dropper = null
    const data = e.dataTransfer
    if (data.items.length === 1 && data.files.length === 0 &&
        data.items[0].kind === 'string') {
      const type = data.items[0].type
      data.items[0].getAsString(text => {
        this.state.store.actions.dropString(id, at, text, type)
      })
    } else if (
      data.files.length === 1 &&
      data.items.length === 1
    ) {
      this.state.store.actions.dropFile(id, at, data.files[0])
    } else {
      // ummm what other cases are there?
      debugger
    }
  }

  render() {
    const root = this.state.store.state.root
    const depth = findDepth(root, this.state.store.db.data)
    return <div
      className={css(styles.container)}
      onDragOver={this.onDrag}
      onDrop={this.onDrop}
    >
      <ListItem
        id={root}
        key={root}
        depth={depth}
        nodeMap={this._nodes}
        store={this.state.store}
      />
    </div>
  }
}

const findDepth = (id, data) => {
  if (id === 'root' || !id) return 0
  return 1 + findDepth(data[id].parent, data)
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
})

