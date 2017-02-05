
export const insertFile

function insertFile({
  title,
  mimeType,
  contents,
}) {
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  var metadata = { title, mimeType, };

  var base64Data = btoa(contents);
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

  var request = gapi.client.request({
    'path': '/upload/drive/v2/files',
    'method': 'POST',
    'params': {'uploadType': 'multipart'},
    'headers': {
      'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
    },
    'body': multipartRequestBody
  });

  return new Promise((res, rej) => {
    request.execute(response => {
      console.log('got response from upload', response)
      if (response.status !== 200) {
        rej()
      } else {
        res()
      }
    });
  })
}
