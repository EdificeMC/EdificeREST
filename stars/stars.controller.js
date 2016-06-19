'use strict';

let Structure = require('../structures/Structure.model');
let stats = require('../stats/stats.controller');
let config = require('config');
var Boom = require('boom');
let helpers = require('../helpers');
let _ = require('lodash');
let rp = require('request-promise');

rp = rp.defaults({
    headers: {
        'Authorization': `Bearer ${config.get('auth0Token')}`
    },
    json: true
});

exports.init = function(router, app) {
    router.post('/star', starStructure);
}

function* starStructure() {
    let user = yield helpers.validateUser(this.header.authorization);

    // Make sure the structure exists
    let structure = yield Structure.findOne({
        _id: this.request.body.structureId
    }).exec();
    if (!structure) {
        throw Boom.notFound('Structure with ID ' + this.request.body.structureId + ' does not exist.');
    }

    let stars = _.get(user, 'user_metadata.stars', []);
    let structureIdIndex = stars.indexOf(this.request.body.structureId);
    if (structureIdIndex === -1) {
        stars.push(this.request.body.structureId);
    } else {
        stars.splice(structureIdIndex, 1);
    }

    // Update the user metadata on Auth0
    yield rp({
        method: 'PATCH',
        uri: `https://edifice.auth0.com/api/v2/users/${user.user_id}`,
        body: {
            user_metadata: {
                stars
            }
        }
    }).catch(function(err) {
        throw Boom.wrap(err);
    })

    // Update the structure's stargazers
    let structureUpdate = {
        stargazers: structure.stargazers
    };
    let playerIdIndex = structureUpdate.stargazers.indexOf(user.app_metadata.mcuuid);
    if (playerIdIndex === -1) {
        structureUpdate.stargazers.push(user.app_metadata.mcuuid);
    } else {
        structureUpdate.stargazers.splice(playerIdIndex, 1);
    }
    yield Structure.update({
        _id: structure._id
    }, structureUpdate);

    yield stats.updateStars(structure._id, structureUpdate.stargazers.length);

    this.body = null;
    this.status = 200;
}
