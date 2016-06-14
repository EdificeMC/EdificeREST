'use strict';

var StatsTS = require('./StatsTS.model');
var Boom = require('boom');
var _ = require('lodash');

exports.init = function(router, app) {
    router.get('/stats/:id', getStats);
}

function* getStats() {
    let structureId = this.params.id;
    let statsTS = yield StatsTS.findOne({
        structureId
    }, '-__v').exec();
    if (!statsTS) {
        throw Boom.notFound('Stats TS data for structure with ID ' + structureId + ' not found.');
    }
    this.status = 200;
    this.body = statsTS;
}

exports.updateStars = function* (structureId, numStargazers) {
    return yield updateTSValue(structureId, 'stars', '$set', numStargazers);
}

exports.incrementViews = function* (structureId) {
    yield updateTSValue(structure, 'views', '$inc', 1);
}

function* updateTSValue(structureId, key, operation, value) {
    let statsTS = yield StatsTS.findOne({
        structureId
    }).exec();
    let now = new Date();
    let year = now.getFullYear() + '';
    let month = now.getMonth() + '';
    let date = now.getDate() + '';
    
    let path = `values.${year}.${month}.${date}.${key}`
    if (statsTS) {
        // Check if there is an entry for the specific key
        let update = {};
        update[operation] = {};
        update[operation][path] = value;
        yield StatsTS.update({
            structureId
        }, update);
    } else {
        let newDoc = {
            structureId
        };
        _.set(newDoc, path, value);

        yield StatsTS.create(newDoc);
    }
}
