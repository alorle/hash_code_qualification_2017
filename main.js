'use strict';

var fs = require('fs');

var kittens = './in/kittens.in';
var zoo = './in/me_at_the_zoo.in';
var trending = './in/trending_today.in';
var spreading = './in/videos_worth_spreading.in';

fs.readFile(zoo, 'ASCII', function (err,data) {
    if (err) {
        return console.log(err);
    }

    var lines = data.split('\n');
    var currentline = 0;

    var [videosNumber, endpointsNumber, reqDescriptions, cachesNumber, cacheSize] = lines[currentline++].split(' ').map((item) => Number(item));

    console.log('Número de vídeos:', videosNumber);
    console.log('Número de endpoints:', endpoints);
    console.log('Número de request descriptions:', reqDescriptions);
    console.log(cachesNumber + ' caches de ' + cacheSize + 'MB cada una');

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
    console.log('Endpoints:', endpoints);

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
    console.log('Requests:', endpointRequests);

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
    console.log(cachesArray);

    // Rellenando las cachés en orden hasta que no quepa nada
    for (var i=0; i<reqDescriptions; i++) {
        var request = endpointRequests[i];
        var cachesList = endpoints[request.endpointId].cachesList;
        var videoSize = videos[request.videoId];
        for (var j=0; j<cachesList.length; j++) {
            var cache = cachesArray[j];
            if (videoSize < cache.freeSpace) {
                if (!cache[request.videoId]) {
                    cache[request.videoId] = true;
                    cache.videosList.push(request.videoId);
                    cache.freeSpace -= videoSize;
                    // break; // Meto el vídeo en todas las cachés que quepan
                }
            }
        }
    }
    console.log(cachesArray);

    var usedCaches = cachesArray.filter((cache) => cache.freeSpace < cacheSize);
    var outLines = [usedCaches.length.toString()];
    var outLines = outLines.concat(usedCaches.map((cache) => cache.id + ' ' + cache.videosList.join(' ')));
    var outText = outLines.join('\n');

    fs.writeFile('./out/kittens.out', outText);

});
