
import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Body from '../body'
import dragger from './dragger'
import * as colors from '../utils/colors'
import ensureInView from '../../ensureInView'

export default class Child extends Component {
  constructor({id, store}) {
    super()
    this._sub = store.setupStateListener(
      this,
      store => [store.events.node(id), store.events.nodeView(id)],
      store => ({
        node: store.getters.node(id),
        activeIsJump: store.state.activeIsJump,
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
      onUp: () => store.actions.focusPrevSibling(),
      onDown: () => store.actions.focusNextSibling(),
      onLeft: () => store.actions.focusPrevSibling(id, 'end'),
      onRight: () => store.actions.focusNextSibling(id, 'start'),
      onTab: null,
    }
  }

  componentDidMount() {
    this._sub.start()
    if (this.state.isActive && this.div) {
      this.ensureInView()
    }
  }

  componentWillUnmount() {
    this._sub.stop()
    delete this.props.nodeMap[this.props.id]
  }

  componentDidUpdate(_: any, prevState: any) {
    if (!prevState.isActive && this.state.isActive && this.div) {
      this.ensureInView()
    }
  }

  ensureInView = () => {
    ensureInView(this.div, this.state.activeIsJump, 30)
  }

  onMouseDown = evt => {
    evt.stopPropagation()
    evt.preventDefault()

    if (evt.shiftKey) {
      this.props.store.actions.selectWithSiblings(this.props.id)
    } else {
      this.props.startChildDragging(evt, this.props.id)
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState !== this.state
  }

  render() {

    const activityStyles = css(
      styles.contentWrapper,
      this.state.isActive && styles.active,
      this.state.isSelected && styles.selected,
      this.state.isCutting && styles.cutting,
      this.state.isDragging && styles.dragging,
      this.state.editState && styles.editing,
    )

    return <div
      ref={n => n && (this.div = this.props.nodeMap[this.props.id] = n)}
      className={css(styles.child,
                     this.state.isActive && styles.activeChild,
                     this.state.isDragging && styles.dragging,
                    ) + ' ' + activityStyles}
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
        onHeightChange={this.ensureInView}
        keyActions={this.keyActions}
        store={this.props.store}
      />
    </div>
  }
}

const activeStyles = {}
;['active', 'selected', 'editing', 'cutting', 'dragging'].forEach(key => {
  activeStyles[key] =
    // {outline: `2px solid ${colors[key]}`}
    {boxShadow: `
      inset -2px -2px 0 ${colors[key]},
      inset -2px 2px 0 ${colors[key]},
      inset 2px -2px 0 ${colors[key]},
      inset 2px 2px 0 ${colors[key]}
    `}
})
activeStyles.dragging.backgroundColor = colors.draggingBackground


const styles = StyleSheet.create({
  ...activeStyles,
  contentWrapper: {
    borderRadius: 3,
  },

  /*
  dragging: {
    backgroundColor: '#aaa',
  },
  */

  child: {
    padding: '3px 5px',
    cursor: 'move',
    fontSize: '90%',
  },
})
