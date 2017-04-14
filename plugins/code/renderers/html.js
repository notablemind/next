
import React, {Component} from 'react'

class Renderer extends Component {
  componentDidMount() {
    const iframe = this.iframe = document.createElement('iframe')
    iframe.setAttribute('sandbox', 'allow-same-origin')
    this.node.appendChild(iframe)
    Object.assign(iframe.contentWindow.document.body.style, {
      padding: 0,
      margin: 0,
    })
    Object.assign(iframe.contentWindow.document.body.parentElement.style, {
      padding: 0,
      margin: 0,
    })
    Object.assign(iframe.style, {
      border: 'none',
      padding: 0,
      margin: 0,
      // width: '10px',
      height: '10px',
    })
    this.target = iframe.contentDocument.createElement('div')
    iframe.contentDocument.body.appendChild(this.target)

    this.setContents(this.props.text)
    // TODO resize based on contents?
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.text !== this.props.text) {
      this.setContents(nextProps.text)
    }
  }

  setContents(text) {
    this.target.innerHTML = text
    setTimeout(() => {
      const body = this.target
      this.iframe.style.height = body.offsetHeight + 'px'
    }, 500)
  }

  render() {
    return <div style={{alignItems: 'stretch'}} ref={node => this.node = node} />
  }
}

export default (text, key) => { // TODO might need more args
  return <Renderer key={key} text={text} />
}

