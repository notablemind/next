
import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Body from '../body'
import dragger from './dragger'

export default class Child extends Component {
  constructor({id, store}) {
    super()
    this._sub = store.setupStateListener(
      this,
      store => [store.events.node(id), store.events.nodeView(id)],
      store => ({
        node: store.getters.node(id),
        isActive: store.getters.isActive(id),
        isDragging: store.getters.isDragging(id),
        isSelected: store.state.selected &&
          store.state.selected[id],
        editState: store.getters.editState(id),
      }),
    )

    this.keyActions = {
      setContent: text => store.actions.setContent(id, text),
      onEnter: text => store.actions.createAfter(id, text),
      onUp: () => store.actions.focusPrev(),
      onDown: () => store.actions.focusNext(),
      onLeft: () => store.actions.focusPrev(),
      onRight: () => store.actions.focusNext(),
      onTab: null,
    }
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
    delete this.props.nodeMap[this.props.id]
  }

  onMouseDown = evt => {
    evt.stopPropagation()
    evt.preventDefault()

    let moved = false
    // Hmmmm should this all just be moved up the line?
    // b/c then I can accound for multi-select or whatever
    this.props.startChildDragging(evt, this.props.id)
    /*
    this._dragger = dragger(e, {
      move: (x, y, w, h) => {
        moved = moved || Math.abs(w) > 5 || Math.abs(h) > 5
        this.props.setChildDrop(x + w, y + h)
      },

      done: (x, y, w, h) => {
        if (!moved) {
          this.props.store.actions.edit(this.props.id)
        }
        this.props.releaseChildDrop(moved)
      },
    })
    */
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState !== this.state
  }

  render() {
    return <div
      ref={n => n && (this.div = this.props.nodeMap[this.props.id] = n)}
      className={css(styles.child,
                     this.state.isActive && styles.activeChild,
                     this.state.isDragging && styles.dragging,
                    )}
      onMouseDownCapture={this.onMouseDown}
      onContextMenu={this.onContextMenu}
    >
      <Body
        node={this.state.node}
        isActive={this.state.isActive}
        isSelected={this.state.isSelected}
        // isCutting={this.state.isCutting}
        actions={this.props.store.actions}
        editState={this.state.editState}
        keyActions={this.keyActions}
        store={this.props.store}
      />
    </div>
  }
}

const styles = StyleSheet.create({

  dragging: {
    backgroundColor: '#aaa',
  },

  child: {
    padding: '3px 5px',
    cursor: 'move',
    fontSize: '90%',
  },
})
