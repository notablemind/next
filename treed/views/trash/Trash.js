// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import ContextMenu from '../context-menu/ContextMenu'
import TrashItem from './TrashItem'

type State = {}

const nonempty = txt => (txt.length ? txt : null)

const findTrash = store => {
  const trashIds = Object.keys(store.db.data).filter(
    id => store.db.data[id].trashed,
  )
  trashIds.sort((a, b) => store.db.data[a].trashed - store.db.data[b].trashed)
  return trashIds
}

export default class Trash extends Component {
  _sub: any
  state: *
  constructor(props: *) {
    super()
    const {store} = props
    this._sub = store.setupStateListener(
      this,
      store => [
        store.events.mode(),
        store.events.activeView(),
        store.events.contextMenu(),
        store.events.viewState(),
      ],
      store => ({
        mode: store.getters.mode(),
        isActiveView: store.getters.isActiveView(),
        contextMenu: store.getters.contextMenu(),
        view: store.getters.viewState(),
        // dropping: store.getters.dropping(),
        // trashed: !this.state ? findTrash(store) : this.state.trashed,
      }),
    )
  }

  componentDidMount() {
    this._sub.start()
    const {store} = this.props
    store.state.view.items = findTrash(store)
    store.emit(store.events.viewState())
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  render() {
    const {store} = this.props
    const {items, selected = 0} = this.state.view
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.results)}>
          {!items ||
            (!items.length &&
              <div className={css(styles.empty)}>
                Nothing has been trashed!
              </div>)}
          {items &&
            items.map((id, i) => (
              <TrashItem
                selected={i === selected}
                onClick={() => {
                  store.actions.setSelected(items.indexOf(id))
                }}
                id={id}
                key={id}
                store={store}
              />
            ))}
        </div>
        {this.state.contextMenu &&
          <ContextMenu
            pos={this.state.contextMenu.pos}
            menu={this.state.contextMenu.menu}
            onClose={this.props.store.actions.closeContextMenu}
          />}
      </div>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    // position: 'relative',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
  },
  results: {
    padding: 50,
  },
})
