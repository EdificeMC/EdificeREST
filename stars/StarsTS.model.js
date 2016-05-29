'use strict';

var mongoose = require('mongoose');

var StarsTSSchema = new mongoose.Schema({
    structureId: { type: String, required: true },
    values: { type: Object, required: true }
});

module.exports = mongoose.model('StarsTS', StarsTSSchema);
