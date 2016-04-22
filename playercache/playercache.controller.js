'use strict';

var http = require('axios');
var Cache = require('caching-map');
var playerCache = new Cache(10000);

exports.init = function(router, app) {
    router.get('/playercache/:uuid', getPlayerProfileByUUID);
}

function* getPlayerProfileByUUID() {
    const uuid = this.params.uuid.replace(/-/g, ''); // Get rid of all dashes
    if(!playerCache.has(uuid)) {
        let mojangResponse;
        try {
            mojangResponse = yield http.get('https://sessionserver.mojang.com/session/minecraft/profile/' + uuid);
            const playerProfile = mojangResponse.data;
            playerCache.set(uuid, playerProfile);
        } catch (e) {
            console.error(e.message);
            // TODO transform to Boom error
            throw e;
        }
    }

    this.status = 200;
    this.body = playerCache.get(uuid);
}
