import fetch from 'node-fetch'

const sdlGql = `
query _superSchema {
  _superSchema {
    sdl
    version
  }
}
`

export const requestGroupedSdl: (url: string) => Promise<string> = (
  url: string,
) => {
  return new Promise((resolve, reject) => {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sdlGql }),
    })
      .then(response => {
        if (!response.ok) {
          reject(new Error(`${url}：HTTP error, status = ${response.status}`))
          return
        }
        return response.json()
      })
      .then(res => {
        resolve(res?.data?._superSchema?.sdl)
      })
      .catch(err => {
        reject(err)
      })
  })
}
