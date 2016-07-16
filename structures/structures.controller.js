'use strict';

const Boom = require('boom');
const structureSchema = require('./structure.schema');
const helpers = require('../helpers');
const _ = require('lodash');
let gcloud;
let datastore;

exports.init = function(router, app) {
    router.post('/structures', createStructure);
    router.put('/structures/:id', finalizeStructure);
    router.get('/structures', getAllStructures);
    router.get('/structures/:id', getStructure);

    gcloud = app.gcloud;
    datastore = gcloud.datastore();
};

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

    yield new Promise((resolve, reject) => {
        datastore.runInTransaction((transaction, done) => {
            transaction.get(datastore.key(['Structure', structureId]), (err, structure) => {

                if (err) {
                    return reject(err);
                }
                if(!structure) {
                    return reject(new Boom.notFound('Structure with ID ' + this.params.id + ' not found.'));
                }
                _.merge(structure.data, this.request.body);
                structure.data.finalized = true;
                structure.data.stargazers = [];
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
    this.body = this.structure;
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
    });

    let structures = [];

    for(const entry of res) {
        const structure = entry.data;
        delete structure.blocks;
        structure.id = entry.key.id;
        structures.push(structure);
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
        });
    });

    if(!res) {
        throw new Boom.notFound('Structure with ID ' + this.params.id + ' not found.');
    }

    this.status = 200;
    this.body = res.data;
}
