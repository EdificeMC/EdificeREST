'use strict';

const boomMiddleware = require('../../middleware/boom');
const Boom = require('boom');
require('co-mocha');
const expect = require('chai').expect;

describe('Boom middleware', function() {
    it('should transform a non-Boom error', function*() {

        const nextMockup = new Promise(function() {
            throw new Error('Test error');
        });

        yield boomMiddleware.call(this, nextMockup);

        expect(this.status).to.equal(500);
        expect(this.body).to.deep.equal({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An internal server error occurred'
        });
    });

    it('should turn a Boom error into a status and body', function*() {
        const nextMockup = new Promise(function() {
            throw new Boom.notFound('missing');
        });

        yield boomMiddleware.call(this, nextMockup);

        expect(this.status).to.equal(404);
        expect(this.body).to.deep.equal({
            "statusCode": 404,
            "error": "Not Found",
            "message": "missing"
        });
    });
});
