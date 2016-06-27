'use strict';

const config = require('config');
require('co-mocha');
var chai = require('chai');
chai.use(require('chai-subset'));
var expect = chai.expect;

var rp = require('request-promise');

const app = require('../../app').listen();
rp = rp.defaults({
    resolveWithFullResponse: true,
    json: true,
    simple: false,
    baseUrl: 'http://localhost:' + app.address().port
})

describe('/auth/verificationcode endpoint', function() {
    describe('get a code', function() {
        const existingUserBody = {
            playerId: '00000000000000000000000000000000'
        };

        it('should fail due to incorrect token', function*() {
            let res = yield rp({
                method: 'POST',
                uri: '/auth/verificationcode/',
                body: existingUserBody,
                headers: {
                    'Authorization': 'foo'
                }
            });

            expect(res.statusCode).to.equal(401);
            expect(res.body.error).to.equal('Unauthorized');
            expect(res.headers['content-type']).to.contain('json');
            expect(res.body).to.be.an('object');
        });

        it('should fail due to already signed up user', function*() {
            let res = yield rp({
                method: 'POST',
                uri: '/auth/verificationcode/',
                body: existingUserBody,
                headers: {
                    'Authorization': config.get('edificeMCAuth')
                }
            });

            expect(res.statusCode).to.equal(400);
            expect(res.body.error).to.equal('Bad Request');
            expect(res.body.message).to.equal(`User with UUID ${existingUserBody.playerId} has already signed up.`);
            expect(res.headers['content-type']).to.contain('json');
            expect(res.body).to.be.an('object');
        });

        it('should correctly get a code', function*() {
            const body = {
                playerId: '10000000000000000000000000000000'
            }

            let res = yield rp({
                method: 'POST',
                uri: '/auth/verificationcode/',
                body,
                headers: {
                    'Authorization': config.get('edificeMCAuth')
                }
            });

            expect(res.statusCode).to.equal(201);
            expect(res.body.playerId).to.equal(body.playerId);
            expect(res.body.code).to.have.lengthOf(6);
            expect(res.headers['content-type']).to.contain('json');
            expect(res.body).to.be.an('object');
        })
    });
});
