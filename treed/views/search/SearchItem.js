// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'
import * as colors from '../utils/colors'

import Body from '../body'

export default class SearchItem extends Component {
  _sub: any
  state: *
  keyActions: *
  constructor({store, id}: any) {
    super()

    this._sub = store.setupStateListener(
      this,
      store => [store.events.node(id), store.events.nodeView(id)],
      store => ({
        node: store.getters.node(id),
        isActive: store.getters.isActive(id),
        editState: store.getters.editState(id),
      }),
    )

    this.keyActions = {
      /*
      onTab: shiftKey => {
        if (shiftKey) {
          store.actions.makeParentsNextSibling()
        } else {
          store.actions.makePrevSiblingsLastChild()
        }
      },
      onEnter: text => {
        const nid = store.actions.createAfter(id, text)
        if (nid) {
          store.actions.editStart(nid)
        }
      },
      */
      // onLeft: () => store.actions.focusPrev(id, 'end'),
      // onRight: () => store.actions.focusNext(id, 'start'),
      // onUp: store.actions.focusPrev,
      // onDown: store.actions.focusNext,

      setContent: text => store.actions.setContent(id, text),
    }
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  render() {
    const contentClassName = css(
      // styles.contentWrapper,
      this.state.isActive && styles.active,
      this.state.isSelected && styles.selected,
      this.state.isCutting && styles.cutting,
      this.state.isDragging && styles.dragging,
      this.state.editState && styles.editing,
    )
    return (
      <Body
        node={this.state.node}
        editState={this.state.editState}
        actions={this.props.store.actions}
        contentClassName={contentClassName}
        // onHeightChange={this.ensureInView}
        keyActions={this.keyActions}
        store={this.props.store}
        orientation="wide"
      />
    )
  }
}

const activeStyles: any = {}
;['active', 'selected', 'editing', 'cutting', 'dragging'].forEach(key => {
  activeStyles[key] =
    // {outline: `2px solid ${colors[key]}`}
    {
      boxShadow: `
      -2px -2px 0 ${colors[key]},
      -2px 2px 0 ${colors[key]},
      2px -2px 0 ${colors[key]},
      2px 2px 0 ${colors[key]}
    `,
    }
})
activeStyles.dragging.backgroundColor = colors.draggingBackground

const styles = StyleSheet.create({
  ...activeStyles,
})
