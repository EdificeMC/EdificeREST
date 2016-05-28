'use strict';

var User = require('../users/User.model');
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

    if (mojangRes.status === 200) {
        let user = yield User.findOne({
            uuid: mojangRes.data.selectedProfile.id
        }).exec();
        if (!user) {
            user = {
                email: body.username,
                uuid: mojangRes.data.selectedProfile.id,
                logins: [new Date()]
            }
            user = yield User.create(user);
        } else {
            let update = {};
            update.logins = user.logins;
            update.logins.push(new Date());
            yield User.update({
                uuid: mojangRes.data.selectedProfile.id
            }, update);
        }
    }

    this.status = mojangRes.status;
    this.body = mojangRes.data;
}

function* logout() {
    let body = yield parse.json(this);
    var mojangRes = yield http.post('https://authserver.mojang.com/invalidate', body);
    this.status = mojangRes.status;
    this.body = mojangRes.data;
}
