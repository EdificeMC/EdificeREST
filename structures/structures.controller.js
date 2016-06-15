'use strict';

var Boom = require('boom');
var Structure = require('./Structure.model');
var stats = require('../stats/stats.controller');

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
    const acceptedKeys = ['name', 'images'];
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
    if(this.query.agent) {
        yield stats.incrementViews(structure, this.query.agent);
    }
    
    this.status = 200;
    this.body = structure;
}
