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

describe('/playercache endpoint', function() {
    it('should get a known existing user', function*() {
        const uuid = '5d30e92c5ae24284a3ee74bc15077439' // My own personal UUID
        let res = yield rp('/playercache/' + uuid);

        expect(res.statusCode).to.equal(200);
        expect(res.headers['content-type']).to.contain('json');
        expect(res.body).to.containSubset({
            id: '5d30e92c5ae24284a3ee74bc15077439',
            name: 'Zirconium',
            joined: '2016-06-07T21:31:08.696Z'
        });
    });

    it('should fail to get the profile for a nonexistant MC account', function*() {
        const uuid = '00000000000000000000000000000000'; // Hopefully nobody ever gets this
        let res = yield rp('/playercache/' + uuid);

        expect(res.statusCode).to.equal(404);
        expect(res.body.error).to.equal('Not Found');
        expect(res.headers['content-type']).to.contain('json');
    });

    it('should still get the profile for a player w/o an Edifice account', function*() {
        const uuid = '61699b2ed3274a019f1e0ea8c3f06bc6' // It would be cool if Dinnerbone got an Edifice account, but it's doubtful
        let res = yield rp('/playercache/' + uuid);

        expect(res.statusCode).to.equal(200);
        expect(res.headers['content-type']).to.contain('json');
        expect(res.body).to.containSubset({
            id: '61699b2ed3274a019f1e0ea8c3f06bc6',
            name: 'Dinnerbone'
        });
        expect(res.body).to.not.have.property('joined'); // joined is specific to users w/ Edifice accounts
    })
});
