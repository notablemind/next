// @flow

const gerr = ({result: {error}}) => {throw error}

const create = (): Promise<*> => {
  return gapi.client.drive.files.insert({
    // TODO add the "hidden" label probably
    'title' : 'notablemind:root',
    'mimeType' : 'application/vnd.google-apps.folder'
  }).then(({result, status}) => {
    if (status !== 200) throw new Error('failed to create')
    return result
  }, gerr)
}

const get = (): Promise<*> => {
  return gapi.client.drive.files.list({
    q: "title = 'notablemind:root'", spaces: 'drive'
  }).then(({result: {items}}) => {
    if (!items.length) return null
    if (items.length === 1) return items[0]
    items.sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime())
    return items[0]
  }, gerr)
}

const children = (id: string): Promise<*> => {
  return gapi.client.drive.files.list({
    q: `'${id}' in parents and appProperties has { key='nmId' }`,
  }).then(({result: {items}}) => {
    return items
  }, gerr)
}

export default () => {
  return get().then(folder => {
    if (!folder) return create().then(folder => ({folder, children: []}))
    return children(folder.id).then(children => ({folder, children}))
  })
}

