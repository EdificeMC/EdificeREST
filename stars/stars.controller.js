'use strict';

let config = require('config');
var Boom = require('boom');
let helpers = require('../helpers');
let _ = require('lodash');
let rp = require('request-promise');
let datastore;

rp = rp.defaults({
    headers: {
        'Authorization': `Bearer ${config.get('auth0Token')}`
    },
    json: true
});

const STRUCTURE_COLLECTION_KEY = process.env.NODE_ENV === 'development' ? 'dev_Structure' : 'Structure';

exports.init = function(router, app) {
    router.post('/star', starStructure);

    datastore = app.datastore;
};

function* starStructure() {
    let user = yield helpers.validateUser(this.header.authorization);

    const structureId = this.request.body.structureId;

    // Update the structure's stargazers
    const transaction = datastore.transaction();
    yield transaction.run();

    let structure = yield transaction.get(datastore.key([STRUCTURE_COLLECTION_KEY, this.request.body.structureId]));
    if(!structure) {
        throw new Boom.notFound('Structure with ID ' + this.request.body.structureId + ' not found.');
    }

    let playerIdIndex = structure.data.stargazers.indexOf(user.app_metadata.mcuuid);
    if (playerIdIndex === -1) {
        structure.data.stargazers.push(user.app_metadata.mcuuid);
    } else {
        structure.data.stargazers.splice(playerIdIndex, 1);
    }

    transaction.save(structure);
    yield transaction.commit();

    let stars = _.get(user, 'user_metadata.stars', []);
    let structureIdIndex = stars.indexOf(structureId);
    if (structureIdIndex === -1) {
        stars.push(structureId);
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
    });

    this.body = null;
    this.status = 200;
}
