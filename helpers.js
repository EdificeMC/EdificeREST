'use strict';

const Boom = require('boom');
let rp = require('request-promise');

rp = rp.defaults({
    json: true
});

exports.validateUser = function*(authHeader) {
    if(!authHeader) {
        throw Boom.unauthorized();
    }
    
    const token = authHeader.substring(7);
    
    return yield rp({
        method: 'POST',
        uri: 'https://edifice.auth0.com/tokeninfo',
        body: {
            id_token: token
        }
    }).catch(function(err) {
        throw Boom.unauthorized();
    });
}
