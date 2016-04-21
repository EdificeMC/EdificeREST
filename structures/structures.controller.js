'use strict';

var parse = require('co-body');
var Structure = require('./Structure.model');

exports.init = function(router, app) {
    router.post('/structures', createStructure);
    router.get('/structures', getAllStructures);
    router.get('/structures/:id', getStructure);
}

function* createStructure() {
    var structure = yield parse.json(this);
    structure = yield Structure.create(structure);
    this.status = 201;
    this.body = structure;
}

function* getAllStructures() {
    var structures = yield Structure.find({}, '-__v').exec();
    this.status = 200;
    this.body = structures;
}

function* getStructure() {
    var structure = yield Structure.findOne({
        '_id': this.params.id
    }, '-__v').exec();
    this.status = structure ? 200 : 404;
    this.body = structure ? structure : {
        message: 'Structure with ID ' + this.params.id + " not found."
    }
}
