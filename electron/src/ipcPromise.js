const genid = () => Math.random().toString(16).slice(2)

module.exports = main => {
  return {
    on(name, fn) {
      main.on(name, (evt, id, ...args) => {
        Promise.resolve().then(() => fn(evt, ...args)).then(
          value => {
            evt.sender.send(id, 'success', value)
          },
          err => {
            evt.sender.send(id, 'error', {
              message: err.message,
              stack: err.stack
            })
          }
        )
      })
    },
    send(name, ...args) {
      return new Promise((res, rej) => {
        const id = genid()
        main.once(id, (evt, status, value) => {
          if (status === 'success') {
            res(value)
          } else {
            console.error(name, args, value)
            rej(value)
          }
        })
        main.send(name, id, ...args)
      })
    }
  }
}
