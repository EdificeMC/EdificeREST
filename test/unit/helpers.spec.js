'use strict';

const helpers = require('../../helpers');
const Boom = require('boom');
require('co-mocha');
const chai = require('chai');
chai.use(require('chai-subset'));
chai.use(require('chai-as-promised'));
const expect = chai.expect;

describe('Helpers', function() {
    describe('User validation', function() {
        it('should error for no auth header', function*() {
            // The `this` scope doesn't really matter, but it doesn't hurt
            expect(helpers.validateUser.bind(this, undefined)).to.throw('Unauthorized');
            expect(helpers.validateUser.bind(this, null)).to.throw('Unauthorized');
            expect(helpers.validateUser.bind(this, '')).to.throw('Unauthorized');
        });

        it('should error for invalid auth header', function*() {
            yield expect(helpers.validateUser('Bearer invalid-token')).to.be.rejectedWith('Unauthorized');
        });

        it('should correctly retrieve the user info from the auth header', function*() {
            const jwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2VkaWZpY2UuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDU3NmRjNjBiZjA1MzE0NmM2MzZlY2MxYSIsImF1ZCI6Imk2M1hRN1FQVm5ITmFkQnJ2Q3lXVkd2YVVQcUFHeENuIiwiZXhwIjoxNDY5NDAzOTgxLCJpYXQiOjE0NjY4MTE5ODF9.GTcKVVALYrseqcbMSAlp4iDrLTyK9a6Yhq6RtU_yHQE';
            const header = 'Bearer ' + jwt;

            // This object contains most of the properties from the user profile from Auth0 - they shouldn't ever change
            yield expect(helpers.validateUser(header)).to.eventually.containSubset({
                email: 'testuser@edificemc.com',
                nickname: 'testuser',
                name: 'testuser@edificemc.com',
                country: 'United States',
                clientID: 'i63XQ7QPVnHNadBrvCyWVGvaUPqAGxCn',
                user_id: 'auth0|576dc60bf053146c636ecc1a',
                identities: [{
                    user_id: '576dc60bf053146c636ecc1a',
                    provider: 'auth0',
                    connection: 'Username-Password-Authentication',
                    isSocial: false
                }],
                global_client_id: 'MYoski1lCntS4eAy8kmyvZvZ5hKVh9AO'
            });
        });
    });

    describe('Smart string equality', function() {
        it('should be false for different lengths', function*() {
            expect(helpers.stringEquals('test', 'testtest')).to.equal(false);
        });

        it('should be false for different strings of same length', function*() {
            // Different strings but same length
            expect(helpers.stringEquals('test', 'asdf')).to.equal(false);
        })

        it('should be true for matching strings', function*() {
            expect(helpers.stringEquals('test', 'test')).to.equal(true);
        });
    });
});
