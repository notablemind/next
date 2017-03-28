
const BOUNDARY = '-------314159265358979323846';

const toBase64 = text => {
  // We can do this in electron
  return new Buffer(text).toString('base64')
  // return btoa(unescape(encodeURIComponent(text)))
}

const makeBody = (boundary, metadata, contentType, contents) => {
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  var base64Data = toBase64(contents);
  var multipartRequestBody = (
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + contentType + '\r\n' +
      'Content-Transfer-Encoding: base64\r\n' +
      '\r\n' +
      base64Data +
      close_delim
  )

  return multipartRequestBody
}

const updateFile = ({
  id,
  contents,
  mimeType,
}) => {

  /*
  var request = gapi.client.request({
    'path': '/upload/drive/v3/files/' + id,
    'method': 'PATCH',
    'params': {'uploadType': 'media'},
    'headers': { 'Content-Type': mimeType, },
    'body': contents,
  });
  */

  return new Promise((res, rej) => {
    request.execute(response => {
      res(response)
    });
  })
}

const insertFile = (token, config/*: {mimeType: string}*/, data) => {
  return fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`, {
    headers: {
      'Authorization': 'Bearer ' + token.access_token,
      'Content-Type': 'multipart/mixed; boundary="' + BOUNDARY + '"'
    },
    method: 'POST',
    body: makeBody(BOUNDARY, config, config.mimeType, data)
  }).then(res => res.json())
}

const _insertFile = ({
  name,
  mimeType,
  parents,
  contents,
}) => {

  /*
  var request = gapi.client.request({
    'path': '/upload/drive/v3/files',
    'method': 'POST',
    'params': {'uploadType': 'multipart'},
    'headers': {
      'Content-Type': 'multipart/mixed; boundary="' + BOUNDARY + '"'
    },
    'body': makeBody(BOUNDARY, {
      name,
      mimeType,
      parents,
    }, mimeType, contents)
  });

  return new Promise((res, rej) => {
    request.execute(response => {
      console.log('got response from upload', response)
      res(response)
    });
  })
 */
}

module.exports = insertFile
