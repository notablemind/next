// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import TrashItem from './TrashItem'

type State = {
}

const nonempty = txt => txt.length ? txt : null

const findTrash = (store) => {
  const trashIds = Object.keys(store.db.data).filter(id => store.db.data[id].trashed)
  trashIds.sort((a, b) => store.db.data[a].trashed - store.db.data[b].trashed)
  return trashIds
}

export default class Trash extends Component {
  _sub: any
  state: *
  constructor(props: *) {
    super()
    this._sub = props.store.setupStateListener(
      this,
      store => [
        store.events.mode(),
        store.events.activeView(),
        store.events.contextMenu(),
      ],
      store => ({
        mode: store.getters.mode(),
        isActiveView: store.getters.isActiveView(),
        contextMenu: store.getters.contextMenu(),
        view: store.getters.viewState(),
        dropping: store.getters.dropping(),
        trashed: !this.state ? findTrash(store) : this.state.trashed,
      }),
    )
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  render() {
    const {store} = this.props
    return <div className={css(styles.container)}>
      <div className={css(styles.results)}>
        {!this.state.trashed.length
          && <div className={css(styles.empty)}>
            Nothing has been trashed!
          </div>}
        {this.state.trashed.map(id => (
          <TrashItem
            id={id}
            key={id}
            store={store}
          />
        ))}
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
  },
  results: {
  },
})


