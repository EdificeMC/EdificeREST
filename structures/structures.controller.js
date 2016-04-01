'use strict';

var parse = require('co-body');
var Structure = require('./Structure.model');

exports.init = function(router, app) {
    router.post('/structures', createStructure);
}

function *createStructure() {
    var structure = yield parse.json(this);
    structure = yield Structure.create(structure);
    this.status = 201;
    this.body = structure;
}
