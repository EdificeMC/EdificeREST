'use strict';

let config = require('config');
var Boom = require('boom');
let helpers = require('../helpers');
let _ = require('lodash');
let rp = require('request-promise');
let gcloud;
let datastore;

rp = rp.defaults({
    headers: {
        'Authorization': `Bearer ${config.get('auth0Token')}`
    },
    json: true
});

exports.init = function(router, app) {
    router.post('/star', starStructure);

    gcloud = app.gcloud;
    datastore = gcloud.datastore();
};

function* starStructure() {
    let user = yield helpers.validateUser(this.header.authorization);

    const structureId = this.request.body.structureId;

    // Update the structure's stargazers
    yield new Promise((resolve, reject) => {
        datastore.runInTransaction((transaction, done) => {
            transaction.get(datastore.key(['Structure', this.request.body.structureId]), (err, structure) => {
                if (err) {
                    return reject(err);
                }
                if(!structure) {
                    return reject(new Boom.notFound('Structure with ID ' + this.request.body.structureId + ' not found.'));
                }

                let playerIdIndex = structure.data.stargazers.indexOf(user.app_metadata.mcuuid);
                if (playerIdIndex === -1) {
                    structure.data.stargazers.push(user.app_metadata.mcuuid);
                } else {
                    structure.data.stargazers.splice(playerIdIndex, 1);
                }

                transaction.save(structure);
                done();
            });
        }, function(transactionError) {
            if (transactionError) {
                return reject(transactionError);
            }
            return resolve();
        });
    }).catch(err => {
        if(err.isBoom) {
            throw err;
        }
    });

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
