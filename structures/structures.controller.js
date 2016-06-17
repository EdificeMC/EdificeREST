'use strict';

var Boom = require('boom');
var Structure = require('./Structure.model');
var stats = require('../stats/stats.controller');
let NodeCache = require('node-cache');

// Cache of IP addresses mapped to an array of structure IDs that they have done a GET request for in the past 24 hours
// This is used to make sure people don't inflate the number of views that are counted by refreshing the page/doing
// another request

// Each pair of IP + structure ID has to expire in 24 hours, not all of the structure IDs for a certain IP

// The cache structure is like so:
// {
//     '192.168.0.1': {
//         'structureId': true
//     }
// }
let ipCache = new NodeCache({
    useClones: false
});

exports.init = function(router, app) {
    router.post('/structures', createStructure);
    router.put('/structures/:id', finalizeStructure);
    router.get('/structures', getAllStructures);
    router.get('/structures/:id', getStructure);
}

function* createStructure() {
    var structure = this.request.body;
    structure.finalized = false;
    structure = yield Structure.create(structure);
    this.status = 201;
    this.body = structure;
}

function* finalizeStructure() {
    let structure = yield Structure.findOne({
        '_id': this.params.id
    }).exec();
    if(!structure) {
        throw new Boom.notFound('Structure with ID ' + this.params.id + " not found.");
    }
    let structureUpdate = this.request.body;
    // TODO Do some better validation than this
    const acceptedKeys = ['name', 'screenshot'];
    for(let key in structureUpdate) {
        if(!acceptedKeys.indexOf(key) === -1) {
            delete acceptedKeys[key];
        }
    }
    structureUpdate.finalized = true;
    yield Structure.update({'_id': this.params.id}, structureUpdate).exec();
    
    this.status = 200;
    this.body = yield Structure.findOne({
        '_id': this.params.id
    }).exec();
}

function* getAllStructures() {
    let searchTerms = {
        'finalized': true
    };
    Object.assign(searchTerms, this.query || {});
    var structures = yield Structure.find(searchTerms, '-blocks -__v').exec();
    this.status = 200;
    this.body = structures;
}

function* getStructure() {
    var structure = yield Structure.findOne({
        '_id': this.params.id
    }, '-__v').exec();
    if(!structure) {
        throw new Boom.notFound('Structure with ID ' + this.params.id + " not found.");
    }
    
    // Keep track of this request as a metric in the DB
    const agent = this.query.agent;
    if(agent) {
        if(agent === 'EdificeWeb') {
            // Check the IP of the request sender so we don't count multiple views from the same IP in the same 24hr period
            let structureIdCache = ipCache.get(this.ip);
            if(structureIdCache) {
                if(!structureIdCache.get(this.params.id)) {
                    // The user has not yet gotten this structure in the last 24 hours
                    yield stats.incrementViews(structure, this.query.agent);
                    structureIdCache.set(this.params.id, true);
                }
            } else {
                yield stats.incrementViews(structure, this.query.agent);
                let newstructureIdCache = new NodeCache({
                    stdTTL: 86400 // 1 day = 86400 seconds
                });
                newstructureIdCache.set(this.params.id, true);
                ipCache.set(this.ip, newstructureIdCache);
            }
        }
    }
    
    this.status = 200;
    this.body = structure;
}
