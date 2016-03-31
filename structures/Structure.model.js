'use strict';

var mongoose = require('mongoose');

var StructureSchema = new mongoose.Schema({
    name: { type: String, required: true },
    creatorUUID: { type: String, required: true },
    blocks: { type: Array, required: true }
});

module.exports = mongoose.model('Structure', StructureSchema);
