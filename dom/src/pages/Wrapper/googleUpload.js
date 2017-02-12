
const BOUNDARY = '-------314159265358979323846';

const toBase64 = text => {
  return btoa(unescape(encodeURIComponent(text)))
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

export const updateFile = ({
  id,
  contents,
  mimeType,
}) => {

  var request = gapi.client.request({
    'path': '/upload/drive/v3/files/' + id,
    'method': 'PATCH',
    'params': {'uploadType': 'media'},
    'headers': { 'Content-Type': mimeType, },
    'body': contents,
  });

  return new Promise((res, rej) => {
    request.execute(response => {
      res(response)
    });
  })
}

export const insertFile = ({
  name,
  mimeType,
  parents,
  contents,
}) => {

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
}
