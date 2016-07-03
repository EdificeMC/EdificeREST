'use strict';

const Boom = require('boom');
const stats = require('../stats/stats.controller');
const NodeCache = require('node-cache');
const structureSchema = require('./structure.schema');
const helpers = require('../helpers');
const _ = require('lodash');
let gcloud;
let datastore;

// Cache of IP addresses mapped to an array of structure IDs that they have done a GET request for in the past 24 hours
// This is used to make sure people don't inflate the number of views that are counted by refreshing the page/doing
// another request

// Each pair of IP + structure ID has to expire in 24 hours, not all of the structure IDs for a certain IP

// The cache structure is like so:
// {
//     '192.168.0.1': {
//         'structureId': true
//     }
// }
const ipCache = new NodeCache({
    useClones: false
});

exports.init = function(router, app) {
    router.post('/structures', createStructure);
    router.put('/structures/:id', finalizeStructure);
    router.get('/structures', getAllStructures);
    router.get('/structures/:id', getStructure);

    gcloud = app.gcloud;
    datastore = gcloud.datastore();
}

function* createStructure() {
    let structure = this.request.body;
    structure.finalized = false;

    const res = yield new Promise((resolve, reject) => {
        datastore.save({
            key: datastore.key('Structure'),
            data: structure
        }, function(err, res) {
            if(err) {
                return reject(err);
            }
            return resolve(res);
        });
    });

    // TODO figure out a better way to get the ID other than this magic path
    structure.id = _.get(res, 'mutationResults[0].key.path[0].id');
    // Remove the blocks to make the response smaller
    delete structure.blocks;

    this.status = 201;
    this.body = structure;
}

function* finalizeStructure() {
    helpers.validateInput(this.request.body, structureSchema.finalize.input);

    // the gcloud datastore takes only an int
    const structureId = parseInt(this.params.id);
    if(!structureId) {
        throw Boom.badRequest('Invalid structure ID');
    }

    const res = yield new Promise((resolve, reject) => {
        datastore.runInTransaction((transaction, done) => {
            transaction.get(datastore.key(['Structure', structureId]), (err, structure) => {
                if (err) {
                    return reject(err);
                }
                if(!structure) {
                    return reject(new Boom.notFound('Structure with ID ' + this.params.id + " not found."))
                }
                _.merge(structure.data, this.request.body);
                structure.data.finalized = true;
                transaction.save(structure);

                // Keep a reference around for including in the response
                this.structure = structure.data;

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

    this.status = 200;
    // Delete blocks from the response
    delete this.structure.blocks;
    this.body = this.structure
}

function* getAllStructures() {
    let searchTerms = {
        'finalized': true
    };
    Object.assign(searchTerms, this.query || {});
    let query = datastore.createQuery('Structure');
    for(const condition in searchTerms) {
        query = query.filter(condition, '=', searchTerms[condition]);
    }

    const res = yield new Promise((resolve, reject) => {
        datastore.runQuery(query, function(err, data) {
            if(err) {
                return reject(err);
            }
            return resolve(data);
        });
    })

    let structures = [];

    for(const entry of res) {
        delete entry.data.blocks;
        structures.push(entry.data);
    }

    this.status = 200;
    this.body = structures;
}

function* getStructure() {
    // the gcloud datastore takes only an int
    const structureId = parseInt(this.params.id);
    if(!structureId) {
        throw Boom.badRequest('Invalid structure ID');
    }

    const res = yield new Promise(function(resolve, reject) {
        datastore.get(datastore.key(['Structure', structureId]), function(err, data) {
            if(err) {
                return reject(err);
            }
            return resolve(data);
        })
    });

    if(!res) {
        throw new Boom.notFound('Structure with ID ' + this.params.id + " not found.");
    }

    // Keep track of this request as a metric in the DB
    // const agent = this.query.agent;
    // if(agent) {
    //     if(agent === 'EdificeWeb') {
    //         // Check the IP of the request sender so we don't count multiple views from the same IP in the same 24hr period
    //         let structureIdCache = ipCache.get(this.ip);
    //         if(structureIdCache) {
    //             if(!structureIdCache.get(this.params.id)) {
    //                 // The user has not yet gotten this structure in the last 24 hours
    //                 yield stats.incrementViews(structure, this.query.agent);
    //                 structureIdCache.set(this.params.id, true);
    //             }
    //         } else {
    //             yield stats.incrementViews(structure, this.query.agent);
    //             let newstructureIdCache = new NodeCache({
    //                 stdTTL: 86400 // 1 day = 86400 seconds
    //             });
    //             newstructureIdCache.set(this.params.id, true);
    //             ipCache.set(this.ip, newstructureIdCache);
    //         }
    //     }
    // }

    this.status = 200;
    this.body = res.data;
}
