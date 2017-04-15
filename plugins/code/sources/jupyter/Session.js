
export default class Session {
  constructor(kernel) {
    this.kernel = kernel
    this.id = kernel.id
    this.variables = {}
  }

  isConnected() {
    return true // TODO
  }

  execute(
    code: string,
    onIo: (io: any) => void,
    onStream: (stream: string, text: string) => void
  ): Promise<any> {
    return new Promise((res, rej) => {
      const future = this.kernel.requestExecute({
        code,
        allow_stdin: true, // TODO
        // TODO user_expressions?
      })
      future.onDone = () => res()
      future.onIOPub = io => {
        switch (io.msg_type) {
          case 'execute_result':
            console.log('got', io.content)
            return onIo({
              type: 'result',
              data: io.content.data,
            })
          case 'display_data':
            return onIo({
              type: 'display',
              data: io.content.data,
            })
          case 'error':
            return onIo({
              type: 'error',
              name: io.content.ename,
              message: io.content.evalue,
            })
          case 'stream':
            return onStream(io.content.name, io.content.text)
          case 'execute_input':
            break
          case 'status':
            break // TODO handle
          default:
            console.log('unexpected ui message', io)
        }
        // onIo(io) // TODO be more nuanced about this?
      }
      future.onReply = res => {
        console.log('reply', res)
      }
      future.onStdin = ({content: {prompt, password}}) => {
        console.log('faking stdin, haha')
        this.kernel.sendInputReply({value: 'faking stdin, haha'})
      }
    })
  }

  restart() {
    // TODO
  }

  getCompletion({code, cursor, pos}) {
    return this.kernel.requestComplete({code, cursor_pos: pos}).then(({content}) => {
      const {matches, cursor_start, cursor_end, metadata, status} = content
      return {
        list: matches,
        from: {line: cursor.line, ch: cursor.ch - (pos - cursor_start)},
        to: {line: cursor.line, ch: cursor.ch - (pos - cursor_end)},
      }
    })
  }

  interrupt() {
  }

  shutdown() {
  }
}

