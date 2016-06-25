'use strict';

const Boom = require('boom');
const Joi = require('joi');
let rp = require('request-promise');

rp = rp.defaults({
    json: true
});

exports.validateInput = function(input, schema) {
    const inputValidation = Joi.validate(input, schema);
    if(inputValidation.error) {
        throw Boom.badRequest(inputValidation.error)
    }
}

exports.validateUser = function(authHeader) {
    if(!authHeader) {
        throw Boom.unauthorized();
    }

    //TODO check for 'Bearer ' and throw a bad request if it doesn't exist

    // 'Bearer ' is 7 chars long
    const token = authHeader.substring(7);

    return rp({
        method: 'POST',
        uri: 'https://edifice.auth0.com/tokeninfo',
        body: {
            id_token: token
        }
    }).catch(function(err) {
        throw Boom.unauthorized();
    });
}

// This will eliminate the possibility of a timing attack
// https://codahale.com/a-lesson-in-timing-attacks/
exports.stringEquals = function(actual, test) {
    if (actual.length !== test.length) {
        return false;
    }

    let result = true;
    for (let i = 0; i < test.length; i++) {
        result = result && test.charAt(i) === actual.charAt(i);
    }
    return result;
}
