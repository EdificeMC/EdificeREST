'use strict';

var Boom = require('boom');
var parse = require('co-body');
var Structure = require('./Structure.model');

exports.init = function(router, app) {
    router.post('/structures', createStructure);
    router.put('/structures/:id', finalizeStructure);
    router.get('/structures', getAllStructures);
    router.get('/structures/:id', getStructure);
}

function* createStructure() {
    var structure = yield parse.json(this);
    structure.creatorUUID = structure.creatorUUID.replace(/-/g, '');
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
    let structureUpdate = yield parse.json(this);
    const acceptedKeys = ['name', 'images'];
    for(let key in structureUpdate) {
        if(!acceptedKeys.indexOf(key) === -1) {
            delete acceptedKeys[key];
        }
    }
    structureUpdate.finalized = true;
    console.log(structureUpdate);
    try {
        structure = yield Structure.update({'_id': this.params.id}, structureUpdate).exec();
    } catch (e) {
        console.error(e);
    }
    console.log(structure);
    this.status = 200;
    this.body = structure;
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
    this.status = 200;
    this.body = structure;
}
