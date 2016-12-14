// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Body from '../body'

export default class ListItem extends Component {
  _unsub: () => void
  state: any

  constructor({store, id}: any) {
    super()

    const stateFromStore = store => ({
      node: store.getters.node(id),
      isActive: store.getters.isActive(id),
      editState: store.getters.editState(id),
    })

    this.state = stateFromStore(store)

    this._unsub = store.on([
      store.events.node(id),
      store.events.nodeView(id),
    ], () => this.setState(stateFromStore(store)))
  }

  componentWillUnmount() {
    this._unsub()
  }

  shouldComponentUpdate(nextProps: any, nextState: any) {
    return nextState !== this.state
  }

  render() {
    if (!this.state.node) {
      return <div>loading...</div>
    }

    const collapsed = this.state.node.views.list && this.state.node.views.list.collapsed
    const isRoot = this.props.depth === 0
    return <div className={css(styles.container) + ` Node_item Node_level_${this.props.depth}` + (isRoot ? ' Node_root' : '')}>
      <div className={css(styles.top) + ' Node_top'}>
        {!isRoot && this.state.node.children.length > 0 &&
          <div
            className={css(styles.collapser,
                          collapsed && styles.collapsed) + ' Node_collapser'}
            onClick={() => this.props.store.actions.toggleCollapse(this.props.id)}
          />}
        <Body
          node={this.state.node}
          depth={this.props.depth}
          isActive={this.state.isActive}
          editState={this.state.editState}
          actions={this.props.store.actions}
        />
      </div>
      <div className={css(styles.children) + ' Node_children'}>
        {!collapsed && this.state.node.children.map(id => (
          <ListItem
            store={this.props.store}
            depth={this.props.depth + 1}
            id={id}
            key={id}
          />
        ))}
      </div>
    </div>
  }
}

// const collapserWidth =

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },

  top: {
    ':hover': {
      backgroundColor: '#eee',
    },
  },

  collapser: {
    width: '.7em',
    height: '.7em',
    borderRadius: '.35em',
    backgroundColor: '#ccc',
    position: 'absolute',
    top: '.5em',
    // marginTop: -10,
    right: '100%',
    marginRight: 'calc(.35em + 1px)',
    cursor: 'pointer',
    opacity: .2,
    ':hover': {
      opacity: 1,
      backgroundColor: '#999',
    },
  },

  collapsed: {
    opacity: 1,
    backgroundColor: '#999',
  },

  children: {
    paddingLeft: '.7em',
    borderLeft: '2px solid #eee',
    marginLeft: '.7em',
  },
})
