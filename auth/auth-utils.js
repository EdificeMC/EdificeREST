'use strict';

var http = require('axios');

exports.getEmailFromToken = function(bearerToken) {
    return http.get('https://api.mojang.com/user', {
        headers: {
            'Authorization': bearerToken
        }
    }).then(res => {
        return res.data.email;
    }).catch(res => {
        return null;
    });
}
