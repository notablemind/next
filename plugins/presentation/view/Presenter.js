
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import Slide from './Slide'
import trackDeep from './trackDeep'

const isPresentationGroup = node => {
  return node.views.presentation && node.views.presentation.type === 'group'
}

const isPresentationPersistant = node => {
  return node.views.presentation && node.views.presentation.type === 'persistant'
}

const getSlides = (root, nodes) => {
  console.log('getting slides', root, nodes)
  const slides = []
  const inner = id => {
    const node = nodes[id]
    if (isPresentationGroup(node) || id === root) {
      node.children.forEach(inner)
    } else if (isPresentationPersistant(node)) {
      // nope
    } else {
      slides.push(node)
    }
  }
  inner(root)
  return slides
}

const getPersistants = (root, nodes, slideNumber) => {
  let lastSeenSlideNumber = -1
  const inner = id => {
    if (slideNumber >= lastSeenSlideNumber) return []
    const node = nodes[id]
    if (isPresentationGroup(node) || id === root) {
      const persistants = [...node.children.map(inner)]
      if (lastSeenSlideNumber === slideNumber) {
        return persistants
      } // otherwise, we exited the group already
      return []
    } else if (isPresentationPersistant(node)) {
      return [node]
    } else {
      lastSeenSlideNumber += 1
    }
  }
  return inner(root)
}

export default class Presenter extends Component {
  constructor({store}) {
    super()
    this.state = {
      currentSlide: 0,
      nodes: {},
    }
    const root = store.state.root
    trackDeep(store, this, root, node => node._id === root || isPresentationGroup(node))
  }

  getSlides() {
    return getSlides(this.props.store.state.root, this.state.nodes)
  }

  getPersistants() {
    return getPersistants(this.props.store.state.root, this.state.nodes, this.state.currentSlide)
  }

  onNext = () => {
    const slides = this.getSlides()
    if (this.state.currentSlide === slides.length - 1) return
    this.setState({
      currentSlide: this.state.currentSlide + 1
    })
  }

  onPrev = () => {
    if (this.state.currentSlide === 0) return
    this.setState({
      currentSlide: this.state.currentSlide - 1
    })
  }

  renderSlides() {
    const {currentSlide} = this.state
    const nodes = []
    const slides = this.getSlides()
    if (currentSlide > 0) {
      const prev = slides[currentSlide - 1]
      nodes.push(
        <Slide key={prev._id} node={prev} />
      )
    }
    const current = slides[currentSlide]
    nodes.push(
      <Slide key={current._id} node={current} />
    )
    if (currentSlide < slides.length - 1) {
      const node = slides[currentSlide + 1]
      nodes.push(
        <Slide key={node._id} node={node} />
      )
    }
    return nodes
  }

  renderPersistants() {
    const persistants = this.getPersistants()
    return <div>
      {persistants.map(item => (
        <Persistant item={item} key={item._id} />
      ))}
    </div>
  }

  render() {
    // TODO animate between n stuff
    return <div className={css(styles.container)}>
      {this.renderPersistants()}
      {this.renderSlides()}
      <div className={css(styles.controls)}>
        <button onClick={this.onPrev}>prev</button>
        <button onClick={this.onNext}>next</button>
      </div>
    </div>
  }
}

const Persistant = ({item}) => <div>Persistant... {item.content}</div>

const styles = StyleSheet.create({
})
