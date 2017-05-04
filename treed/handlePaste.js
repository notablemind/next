export default (e: any, done: (type: string, data: any) => void) => {
  if (e.target.nodeName === 'TEXTAREA') {
    return // allow normal pasting into text input
  }
  if (e.target.nodeName === 'INPUT') {
    return // allow normal pasting into text input
  }

  const data = e.clipboardData
  if (data.items.length === 1) {
    if (data.items[0].kind === 'string') {
      if (
        data.items[0].kind === 'string' &&
        data.items[0].type === 'application/x-notablemind'
      ) {
        data.items[0].getAsString(string => {
          let data
          try {
            data = JSON.parse(string)
          } catch (e) {
            // TODO toast
            console.warn(
              'failed to parse json from string of length ' + string.length,
            )
            return
          }
          return done('notablemind', data)
        })
        return
      }
      if (e.target.nodeName === 'INPUT') {
        return // allow normal pasting into text input
      }
    }
    if (data.items[0].kind === 'file') {
      const file = data.items[0].getAsFile()
      const type = data.items[0].type
      return done('file', {file, type, filename: '<pasted file>'})
      return
    }
  }

  e.preventDefault()
  if (
    data.items.length === 2 &&
    data.items[0].kind === 'string' &&
    data.items[1].kind === 'file'
  ) {
    // looks like a "copy/pasted a file"
    // note this will only work if they pasted an image. (at least in chrome)
    const file = data.items[1].getAsFile()
    console.log(data.items[1], file)
    if (!file) {
      // wasn't an image I guess
      // TODO toast
      console.warn('Bad file - not an image?')
      return
    }
    const type = data.items[1].type
    data.items[0].getAsString(filename => {
      done('file', {file, type, filename})
    })
  } else {
    // TODO other pastes
    debugger
  }
}
