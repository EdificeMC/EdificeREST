'use strict';

const verificationCodeSchema = require('./verificationcode.schema');
const rp = require('request-promise');
const config = require('config');
const helpers = require('../../helpers');
const Boom = require('boom');
const moment = require('moment');
let datastore;

const auth0rp = rp.defaults({
    headers: {
        'Authorization': `Bearer ${config.get('auth0Token')}`
    },
    simple: false,
    resolveWithFullResponse: true,
    json: true
});

exports.init = function(router, app) {
    router.post('/auth/verificationcode', grantVerificationCode);

    datastore = app.datastore;
};

function* grantVerificationCode() {
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
        throw Boom.badRequest('User already signed up.');
    }

    // Generate a new code if an existing one in the DS doesn't exist or is expired
    let iterations = 0;

    let minCreationMoment = moment();
    minCreationMoment.subtract(config.get('VERIFICATION_CODE_EXPIRY_HOURS'), 'hours');
    
    const query = datastore.createQuery('VerificationCode')
        .filter('playerId', '=', this.request.body.playerId)
        .filter('created', '>', minCreationMoment.toDate())
        .limit(1);
        
    let [existingPlayerCodes] = yield datastore.runQuery(query);
    let code = existingPlayerCodes[0];

    while(!code) {
        let newCode = Math.random().toString(36).substring(2, 8); // 6 character long alphanumeric string

        const query = datastore.createQuery('VerificationCode')
            .filter('code', '=', newCode);
            
        const [conflictingCodes] = yield datastore.runQuery(query);
        const conflictingCode = conflictingCodes[0];

        if(conflictingCode) {
            // Give up after 10 tries, although this shouldn't ever happen
            if(iterations > 10) {
                throw new Boom.badImplementation('Failed to generate a new verification code');
            }
            continue;
        }

        code = {
            playerId: this.request.body.playerId,
            code: newCode,
            created: new Date()
        };

        yield datastore.save({
            key: datastore.key('VerificationCode'),
            data: code
        });
    }

    this.status = 201;
    this.body = code;
}
