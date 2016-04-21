'use strict';

var mongoose = require('mongoose');

var StructureSchema = new mongoose.Schema({
    name: { type: String, required: true },
    creatorUUID: { type: String, required: true },
    width: { type: Number, required: true },
    length: { type: Number, required: true },
    height: { type: Number, required: true },
    blocks: { type: Array, required: true },
    direction: { type: String, required: true}
});

module.exports = mongoose.model('Structure', StructureSchema);
