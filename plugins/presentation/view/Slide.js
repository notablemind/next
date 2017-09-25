
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

export default class Slide extends Component {
  render() {
    return <div>
      Slide here!! lol {this.props.node.content}
    </div>
  }
}

/**

Ok, so the data look like:
- a tree of slides.
- "presentation types" - node types that only make sense for a presentation, so maybe I'll just have tbem be defined in the `views.presentation` scope
  - slide group
  - persistant
  (if a child of a slide group is not a group or persistant, then it is a slide)
- this presenter needs to know a fair amount
  - the whole number of slides, and let'sbehonest it'll be simplest if I track each slide

 *
 */

