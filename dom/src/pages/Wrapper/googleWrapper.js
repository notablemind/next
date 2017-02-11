
let initialized = false
let injected = false

const prom = fn => new Promise((res, rej) => fn((err, val) => err ? rej(err) : res(val)))

const getProfile = () => {
  return gapi.client.people.people.get({resourceName: 'people/me'})
}

// Google is super annoying - in order to get "immediate" auth, you need to
// include their thing, apparently. The worst.
const refresh =  ({clientId, scopes}): Promise<?Object> => {
  return new Promise((res, rej) => {
    const run = () => {
      gapi.auth.authorize({
        client_id: clientId,
        fetch_basic_profile: true,
        scope: scopes.join(' '),
        immediate: true,
      }, authResult => {
        if (authResult && !authResult.error) {
          const {access_token: token, expires_at} = authResult
          // It's probably not a problem to always re-fetch the profile...
          // maybe I should only do it once a day or something
          getProfile().then(
            person => {
              console.log(person)
              const {0: {displayName: name}={}} = person.result.names || []
              const {0: {value: email}={}} = person.result.emailAddresses || []
              const {0: {url: photo}} = person.result.photos || []
              res({
                name,
                email,
                photo,
                isExpired: () => Date.now()/1000 > expires_at,
                refresh,
                token,
              })
            },
            err => {
              console.error('failed to get profile')
              rej('bad profile')
            }
          )
        } else {
          console.log('failed')
          rej('logged out')
        }
      })
    }

    if (!injected) {
      window.nm_checkAuth = () => {
        initialized = true
        Promise.all([
          prom(done => gapi.client.load('drive', 'v3', done)),
          prom(done => gapi.client.load('people', 'v1', done)),
        ]).then(run, rej)
      }
      injected = true
      const script = document.createElement('script')
      script.onerror = () => {
        injected = false
        rej('network')
      }
      script.src = 'https://apis.google.com/js/client.js?onload=nm_checkAuth'
      document.body.appendChild(script)
    } else if (!initialized) {
      // this is probably a bad sign
      throw new Error("Doing two things at once - wait for the first one")
    } else {
      run()
    }
  })
}

 export default refresh
