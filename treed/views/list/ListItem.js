// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Body from '../body'
import ensureInView from '../../ensureInView'

export default class ListItem extends Component {
  _sub: any
  _div: any
  state: any

  constructor({store, id}: any) {
    super()

    this._sub = store.setupStateListener(
      this,
      store => [
        store.events.node(id),
        store.events.nodeView(id),
      ],
      store => ({
        node: store.getters.node(id),
        isActive: store.getters.isActive(id),
        editState: store.getters.editState(id),
      }),
    )
  }

  shouldComponentUpdate(nextProps: any, nextState: any) {
    return nextState !== this.state
  }

  componentDidMount() {
    this._sub.start(this)
    if (this.state.isActive && this._div) {
      ensureInView(this._div)
    }
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  componentDidUpdate(_: any, prevState: any) {
    if (!prevState.isActive && this.state.isActive && this._div) {
      ensureInView(this._div)
    }
  }

  render() {
    if (!this.state.node) {
      return <div>loading...</div>
    }

    const collapsed = this.state.node.views.list && this.state.node.views.list.collapsed
    const isRoot = this.props.store.state.root === this.props.id

    return <div className={css(styles.container) + ` Node_item Node_level_${this.props.depth}` + (isRoot ? ' Node_root' : '')}>
      <div className={css(styles.top) + ' Node_top'} ref={node => {
        this._div = node
        this.props.nodeMap[this.props.id] = node
      }}>
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
          store={this.props.store}
        />
      </div>
      <div className={css(styles.children) + ' Node_children'}>
        {(!collapsed || isRoot) && this.state.node.children.map(id => (
          <ListItem
            store={this.props.store}
            depth={this.props.depth + 1}
            nodeMap={this.props.nodeMap}
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
