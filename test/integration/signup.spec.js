'use strict';

const VerificationCode = require('../../auth/verificationcode/VerificationCode.model');
const config = require('config');
require('co-mocha');
const chai = require('chai');
chai.use(require('chai-subset'));
const expect = chai.expect;

let rp = require('request-promise');

const app = require('../../app').listen();

const auth0rp = rp.defaults({
    headers: {
        'Authorization': `Bearer ${config.get('auth0Token')}`
    },
    resolveWithFullResponse: true,
    simple: false,
    json: true
});

rp = rp.defaults({
    resolveWithFullResponse: true,
    json: true,
    simple: false,
    baseUrl: 'http://localhost:' + app.address().port
});

const TEMP_USER_EMAIL = 'temptestuser@edificemc.com';

describe('/auth/signup endpoint', function() {

    let tempUserId;

    // Insert verification codes needed for the tests into the DB
    before(function*() {
        yield VerificationCode.create({
            created: new Date().setFullYear(2000), // Make sure it's definitely expired
            playerId: '00000000000000000000000000000000',
            code: '111111'
        });

        yield VerificationCode.create({
            created: new Date(),
            playerId: '00000000000000000000000000000000',
            code: '222222'
        });
    });

    // Delete the created user (w/ email temptestuser@edificemc.com) from Auth0
    after(function*() {
        if(tempUserId) { // Will be a falsy if the test creating the user fails
            const delRes = yield auth0rp({
                method: 'DELETE',
                uri: 'https://edifice.auth0.com/api/v2/users/' + tempUserId
            });
        }
    });

    it('should fail due to nonexistant verification code', function*() {
        const body = {
            email: TEMP_USER_EMAIL,
            password: 'password',
            verificationCode: '000000'
        };

        let res = yield rp({
            method: 'POST',
            uri: '/auth/signup/',
            body
        });

        expect(res.statusCode).to.equal(400);
        expect(res.body.error).to.equal('Bad Request');
        expect(res.body.message).to.equal('Invalid verification code.');
        expect(res.headers['content-type']).to.contain('json');
        expect(res.body).to.be.an('object');
    });

    it('should fail due to an expired verification code', function*() {
        const body = {
            email: TEMP_USER_EMAIL,
            password: 'password',
            verificationCode: '111111'
        };

        let res = yield rp({
            method: 'POST',
            uri: '/auth/signup/',
            body
        });

        expect(res.statusCode).to.equal(400);
        expect(res.body.error).to.equal('Bad Request');
        expect(res.body.message).to.equal('Expired verification code.');
        expect(res.headers['content-type']).to.contain('json');
        expect(res.body).to.be.an('object');
    });

    it('should fail due to existing user w/ same email address', function*() {
        const body = {
            email: 'testuser@edificemc.com',
            password: 'password',
            verificationCode: '222222'
        };

        let res = yield rp({
            method: 'POST',
            uri: '/auth/signup/',
            body
        });

        expect(res.statusCode).to.equal(400);
        expect(res.body.error).to.equal('Bad Request');
        expect(res.body.message).to.equal('The user already exists.');
        expect(res.headers['content-type']).to.contain('json');
        expect(res.body).to.be.an('object');
    });

    it('should successfully create a new user', function*() {
        const body = {
            email: TEMP_USER_EMAIL,
            password: 'password',
            verificationCode: '222222'
        };

        let res = yield rp({
            method: 'POST',
            uri: '/auth/signup/',
            body
        });

        expect(res.statusCode).to.equal(201);
        expect(res.body).to.containSubset({
            email: TEMP_USER_EMAIL,
            picture: 'https://crafatar.com/avatars/00000000000000000000000000000000',
            email_verified: false,
            app_metadata: {
                mcuuid: '00000000000000000000000000000000'
            }
        });
        expect(res.headers['content-type']).to.contain('json');
        expect(res.body).to.be.an('object');

        tempUserId = res.body.user_id;
    });
});
