// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'
import Modal from '../utils/Modal'
import SideTabbed from '../utils/SideTabbed'
import Exporter from './Exporter'
import Importer from './Importer'

import PluginsPane from './PluginsPane'
import SyncSetting from './Sync/Settings'

export default class DocumentSettings extends Component {
  render() {
    const {onClose, treed, store, onSetPlugins, optionalPlugins, nm, initialTab} = this.props
    return <Modal onClose={onClose} className={css(styles.container)}>
      <SideTabbed
        className={css(styles.tabContainer)}
        initialTab={initialTab}
        sections={{
          'This document': ['Plugins'],
          'Global': ['Files & Sync', 'Keyboard Shortcuts'],
        }}
        tabs={{
          // want sync interval, etc.
          Plugins: () => <PluginsPane
            treed={treed}
            onSetPlugins={onSetPlugins}
            optionalPlugins={optionalPlugins}
            onClose={onClose}
          />,
          'Files & Sync': () => <SyncSetting nm={nm} />,
          'Keyboard Shortcuts': () => <div>TODODOD</div>,
          'Import': () => <Importer store={store} />,
          'Export': () => <Exporter store={store} />,
          // TODO default node type
          // TODO I'm sure there are note type settings I'd want (like setting
          // defaults or something)
          // TODO have a way to enable / disable sidebar stuff
          // TODO global font size?
        }}
      />
    </Modal>
  }
}

const styles = StyleSheet.create({
  tabContainer: {
    flexBasis: 400,
    width: 600,
    maxWidth: '100%',
  },
})
