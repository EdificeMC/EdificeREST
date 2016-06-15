'use strict';

var mongoose = require('mongoose');

var StructureSchema = new mongoose.Schema({
    name: { type: String, required: true },
    creatorUUID: { type: String, required: true },
    width: { type: Number, required: true },
    length: { type: Number, required: true },
    height: { type: Number, required: true },
    blocks: { type: Array, required: true },
    direction: { type: String, required: true},
    finalized: { type: Boolean, required: true},
    images: { type: Array, required: false },
    stargazers: { type: Array, required: false },
    requests: { type: Object, required: false }
});

module.exports = mongoose.model('Structure', StructureSchema);
