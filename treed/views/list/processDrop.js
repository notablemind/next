// @flow

const processDrop = (data: any) => {
  return new Promise((res, rej) => {
    if (
      data.items.length === 1 &&
      data.files.length === 0 &&
      data.items[0].kind === 'string'
    ) {
      const type = data.items[0].type
      data.items[0].getAsString(text => {
        res({type: 'string', text, mimeType: type})
      })
    } else if (data.files.length === data.items.length) {
      res({type: 'files', files: [...data.files]})
    } else {
      // Find a text/plain, and go with it.
      // ummm what other cases are there?
      debugger
    }
  })
}

export default processDrop
