'use strict';

require('co-mocha');
var chai = require('chai');
chai.use(require('chai-subset'));
var expect = chai.expect;

var rp = require('request-promise');

const app = require('../app').listen();
rp = rp.defaults({
    resolveWithFullResponse: true,
    json: true,
    baseUrl: 'http://localhost:' + app.address().port + '/api'
})

describe('/structures endpoint', function() {
    describe('create', function() {
        it('should create a structure', function*() {
            const structure = {
                "name" : "lapis block",
                "creatorUUID": "00000000-0000-0000-0000-000000000000",
                "width" : 1,
                "length" : 1,
                "height" : 1,
                "direction" : "WEST",
                "blocks" : [
                    {
                        "ContentVersion" : 1,
                        "Position" : {
                            "Z" : 0,
                            "Y" : 0,
                            "X" : 0
                        },
                        "BlockState" : {
                            "ContentVersion" : 2,
                            "BlockState" : "minecraft:lapis_block"
                        }
                    }
                ]
            };

            let res = yield rp({
                method: 'POST',
                uri: '/structures/',
                body: structure
            });

            expect(res.statusCode).to.equal(201);
            expect(res.headers['content-type']).to.contain('json');
            expect(res.body).to.be.an('object');
            expect(res.body).to.containSubset(structure);
        });
    });
});
