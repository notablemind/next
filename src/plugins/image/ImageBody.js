// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'
import actions from './actions'

import Content from '../../../treed/views/body/Content'

const urlCache = {}

type Node = any
type Props = {
  node: any,
  store: any,
}

export default class ImageBody extends Component {
  props: Props
  state: {
    src: ?string,
    error: ?any,
    hover: bool,
  }
  _node: any

  constructor() {
    super()
    this.state = {
      src: null,
      error: null,
      hover: false,
    }
  }

  componentDidMount() {
    const image = this.props.node.types.image || {}
    if (image.attachmentId) {
      this.load(image.attachmentId, this.props.node)
    }
  }

  load(attachmentId: string, node: Node) {
    const key = node._id + ':' + attachmentId
    if (urlCache[key]) {
      return this.setState({src: urlCache[key]})
    }
    if (node._attachments[attachmentId] && node._attachments[attachmentId].data) {
      const url = URL.createObjectURL(
        node._attachments[attachmentId].data
      )
      urlCache[key] = url
      this.setState({src: url})
      return
    }
    this.props.store.db.getAttachment(node._id, attachmentId).then(
      blob => {
        const url = URL.createObjectURL(blob)
        urlCache[key] = url
        this.setState({src: url})
      },
      error => this.setState({error}),
    )
  }

  onAddFile = (e: any) => {
    console.log('adding file', e)
    const file = e.target.files[0]
    if (e.target.files.length !== 1) {
      return console.warn('can only add one file', e.target.files)
    }
    if (file.size > 5 * 1000 * 1000) {
      // if over 5 megs, reject
      // TODO pop a toaster warning
      return console.warn('too big')
    }
    actions.setImage(this.props.store, this.props.node._id, file)
    // this.props.store.db.setAttachment(
    // debugger
  }

  componentWillReceiveProps(nextProps: Props) {
    const nextImage = nextProps.node.types.image
    if (nextImage.attachmentId !==
        this.props.node.types.image.attachmentId) {
      if (nextImage.attachmentId) {
        this.load(nextImage.attachmentId, nextProps.node)
      } else {
        this.setState({src: null})
      }
    }
  }

  renderImage() {
    const image = this.props.node.types.image || {}
    if (!image.attachmentId) {
      return <div className={css(styles.placeholder)}>
        <input
          type="file"
          onChange={this.onAddFile}
          onMouseDown={e => e.stopPropagation()}
        />
      </div>
    }

    if (this.state.error) {
      return <div className={css(styles.placeholder)}>
        Failed to load image {this.state.error + ''}
      </div>
    }
    if (!this.state.src) {
      return <div className={css(styles.placeholder, styles.loading)}>loading..</div>
    }

    return <img
      className={css(styles.image, !image.fullSize && styles.small)}
      src={this.state.src}
    />
  }

  onOver = (e: any) => {
    this.setState({hover: true})
  }

  onOut = (e: any) => {
    this.setState({hover: false})
  }

  onRemove = (e: any) => {
    e.stopPropagation()
    actions.removeImage(this.props.store, this.props.node._id)
  }

  render() {
    const hasImage = this.props.node.types.image &&
      this.props.node.types.image.attachmentId
    return <div
      className={css(styles.container)}
      ref={n => this._node = n}
      onMouseEnter={this.onOver}
      onMouseLeave={this.onOut}
    >
      {this.renderImage()}
      {this.state.hover && hasImage &&
        <div
          onMouseDown={this.onRemove}
          className={css(styles.remove)}
        >
          &times;
        </div>}
      <Content
        {...this.props}
        style={{
          textAlign: 'center',
          fontSize: '.5em',
          fontStyle: 'italic',
        }}
      />
    </div>
  }
}

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
    margin: 10,
    boxShadow: '0px 1px 5px #555',
    maxWidth: '100%',
  },

  container: {
    position: 'relative',
  },

  remove: {
    position: 'absolute',
    cursor: 'pointer',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',

    ':hover': {
      backgroundColor: '#eee',
    },
  },

  placeholder: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    margin: 10,
  },

  small: {
    height: 100,
  },
})
