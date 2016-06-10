'use strict';

let request = require('request-promise');
let config = require('../config.json');
let Boom = require('boom');

let auth0rp = request.defaults({
    headers: {
        'Authorization': `Bearer ${config.auth0Token}`
    },
    simple: false,
    resolveWithFullResponse: true,
    json: true
});

let rp = request.defaults({
    simple: false,
    resolveWithFullResponse: true,
    json: true
});

var Cache = require('lru-cache');
var playerCache = new Cache(500);

exports.init = function(router, app) {
    router.get('/playercache/:uuid', getPlayerProfileByUUID);
}

function* getPlayerProfileByUUID() {
    const uuid = this.params.uuid;
    if(!playerCache.has(uuid)) {
        let mojangProm = rp('https://sessionserver.mojang.com/session/minecraft/profile/' + uuid.replace(/-/g, ''));
        let auth0Prom = auth0rp(`https://edifice.auth0.com/api/v2/users?q=mcuuid%3D${uuid}&search_engine=v2`);
        let responses = yield Promise.all([mojangProm, auth0Prom]);
        let mojangRes = responses[0];
        let auth0Res = responses[1];
        if(mojangRes.statusCode !== 200) {
            throw Boom.notFound(`User with UUID ${uuid} not found.`);
        }
        
        let body = mojangRes.body;
        if(auth0Res.statusCode === 200 && auth0Res.body.length > 0) {
            body.joined = auth0Res.body[0].created_at;
        }
        
        playerCache.set(uuid, body);
    }

    this.status = 200;
    this.body = playerCache.get(uuid);
}
