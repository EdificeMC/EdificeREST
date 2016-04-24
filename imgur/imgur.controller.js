'use strict';

var parse = require('co-body');
var http = require('axios');
var config = require('../config');

exports.init = function(router, app) {
    router.post('/imgur/', uploadImageToImgur);
}

function* uploadImageToImgur() {
    var body = yield parse.json(this);

    var imgurRes = yield http.post('https://api.imgur.com/3/image', body, {
        headers: {
            'Authorization': 'Client-ID ' + config.imgurClientId
        }
    });

    this.status = imgurRes.data.status;
    this.body = imgurRes.data.data;
}
