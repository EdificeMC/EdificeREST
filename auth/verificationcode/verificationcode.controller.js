'use strict';

let VerificationCode = require('./VerificationCode.model');
let verificationCodeSchema = require('./verificationcode.schema');
let rp = require('request-promise');
let config = require('config');
const helpers = require('../../helpers');
let Boom = require('boom');

let auth0rp = rp.defaults({
    headers: {
        'Authorization': `Bearer ${config.get('auth0Token')}`
    },
    simple: false,
    resolveWithFullResponse: true,
    json: true
});

exports.init = function(router, app) {
    router.post('/auth/verificationcode', grantVerificationCode);
}

function* grantVerificationCode(next) {
    helpers.validateInput(this.request.body, verificationCodeSchema.input);

    // Make sure the sender is authorized
    if(!this.header.authorization || !helpers.stringEquals(config.get('edificeMCAuth'), this.header.authorization)) {
        throw Boom.unauthorized();
    }

    let existingUsersRes = yield auth0rp({
        uri: `https://edifice.auth0.com/api/v2/users?q=mcuuid%3D${this.request.body.playerId}&search_engine=v2`
    });

    let existingUsers = existingUsersRes.body;
    if(existingUsers.length > 0) {
        throw Boom.badRequest(`User with UUID ${this.request.body.playerId} has already signed up.`)
    }

    // Generate a new code if an existing one in the DB doesn't exist or is expired
    let iterations = 0;
    let code = yield VerificationCode.findOne({
        playerId: this.request.body.playerId
    })
    while(!code || code.isExpired()) {
        let newCode = Math.random().toString(36).substring(2, 8); // 6 character long alphanumeric string
        code = yield VerificationCode.findOne({
            code: newCode
        }).exec();
        if(!code) {
            code = yield VerificationCode.create({
                code: newCode,
                playerId: this.request.body.playerId
            })
        }
        // Give up after 10 tries, although this shouldn't ever happen
        if(iterations > 10) {
            throw new Boom.badImplementation('Failed to generate a new verification code');
        }
    }
    // Sanitize output
    code._id = undefined;
    code.__v = undefined;

    this.status = 201;
    this.body = code;
}
