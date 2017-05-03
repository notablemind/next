// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import fuzzysearch from 'fuzzysearch'

type Tab = 'search' | 'command' | 'open'

const makeTypeCommands = (store, node) => {
  const commands = []
  Object.keys(store.plugins.nodeTypes).forEach(type => {
    if (type === node.type) return
    const config = store.plugins.nodeTypes[type]
    commands.push({
      id: 'set_type_' + type,
      key: 'set_type_' + type,
      title: 'Set node type: ' + config.title,
      action: () => store.actions.setNodeType(node._id, type),
    })
  })
  return commands
}

const collectCommands = (plugins, store, extraCommands) => {
  const node = store.getters.activeNode()
  const commands = []
  plugins.forEach(plugin => {
    if (plugin.quickActions) {
      commands.push(...plugin.quickActions(store, node).map(a => ({...a, plugin: plugin.id, key: plugin.id + ':' + a.id})))
    }
  })
  commands.push(...extraCommands.map(a => ({...a, key: 'doc:' + a.id})))
  return commands.concat(makeTypeCommands(store, node))
}

const searchCommands = (commands, text) => {
  if (!text || !text.trim()) {
    return commands.map(command => ({key: command.key, title: command.title, command}))
  }
  return commands
  // TODO maybe precache the lowercase versions?
    .filter(command => fuzzysearch(text, command.title.toLowerCase()) || fuzzysearch(text, command.key.toLowerCase()))
    .sort((a, b) => {
      const aa = (a.title.toLowerCase().indexOf(text) !== -1 || a.key.toLowerCase().indexOf(text) !== -1) ? 1 : 0
      const bb = (b.title.toLowerCase().indexOf(text) !== -1 || b.key.toLowerCase().indexOf(text) !== -1) ? 1 : 0
      return bb - aa
    })
    .map(command => ({key: command.key, title: command.title, command}))
}

const walk = (id, data, fn) => {
  if (fn(data[id])) return true
  const stopped = data[id].children.some(child => walk(child, data, fn))
  return stopped
}

window.fuzzysearch = fuzzysearch

const searchNodes = (data, text) => {
  const max = 15
  const nodes = []
  // TODO maybe do BFS instead of DFS
  walk('root', data, node => {
    if (!fuzzysearch(text, node.content.toLowerCase())) return
    nodes.push(node)
    return nodes.length > max
  })
  return nodes.map(node => ({key: node._id, title: node.content, node}))
}

const searchFiles = (meta, text) => {
  return Object.values(meta).filter(meta => fuzzysearch(text, meta.title.toLowerCase()))
    .map(file => ({key: file.id, title: file.title, file}))
}

export default class QuickBar extends Component {
  props: {
    initial: Tab,
    nm: any,
    treed: any,
    extraCommands: any[],
    onClose: () => void,
  }
  state: {
    tab: Tab,
    commands: any[],
    results: {title: string, key: string}[],
    text: string,
  }

  constructor(props) {
    super()
    const commands = collectCommands(props.treed.enabledPlugins, props.store, props.extraCommands)
    let results
    switch (props.initialTab) {
      case 'command':
        results = searchCommands(commands, '')
        break
      case 'search':
        results = searchNodes(props.treed.db.data, '')
        break
      case 'open':
        results = searchFiles(props.nm.meta, '')
        break
    }
    this.state = {
      tab: props.initialTab,
      commands,
      selected: 0,
      results,
      text: '',
      // TODO precache files?
    }
  }

  componentDidMount() {
    this.node.focus()
  }

  setText(text) {
    this.setState({
      text,
      results: this.search(text.toLowerCase(), this.state.tab),
      selected: 0,
    })
  }

  search(text, tab) {
    switch (tab) {
      case 'command': return searchCommands(this.state.commands, text)
      case 'search': return searchNodes(this.props.treed.db.data, text)
      case 'open': return searchFiles(this.props.nm.meta, text)
    }
  }

  onSelect(i) {
    switch (this.state.tab) {
      case 'command':
        this.state.results[i].command.action(this.props.store)
        break
      case 'search':
        this.props.store.actions.setActive(this.state.results[i].node._id)
        break
      case 'open':
        this.props.onOpen(this.state.results[i].file)
        break
    }
    this.props.onClose()
  }

  setTab(tab: Tab) {
    const results = this.search(this.state.text.toLowerCase(), tab)
    this.setState({
      tab,
      results,
      selected: 0,
    })
  }

  onKeyDown = e => {
    e.stopPropagation()
    if (e.key === 'Escape') {
      e.preventDefault()
      this.props.onClose()
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      this.onSelect(this.state.selected)
      return
    }
    if (e.key === 'p' && e.metaKey) {
      this.setTab(e.shiftKey ? 'command' : 'open')
    }
    if (e.key === 'P' && e.metaKey) {
      this.setTab('command')
    }
    if (e.key === 'f' && e.metaKey) {
      this.setTab('search')
    }
    if (e.key === 'ArrowDown' || (e.key === 'j' && e.metaKey)) {
      e.preventDefault()
      this.setState(({selected, results}) => ({
        selected: selected < results.length - 1 ? selected + 1 : 0,
      }))
      // TODO make sure the selected result is in view
    }
    if (e.key === 'ArrowUp' || (e.key === 'k' && e.metaKey)) {
      e.preventDefault()
      this.setState(({selected, results}) => ({
        selected: selected > 0 ? selected - 1 : results.length - 1,
      }))
    }
  }

  render()  {
    const {selected} = this.state
    return <div
      className={css(styles.container)}
      style={{maxHeight: window.innerHeight - 100}}
    >
      <input
        ref={node => this.node = node}
        onKeyDown={this.onKeyDown}
        onBlur={this.props.onClose}
        value={this.state.text}
        onChange={e => this.setText(e.target.value)}
        placeholder={placeholders[this.state.tab]}
        className={css(styles.input)}
      />
      <div className={css(styles.results)}>
        {this.state.results.map((result, i) => (
          <div
            key={result.key}
            onClick={() => this.onSelect(i)}
            className={css(styles.result, i === selected && styles.resultSelected)}>
            {shortn(result.title)}
          </div>
        ))}
      </div>
    </div>
  }
}

const placeholders = {
  command: 'Run a command',
  search: 'Jump to a node',
  open: 'Open a file',
}

const shortn = (text, len = 100) => text.length <= len ? text : text.slice(0, len) + '…'

const width = 500

const styles = StyleSheet.create({
  container: {
    top: 50,
    left: '50%',
    width: width,
    marginLeft: -width/2,
    position: 'absolute',
    backgroundColor: 'white',
    boxShadow: '0 1px 10px rgba(0, 0, 0, 0.5)',
    zIndex: 100000,
  },

  input: {
    fontSize: 20,
    padding: '5px 10px',
    border: 'none',
    outline: 'none',
  },

  result: {
    padding: '5px 10px',
  },

  resultSelected: {
    backgroundColor: '#eee',
  },

  results: {
    flex: 1,
    overflow: 'auto',
  },

})

