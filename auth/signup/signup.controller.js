'use strict';

let Boom = require('boom');
const helpers = require('../../helpers');
let rp = require('request-promise');
let config = require('config');
const moment = require('moment');
let signupSchema = require('./signup.schema');
let datastore;

let auth0rp = rp.defaults({
    headers: {
        'Authorization': `Bearer ${config.get('auth0Token')}`
    },
    simple: false,
    resolveWithFullResponse: true,
    json: true
});

exports.init = function(router, app) {
    router.post('/auth/signup', signup);

    datastore = app.datastore;
};

function* signup() {
    helpers.validateInput(this.request.body, signupSchema.input);
    
    // Validate verification code
    const query = datastore.createQuery('VerificationCode')
        .filter('code', '=', this.request.body.verificationCode)
        .limit(1);
    
    const [existingCodes] = yield datastore.runQuery(query);

    const verificationCode = existingCodes[0];

    if(!verificationCode) {
        throw Boom.badRequest('Invalid verification code.');
    }
    
    if(isVerificationCodeExpired(verificationCode)) {
        throw Boom.badRequest('Expired verification code.');
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
    
    const transaction = datastore.transaction();
    yield transaction.run();
    
    transaction.delete(datastore.key(['VerificationCode', verificationCode[datastore.KEY].id]));
    
    yield transaction.commit();
    
    this.status = 201;
    this.body = response.body;
}

function isVerificationCodeExpired(code) {
    const now = moment();
    return moment(code.created).isBefore(now);
}
