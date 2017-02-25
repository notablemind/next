// @flow

import React, {Component} from 'react';
import BrowserSidebar from './Sidebar'
import type {Plugin, Store} from 'treed/types'

const PLUGIN_ID = 'browser'

const plugin: Plugin<*, *> = {
  id: PLUGIN_ID,

  rightSidePane: BrowserSidebar,
}

export default plugin


