// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import ListItem from './ListItem'
import actions from './actions'

import Dragger from './Dragger'

const preWalk = (nodes, root, fn) => {
  fn(root)
  nodes[root].children.forEach(child => preWalk(nodes, child, fn))
}

const getAllMeasurements = (nodes, root, measurements) => {
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
    const measurements = []
    preWalk(
      this.state.store.db.data,
      this.state.store.state.root,
      id => {
        measurements.push([id, this._nodes[id].getBoundingClientRect()])
      }
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
    }
    const {id, at} = this.dragger.getCurrent()
    this.state.store.actions.dragTo(id, at)
  }

  render() {
    const root = this.state.store.state.root
    const depth = findDepth(root, this.state.store.db.data)
    return <div className={css(styles.container)}>
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

