// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import TableItem from './TableItem'

// import Dragger from './Dragger'
import ContextMenu from '../context-menu/ContextMenu'


type MenuItem = any
type Store = any

const defaultAttributes = {
  created: {
    title: 'Created',
    type: 'date',
    editable: false,
  },
  modified: {
    title: 'Modified',
    type: 'date',
    editable: false, // maybe allow editing?
  },
  type: {
    title: 'Type',
    type: 'text',
    editable: false, // TODO maybe have a custom dropdown or sth
  },
}

// TODO maybe be fancy about column widths (using a css class for speed &
// live-preview of resizing)
type ViewSettings = {
  // NOTE: the main column (w/ `content` etc) is always on the left, flex: 1,
  // and is not included in this list.
  columns: Array<{
    id: string,
    type: 'text' | 'date' | 'int' | 'checkbox' | 'attribute', // TODO maybe allow custom column types?
    attribute: 'created' | 'modified',
    width: number, // if zero, then we flex: 1?
  }>,
}

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

// TODO I want a way for plugins to hook into different view types.
// In this case, I want the `table` view type to be able to declare that
// plugins can expose a `tableColunms` property or sth, and then `treed` will
// aggregate those in its `organizePlugins` deal.

export default class TableView extends Component {
  state: State
  props: Props
  _sub: any
  _nodes: {[key: string]: any}
  // dragger: Dragger
  // dropper: Dragger
  // dropAgain: bool

  constructor(props: Props) {
    super()
    this._sub = props.store.setupStateListener(
      this,
      store => [
        store.events.root(),
        store.events.mode(),
        store.events.activeView(),
        store.events.contextMenu(),
        store.events.viewSettings(),
      ],
      store => ({
        root: store.getters.root(),
        mode: store.getters.mode(),
        isActiveView: store.getters.isActiveView(),
        contextMenu: store.getters.contextMenu(),
        viewSettings: store.getters.viewSettings(),
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

  onContextMenu = (e: any) => {
    e.preventDefault()
    this.props.store.actions.openGeneralContextMenu(e.clientX, e.clientY)
  }

  render() {
    const root = this.props.store.state.root
    const depth = findDepth(root, this.props.store.db.data)
    return <div
      className={css(styles.container)}
      // onDragOver={this.onDrag}
      // onDrop={this.onDrop}
      // onDragLeave={this.stopDropping}
      onContextMenu={this.onContextMenu}
    >
      <div className={css(styles.scroller)}>
        <div
          className={css(styles.thinWidth)}
        >
          <TableItem
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

