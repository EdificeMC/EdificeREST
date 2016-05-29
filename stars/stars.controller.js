'use strict';

var User = require('../users/User.model');
var Structure = require('../structures/Structure.model');
var StarsTS = require('./StarsTS.model');
var authUtils = require('../auth/auth-utils');
var Boom = require('boom');
var parse = require('co-body');
var http = require('axios');

exports.init = function(router, app) {
    router.post('/star', starStructure);
    router.get('/stars-history/:id', getStarHistory);
}

function* starStructure() {
    var body = yield parse.json(this);

    if (!this.header.authorization) {
        throw Boom.unauthorized();
    }

    // Getting the player's email from the access token serves two purposes:
    // * Validates the token
    // * Associates the bearer of the token with an Edifice user
    let playerEmail = yield authUtils.getEmailFromToken(this.header.authorization);
    if (!playerEmail) {
        throw Boom.unauthorized();
    }
    let user = yield User.findOne({
        email: playerEmail
    }).exec();

    if (!user) {
        // If this user has never logged in before, return not authorized
        throw Boom.unauthorized();
    }

    // Make sure the structure exists
    let structure = yield Structure.findOne({
        _id: body.structureId
    }).exec();
    if (!structure) {
        throw Boom.badData('Structure with ID ' + body.structureId + ' does not exist.');
    }

    // Update the user's stars
    let userUpdate = {
        stars: user.stars
    };
    let structureIdIndex = userUpdate.stars.indexOf(body.structureId);
    if (structureIdIndex === -1) {
        userUpdate.stars.push(body.structureId);
    } else {
        userUpdate.stars.splice(structureIdIndex, 1);
    }
    yield User.update({
        email: playerEmail
    }, userUpdate);

    // Update the structure's stargazers
    let structureUpdate = {
        stargazers: structure.stargazers
    };
    let playerIdIndex = structureUpdate.stargazers.indexOf(user.uuid);
    if (playerIdIndex === -1) {
        structureUpdate.stargazers.push(user.uuid);
    } else {
        structureUpdate.stargazers.splice(playerIdIndex, 1);
    }
    yield Structure.update({
        _id: structure._id
    }, structureUpdate);

    yield updateTimeSeries(structure._id, structureUpdate.stargazers.length);

    this.body = null;
    this.status = 200;
}

function* getStarHistory() {
    let structureId = this.params.id;
    let starsTS = yield StarsTS.findOne({
        structureId
    }, '-__v').exec();
    if (!starsTS) {
        throw Boom.badData('Star TS data for structure with ID ' + structureId + ' not found.');
    }
    this.status = 200;
    this.body = starsTS;
}

function updateTimeSeries(structureId, numStargazers) {
    return StarsTS.findOne({
            structureId
        }).exec()
        .then(starsTS => {
            let now = new Date();
            let year = now.getFullYear() + '';
            let month = now.getMonth() + '';
            let date = now.getDate() + '';
            if (starsTS) {
                let update = {
                    $set: {}
                };
                update.$set['values.' + year + '.' + month + '.' + date] = numStargazers;
                return StarsTS.update({
                    structureId
                }, update);
            } else {
                let newDoc = {
                    structureId,
                    values: {}
                };
                newDoc.values[year] = {};
                newDoc.values[year][month] = {};
                newDoc.values[year][month][date] = numStargazers;

                return StarsTS.create(newDoc);
            }
        });

}
