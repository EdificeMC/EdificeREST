'use strict';

var http = require('axios');
var config = require('../config');

exports.init = function(router, app) {
    router.post('/imgur/', uploadImageToImgur);
}

function* uploadImageToImgur() {
    var imgurRes = yield http.post('https://api.imgur.com/3/image', this.request.body, {
        headers: {
            'Authorization': 'Client-ID ' + config.imgurClientId
        }
    });

    this.status = imgurRes.data.status;
    this.body = imgurRes.data.data;
}
