'use strict';

var StatsTS = require('./StatsTS.model');
var Structure = require('../structures/Structure.model');
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

exports.incrementViews = function* (structure, requestAgent) {
    let key = requestAgent === 'EdificeWeb' ? 'views' : 'downloads';
    yield updateTSValue(structure._id, key, '$inc', 1);
    
    // Record the agent (website, server plugin, etc.) used to make the request
    let update = {};
    if(structure.requests) {
        update['$inc'] = {};
        update['$inc']['requests.' + requestAgent] = 1;
    } else {
        _.set(update, 'requests.' + requestAgent, 1);
    }
    
    yield Structure.update({
        '_id': structure._id
    }, update);
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
        // Use Object w/ setWith to make sure the parts of the path (which are numbers) turn into object keys rather than array indices
        _.setWith(newDoc, path, value, Object);

        yield StatsTS.create(newDoc);
    }
}
