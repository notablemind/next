
import rehype from 'rehype'
import rehypeReact from 'rehype-react'
import React, {Component} from 'react'

export default (text, key) => {
  return <div key={key}>
    {rehype()
      .data('settings', {fragment: true})
      .use(rehypeReact, {createElement: React.createElement})
      .processSync(text).contents}
  </div>
}

