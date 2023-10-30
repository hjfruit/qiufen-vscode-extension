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
  return new Promise(resolve => {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sdlGql }),
    })
      .then(response => response.json())
      .then(res => {
        resolve(res?.data?._superSchema?.sdl)
      })
      .catch(err => {
        throw err
      })
  })
}
