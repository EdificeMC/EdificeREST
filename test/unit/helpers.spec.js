'use strict';

const Joi = require('joi');
const config = require('config');
const helpers = require('../../helpers');
const Boom = require('boom');
require('co-mocha');
const chai = require('chai');
chai.use(require('chai-subset'));
chai.use(require('chai-as-promised'));
const expect = chai.expect;

describe('Helpers', function() {
    describe('Input validation', function() {
        const schema = Joi.object().keys({
            foo: Joi.string().required()
        });

        it('should error for an invalid input', function*() {
            expect(helpers.validateInput.bind(this, {foo: true}, schema)).to.throw('ValidationError');
        });

        it('should not error for valid input', function*() {
            // If it returns nothing and doesn't throw an error, it's fine
            expect(helpers.validateInput({foo: 'bar'}, schema)).to.equal(undefined);
        });
    });

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
            const header = 'Bearer ' + config.get('TEST_USER_AUTH_TOKEN');

            // This object contains most of the properties from the user profile from Auth0 - they shouldn't ever change
            yield expect(helpers.validateUser(header)).to.eventually.containSubset({
                email: 'testuser@edificemc.com',
                picture: 'https://crafatar.com/avatars/00000000000000000000000000000000',
                nickname: 'testuser',
                name: 'testuser@edificemc.com',
                app_metadata: {
                    mcuuid: '00000000000000000000000000000000'
                },
                country: 'United States',
                clientID: 'i63XQ7QPVnHNadBrvCyWVGvaUPqAGxCn',
                user_id: 'auth0|577056fb8d8517a26aa03286',
                identities: [{
                    user_id: '577056fb8d8517a26aa03286',
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
