
import React from 'react'

export default plugins => {
  const renderers = [{
    mime: 'application/in-process-js',
    render: require('./js').default,
  }, {
    mime: 'text/html',
    render: require('./html').default,
  }, {
    mime: 'image/png',
    render: (text, key) => <img key={key}
      style={{alignSelf: 'center', maxWidth: '100%'}}
      src={'data:image/png;base64,' + text} />,
  }, {
    mime: 'text/plain',
    render: (text, key) => <pre key={key} style={{fontFamily: 'monospace'}}>{text}</pre>,
  }]
  plugins.forEach(plugin => {
    // TODO establish a way for other plugins to indicate that they have
    // something I want.
  })

  return renderers
}

