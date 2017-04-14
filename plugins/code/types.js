
type Output = any // TODO TODO

type NodeConfig = {
  lastRun: ?{
    start: number,
    end: ?number,
    status: 'running' | 'ok' | 'err' | 'interrupted', // probably? maybe timeout, or sth
    sessionId: string,
    // TODO I want to be able to determine if we've "undone" since
    // the most recent execution, which would make this execution somewhat
    // stale.
    executionNumber: number,
    outputs: Array<Output>,
    streams: {
      // will want listeners for the streams as well
      stdout: string,
      stderr: string,
    },
  },
  dirty: boolean,
  kernelId: ?string, // if this is null, then we pick the first one in the list
  language: string,
}

type SourceConnection = {
  getKernelSpecs: () => Promise<Array<{}>>,
  getSession: (id: string) => Promise<?any>,
}

type CompleteReply = {
  cursor_start: number,
  cursor_end: number,
  matches: string[],
}

type Session = {
  execute: (code: string, onIo: (io: any) => void) => Promise<any>,
  restart: () => Promise<void>,
  autoComplete: (code: string, pos: number) => Promise<CompleteReply>,
  interrupt: () => Promise<void>,
  shutdown: () => Promise<void>,
}

type GlobalConfig = {
  sources: {
    [sourceId: string]: {}, // config for the source, see defaultConfig
  },
  kernels: {
    [kernelId: string]: {
      id: string,
      sourceId: string,
      title: 'string',
      language: string,
      config: {}, // whatever, comes from the source's UI
    },
  },
}

// TODO persist the "last connected session id" for each kernel in
// localStorage, so we can attempt to resume
type GlobalState = {
  sourceConnections: {
    [sourceId]: {
      source: any, // TODO type
      // status: 'connected' | 'pending' | 'disconnected',
      connection: SourceConnection, // anything?
      error: ?any, // show a connection error if needed
    },
  },
  kernelSessions: {
    [kernelId]: {
      kernelId: string,
      sessionId: string,
      started: number,
      busy: boolean,
      session: Session,
      /* TODO history? or we can just fetch this from jupyter whenever
       * probably
      codeExecuted: Array<{
        nodeId: string,
        start: number,
        end: number,
        code: string,
      }>,
      */
    },
  },
}
