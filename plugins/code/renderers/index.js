

export default plugins => {
  const renderers = [{
    mime: 'text/html',
    render: require('./html').default,
  }]
  plugins.forEach(plugin => {
    // TODO establish a way for other plugins to indicate that they have
    // something I want.
  })

  return renderers
}

