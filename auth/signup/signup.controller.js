'use strict';

let Boom = require('boom');
let Joi = require('joi');
let rp = require('request-promise');
let config = require('../../config.json');
let signupSchema = require('./signup.schema');
let VerificationCode = require('../verificationcode/VerificationCode.model');

let auth0rp = rp.defaults({
    headers: {
        'Authorization': `Bearer ${config.auth0Token}`
    },
    simple: false,
    resolveWithFullResponse: true,
    json: true
});

exports.init = function(router, app) {
    router.post('/auth/signup', signup);
}

function* signup(next) {
    let inputValidation = Joi.validate(this.request.body, signupSchema.input);
    if(inputValidation.error) {
        throw Boom.badRequest(inputValidation.error)
    }
    // Validate verification code
    let verificationCode = yield VerificationCode.findOne({
        code: this.request.body.verificationCode
    })
    if(!verificationCode || verificationCode.isExpired()) {
        throw Boom.badRequest('Invalid verification code.');
    }
    
    let response = yield auth0rp({
        method: 'POST',
        uri: 'https://edifice.auth0.com/api/v2/users',
        body: {
            connection: 'Username-Password-Authentication',
            email: this.request.body.email,
            password: this.request.body.password,
            app_metadata: {
                mcuuid: verificationCode.playerId
            },
            picture: `https://crafatar.com/avatars/${verificationCode.playerId}`,
            email_verified: false
        }
    });
    
    if(response.statusCode !== 201) {
        throw Boom.create(response.statusCode, response.body.message);
    }
    
    VerificationCode.remove(verificationCode).exec();
    
    this.status = 201;
    this.body = {};
}