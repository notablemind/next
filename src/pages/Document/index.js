// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'
import PouchDB from 'pouchdb'
import Treed from '../../../treed'
import treedPouch from '../../../treed/pouch'

export default class Document extends Component {
  state: {
    db: any,
    treed: ?Treed,
  }

  constructor(props: any) {
    super()
    this.state = {
      db: new PouchDB('doc_' + props.params.id),
      treed: null,
    }

    if (props.makeRemoteDocDb) {
      props.makeRemoteDocDb(props.params.id)
      .then(db => this.state.db.sync(db, {live: true, retry: true}))
    }
    this.makeTreed(this.state.db)
  }

  makeTreed(db: any) {
    if (this.state.treed) {
      // TODO this.state.treed.destroy()
    }
    db.get('settings')
    .catch(err => ({}))
    .then(doc => {
      const treed = new Treed(doc, treedPouch(this.state.db))
      treed.ready.then(() => this.setState({treed}))
    })
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.params.id !== this.props.params.id) {
      const db = new PouchDB('doc_' + nextProps.params.id)
      this.setState({
        db: db,
      })
      this.makeTreed(db)
      if (nextProps.makeRemoteDocDb) {
        nextProps.makeRemoteDocDb(nextProps.params.id)
        .then(db => this.state.db.sync(db, {live: true, retry: true}))
      }
    } else if (nextProps.makeRemoteDocDb && !this.props.makeRemoteDocDb) {
      nextProps.makeRemoteDocDb(nextProps.params.id)
      .then(db => this.state.db.sync(db, {live: true, retry: true}))
    }
  }

  componentWillUnmount() {
    this.state.db.close()
    // TODO this.state.treed.destroy()
  }

  render() {
    if (!this.state.treed) return <div>Loading...</div>
    return <div>
      <ListView
        treed={this.state.treed}
      />
    </div>
  }
}

class ListView extends Component {
  state: any
  _unsub: () => void

  constructor(props) {
    super()
    const store = props.treed.registerView('root', 'list')
    const stateFromStore = store => ({
      root: store.getters.root(),
    })
    this.state = {
      store: store,
      ...stateFromStore(store),
    }

    this._unsub = store.on([
      store.events.root(),
      // store.events.activeView(),
    ], () => this.setState(stateFromStore(store)))
  }

  componentWillUnmount() {
    this._unsub()
  }

  render() {
    return <div>
      <button onClick={() => this.state.store.undo()}>
        Undo
      </button>
      <button onClick={() => this.state.store.redo()}>
        Redo!
      </button>
      List view!
      <ListItem store={this.state.store} id={this.state.store.state.root} />
    </div>
  }
}


class ListItem extends Component {
  _unsub: () => void
  state: any

  constructor({store, id}) {
    super()

    const stateFromStore = store => ({
      node: store.getters.node(id),
      isActive: store.getters.isActive(id),
      editState: store.getters.editState(id),
    })

    this.state = stateFromStore(store)
    if (this.state.node) {
      this.state.tmpText = this.state.node.content
    }

    this._unsub = store.on([
      store.events.node(id),
      store.events.nodeView(id),
    ], () => {
      const next = stateFromStore(store)
      if (next.editState && !this.state.editState) {
        next.tmpText = next.node.content
      }

      if (!next.editState && this.state.editState &&
          this.state.tmpText !== next.node.content) {
        store.actions.setContent(id, this.state.tmpText)
      }
      this.setState(next)
    })
  }

  componentWillUnmount() {
    this._unsub()
  }

  onBlur = () => {
    // HACK to prevent flicker
    this.props.store.actions.setContent(this.props.id, this.state.tmpText)
    this.state.node.content = this.state.tmpText
    this.props.store.actions.normalMode()
  }

  onClick = () => {
    this.props.store.actions.edit(this.props.id)
  }

  render() {
    if (!this.state.node) {
      return <div>loading...</div>
    }
    if (this.state.editState) {
      return <div>
        <input
          value={this.state.tmpText}
          onChange={e => this.setState({tmpText: e.target.value})}
          onBlur={this.onBlur}
        />
      </div>
    }
    return <div onClick={this.onClick}>
      Item {this.state.node.content}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
  },
})
