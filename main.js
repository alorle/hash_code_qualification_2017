'use strict';

var fs = require('fs');

var kittens = 'kittens';
var zoo = 'me_at_the_zoo';
var trending = 'trending_today';
var spreading = 'videos_worth_spreading';

var selected = spreading;

var run = function(selected) {
    return new Promise((fulfill, reject) => {

        fs.readFile('./in/' + selected + '.in', 'ASCII', function (err,data) {
            if (err) {
                return console.log(err);
            }

            var lines = data.split('\n');
            var currentline = 0;

            var [videosNumber, endpointsNumber, reqDescriptions, cachesNumber, cacheSize] = lines[currentline++].split(' ').map((item) => Number(item));

            //console.log('Número de vídeos:', videosNumber);
            //console.log('Número de endpoints:', endpoints);
            //console.log('Número de request descriptions:', reqDescriptions);
            //console.log(cachesNumber + ' caches de ' + cacheSize + 'MB cada una');

            var videos = lines[currentline++].split(' ').map((item) => Number(item));

            // Endpoints
            var endpoints = [];
            for (var i=0; i<endpointsNumber; i++) {
                var [datacenterLat, conectedCaches] = lines[currentline++].split(' ').map((item) => Number(item));
                var endpoint = {
                    datacenter: datacenterLat,
                    cachesList: []
                };
                for (var j=0; j<conectedCaches; j++) {
                    var [cacheServer, lacency] = lines[currentline++].split(' ').map((item) => Number(item));
                    endpoint[cacheServer] = lacency;
                    endpoint.cachesList.push(cacheServer);
                }
                endpoints.push(endpoint);
            }
            //console.log('Endpoints:', endpoints);

            var endpointRequests = [];
            for (var i=0; i<reqDescriptions; i++) {
                var [videoId, endpointId, requests] = lines[currentline++].split(' ').map((item) => Number(item));
                var request = {
                    endpointId: endpointId,
                    videoId: videoId,
                    requests: requests
                }
                endpointRequests.push(request);
            }
            //console.log('Requests:', endpointRequests);

            // Fin de la lectura de datos

            // Inicializando las cachés
            var cachesArray = [];
            for (var i=0; i<cachesNumber; i++) {
                var cache = {
                    id: i,
                    freeSpace: cacheSize,
                    videosList: []
                }
                cachesArray.push(cache);
            }
            //console.log(cachesArray);

            // Ordeno las requests por número de peticiones
            endpointRequests = endpointRequests.sort((a, b) => {
                return b.requests/videos[b.videoId] - a.requests/videos[a.videoId];
            });
            //console.log(endpointRequests);

            // Meto todos los videos en las caches con sus requests
            for (var i=0; i<reqDescriptions; i++) {
                var request = endpointRequests[i];
                var cachesList = endpoints[request.endpointId].cachesList;
                cachesList = cachesList.sort((a, b) => {
                    var cacheA = cachesArray[a];
                    var cacheB = cachesArray[b];
                    var latA = endpoints[request.endpointId][a];
                    var latB = endpoints[request.endpointId][b];
                    return latA - latB;
                });
                var videoSize = videos[request.videoId];
                var isInCache = cachesList.map((id) => cachesArray[id]).filter((cache) => cache[request.videoId] ? true : false).length > 0;
                if (!isInCache) {
                    for (var j=0; j<cachesList.length; j++) {
                        var cache = cachesArray[cachesList[j]];
                        if (videoSize < cache.freeSpace) {
                            if (!cache[request.videoId]) {
                                cache[request.videoId] = {
                                    requests: request.requests
                                };
                                cache.videosList.push(request.videoId);
                                cache.freeSpace -= videoSize;
                                break;
                            } else {
                                cache[request.videoId].requests += request.requests;
                            }
                        }
                    }
                }
            }
            //console.log(cachesArray);

            var usedCaches = cachesArray.filter((cache) => cache.freeSpace < cacheSize);

            // Purga
            /*for (var i=0; i<usedCaches.length; i++) {
                var cache = usedCaches[i];
                var sortedVideosList = cache.videosList.map((item, index) => {
                    return {
                        requests: cache[item].requests,
                        id: item
                    };
                });
                sortedVideosList = sortedVideosList.sort((a, b) => {
                    return a.requests - b.requests;
                });
                while (cache.freeSpace < 0) {
                    var worst = sortedVideosList.shift();
                    delete cache[worst.id];
                    cache.videosList = cache.videosList.filter((item) => item != worst.id);
                    cache.freeSpace += videos[worst.id];
                }
            }*/

            var outLines = [usedCaches.length.toString()];
            var outLines = outLines.concat(usedCaches.map((cache) => cache.id + ' ' + cache.videosList.join(' ')));
            var outText = outLines.join('\n');

            fs.writeFile('./out/' + selected + '.out', outText);
        
            console.log(selected);
            fulfill();
        });
    });
}

run(kittens).then(() => {
    run(zoo).then(() => {
        run(trending).then(() => {
            run(spreading);
        });      
    }); 
});
