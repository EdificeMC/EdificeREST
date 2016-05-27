'use strict';

var parse = require('co-body');
var http = require('axios');

exports.init = function(router, app) {
    router.post('/auth/login', login);
    router.post('/auth/logout', logout);
}

function* login() {
    var body = yield parse.json(this);
    body.agent = {
        name: "Minecraft",
        version: 1
    }

    var mojangRes = yield http.post('https://authserver.mojang.com/authenticate', body);

    this.status = mojangRes.status;
    this.body = mojangRes.data;
}

function* logout() {
    let body = yield parse.json(this);
    var mojangRes = yield http.post('https://authserver.mojang.com/invalidate', body);
    this.status = mojangRes.status;
    this.body = mojangRes.data;
}
