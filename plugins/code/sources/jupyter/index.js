
import Connection from './Connection'

const source = {
  id: 'jupyter',
  name: 'Jupyter',
  Connection,
  defaultConfig: {
    host: 'http://localhost:9879'
    // host: 'http://localhost:8000',
  },
}

export default source
