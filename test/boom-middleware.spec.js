'use strict';

const boomMiddleware = require('../middleware/boom');
require('co-mocha');
const chai = require('chai');
chai.use(require('chai-subset'));
const expect = chai.expect;

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
});
