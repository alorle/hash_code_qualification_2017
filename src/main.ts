var fs = require('fs')

var kittens = 'kittens'
var zoo = 'me_at_the_zoo'
var trending = 'trending_today'
var spreading = 'videos_worth_spreading'

var IN_DIR = "./in/"
var IN_EXT = ".in"
var OUT_DIR = "./out/"
var OUT_EXT = ".out"

var datasets = [
  kittens,
  zoo,
  trending,
  spreading
]

datasets.forEach((dataset) => {
  let lines = fs.readFileSync(IN_DIR + dataset + IN_EXT).toString().split('\n')
  let readingLine = 0

  // Get first line data
  let [videosCount, endpointsCount, requestsCount, cachesCount, cacheSize] = lines[readingLine++].split(' ').map((n) => parseInt(n, 10))

  // Get videos size array
  let videos = lines[readingLine++].split(' ').map((n) => parseInt(n, 10))

  // Get endpoints
  let endpoints = []
  for (let e = 0; e < endpointsCount; e++) {
    let [dcLatency, connectionsCount] = lines[readingLine++].split(' ').map((n) => parseInt(n, 10))

    let endpoint = {
      id: e,
      dcLatency: dcLatency,
      csConnections: [],
      csConnectionsCount: connectionsCount
    }

    // Add enpoint connections
    for (let c = 0; c < connectionsCount; c++) {
      let [id, latency] = lines[readingLine++].split(' ').map((n) => parseInt(n, 10))
      endpoint.csConnections.push({
        id: id,
        latency: latency
      })
    }

    // Sort connections by latency
    endpoint.csConnections.sort((a, b) => {
      return a.latency - b.latency
    })

    endpoints.push(endpoint)
  }

  // Get requests
  let requests = []
  for (let r = 0; r < requestsCount; r++) {
    let [videoId, endpointId, num] = lines[readingLine++].split(' ').map((n) => parseInt(n, 10))
    requests.push({
      id: r,
      videoId: videoId,
      endpointId: endpointId,
      num: num
    })
  }

  let out = alg_1(videosCount, endpointsCount, requestsCount, cachesCount, cacheSize, videos, endpoints, requests)

  // Write out file
  fs.writeFile(OUT_DIR + out.name + '-' + dataset + OUT_EXT, out.content.join('\n'));
  console.log('Result for', dataset)
})

function alg_1(videosCount, endpointsCount, requestsCount, cachesCount, cacheSize, videos, endpoints, requests) {
  // Init cache servers array
  var caches = []
  for (var c = 0; c < cachesCount; c++) {
    caches.push({
      id: c,
      freeSpace: cacheSize,
      videoList: []
    })
  }

  // Sort request by num and video size
  requests.sort((a, b) => {
    return b.num / videos[b.videoId] - a.num / videos[a.videoId]
    // return b.num - a.num
  })

  // Sort enpoints by num of connections to cs
  endpoints.sort((a, b) => {
    return b.csConnectionsCount - a.csConnectionsCount
  })

  // For each endpoint, fill cache server with most requested videos
  endpoints.forEach((endpoint) => {
    let requestFromCurrentEndpoint = requests.filter((request) => request.endpointId == endpoint.id)

    // Fill each cache server connected to current endpoint
    requestFromCurrentEndpoint.forEach((request) => {
      // Check that the video is not on any cache server reachable by the endpoint
      for (let c = 0; c < endpoint.csConnectionsCount; c++) {
        if (caches[endpoint.csConnections[c].id].videoList.indexOf(request.videoId) > 0)
          return
      }

      // Get the cache server for the endpoint from the ones that have free space
      let csConnectionIndex = 0
      while (csConnectionIndex < endpoint.csConnectionsCount &&
        caches[endpoint.csConnections[csConnectionIndex].id].freeSpace < videos[request.videoId]) {
        csConnectionIndex++
      }

      // Insert the video in the selected cache server
      if (csConnectionIndex < endpoint.csConnectionsCount &&
        caches[endpoint.csConnections[csConnectionIndex].id].videoList.indexOf(request.videoId) < 0) {
        caches[endpoint.csConnections[csConnectionIndex].id].freeSpace -= videos[request.videoId]
        caches[endpoint.csConnections[csConnectionIndex].id].videoList.push(request.videoId)
      }

    })
  })

  let usedCaches = caches.filter((cache) => cache.videoList.length > 0)
  return {
    name: 'alg_1',
    content: [usedCaches.length.toString()].concat(usedCaches.map((cache) => cache.id + ' ' + cache.videoList.join(' ')))
  }
}
