'use strict';

var parse = require('co-body');
var http = require('axios');

exports.init = function(router, app) {
    router.post('/auth', mojangAuth);
}

function* mojangAuth() {
    var body = yield parse.json(this);
    body.username = body.email;
    delete body.email;
    body.agent = {
        name: "Minecraft",
        version: 1
    }

    var mojangRes = yield http.post('https://authserver.mojang.com/authenticate', body);

    this.status = mojangRes.status;
    this.body = mojangRes.data;
}
