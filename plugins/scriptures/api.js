
const url = last => `http://localhost:6207/api/${last}`
const get = last => fetch(url(last)).then(r => r.json())

export const searchByTitle = title => get('search/by-title?title=' + encodeURIComponent(title))

export const getCatalog = () => get('')
export const getItem = id => get(id)
export const getSubitem = (id, uri) => get(id + uri)

