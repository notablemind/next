
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import Modal from './Modal'
import Exporter from './Exporter'
import Importer from './Importer'
import SideTabbed from './SideTabbed'

export default class ExportModal extends Component {
  render() {
    const {onClose, store} = this.props
    return <Modal onClose={onClose} className={css(styles.container)}>
      <SideTabbed
        className={css(styles.tabContainer)}
        tabs={{
          ['Import']: () => <Importer store={store} />,
          ['Export']: () => <Exporter store={store} />,
        }}
      />
    </Modal>
  }
}

const styles = StyleSheet.create({
  container: {
  },

  tabContainer: {
    height: 500,
    width: 600,
  },
})

