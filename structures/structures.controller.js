'use strict';

var parse = require('co-body');
var Structure = require('./Structure.model');

exports.init = function(router, app) {
    router.post('/structures', createStructure);
}

function *createStructure() {
    var structure = yield parse.json(this);

    for(let block of structure.blocks) {
        sanitizeBlock(block, structure.originPosition);
    }
    delete structure.originPosition;

    structure = yield Structure.create(structure);

    this.status = 201;
    this.body = structure;
}

function sanitizeBlock(block, originPos) {
    removeContentVersion(block)
    delete block.WorldUuid;
    block.Position.X -= originPos.X;
    block.Position.Y -= originPos.Y;
    block.Position.Z -= originPos.Z;
}

function removeContentVersion(block) {
    for (let key in block) {
        if (typeof block[key] == "object" && block[key] !== null) {
            removeContentVersion(block[key]);
        } else {
            if(key === "ContentVersion") {
                delete block[key];
            }
        }
    }
}
