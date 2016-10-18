'use strict';

const Boom = require('boom');
const structureSchema = require('./structure.schema');
const helpers = require('../helpers');
const parse = require('co-busboy');
const _ = require('lodash');
const cuid = require('cuid');
const nbt = require('nbt');
const rp = require('request-promise');

let datastore;
let bucket;
const STRUCTURE_COLLECTION_KEY = process.env.NODE_ENV === 'development' ? 'dev_Structure' : 'Structure';
const STRUCTURE_BUCKET = process.env.NODE_ENV === 'development' ? 'dev-edifice-structures' : 'edifice-structures';

exports.init = function(router, app) {
    router.post('/structures', createStructure);
    router.put('/structures/:id', editStructure);
    router.get('/structures', getAllStructures);
    router.get('/structures/:id', getStructure);

    datastore = app.datastore;
    bucket = app.storage.bucket(STRUCTURE_BUCKET);
};

function* createStructure() {
    const parts = parse(this);
    const schematicDataStream = yield parts;

    // Upload the schematic
    const structureId = cuid();
    const fileName = structureId + '.schem';

    const remoteWriteStream = bucket.file(fileName).createWriteStream();
    schematicDataStream.pipe(remoteWriteStream);

    // Get some information from the schematic
    let structure = {
        schematic: `https://storage.googleapis.com/${STRUCTURE_BUCKET}/${fileName}`,
        finalized: false,
        hidden: false
    };

    const schematicDataBuffer = yield new Promise(function(resolve) {
        let data = [];
        schematicDataStream.on('data', chunk => data.push(chunk));
        schematicDataStream.on('end', () => resolve(Buffer.concat(data)));
    });

    const schematic = (yield new Promise(function(resolve, reject) {
        nbt.parse(schematicDataBuffer, function(err, data) {
            if(err) {
                return reject(err);
            }
            return resolve(data);
        });
    })).value;

    /* eslint-disable quotes */
    structure.author = _.get(schematic, "Metadata.value['.'].value.Author.value");
    structure.name = _.get(schematic, "Metadata.value['.'].value.Name.value");
    /* eslint-enable quotes */

    // Save the structure record
    yield datastore.save({
        key: datastore.key([STRUCTURE_COLLECTION_KEY, structureId]),
        data: structure
    });

    structure.id = structureId;

    this.status = 201;
    this.body = structure;
}

function* editStructure() {
    helpers.validateInput(this.request.body, structureSchema.edit.input);

    // the gcloud datastore takes only an int
    const structureId = this.params.id;

    const transaction = datastore.transaction();
    yield transaction.run();

    let structure = yield transaction.get(datastore.key([STRUCTURE_COLLECTION_KEY, structureId]));

    if(!structure) {
        throw Boom.notFound('Structure with ID ' + this.params.id + ' not found.');
    }

    if(structure.data.finalized) {
        let user = yield helpers.validateUser(this.header.authorization);
        if(user.app_metadata.mcuuid !== structure.data.creatorUUID && !user.app_metadata.roles.includes('admin')) {
            throw Boom.unauthorized();
        }
    } else {
        // The user doesn't need to be validated for the first edit/finalization
        // The user having the structure ID is enough identification
        structure.data.finalized = true;
    }

    _.merge(structure.data, this.request.body);
    structure.data.stargazers = [];
    transaction.save(structure);

    yield transaction.commit();

    this.status = 200;
    this.body = structure.data;
}

function* getAllStructures() {
    let searchTerms = {
        'finalized': true,
        'hidden': false
    };
    Object.assign(searchTerms, this.query || {});

    let query = datastore.createQuery(STRUCTURE_COLLECTION_KEY);

    if(searchTerms.limit) {
        query = query.limit(Number.parseInt(searchTerms.limit));
        delete searchTerms.limit;
    }

    if(searchTerms.cursor) {
        query = query.start(searchTerms.cursor);
        delete searchTerms.cursor;
    }

    for(const condition in searchTerms) {
        query = query.filter(condition, '=', searchTerms[condition]);
    }

    let [structures, info] = yield datastore.runQuery(query);

    for(let structure of structures) {
        structure.id = structure[datastore.KEY].name;
    }

    this.status = 200;
    this.body = {
        structures,
        info
    };
}

function* getStructure() {
    let structure = (yield datastore.get(datastore.key([STRUCTURE_COLLECTION_KEY, this.params.id])))[0];

    if(!structure) {
        throw new Boom.notFound('Structure with ID ' + this.params.id + ' not found.');
    }

    structure.id = this.params.id;

    if(this.query.schematic) {
        const schematicUrl = structure.schematic;
        const schematicDataBuffer = yield rp({
            method: 'GET',
            uri: schematicUrl,
            encoding: null
        });

        const jsonData = yield new Promise(function(resolve, reject) {
            nbt.parse(schematicDataBuffer, function(err, data) {
                if(err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
        cleanupNBT(jsonData);
        structure.schematic = jsonData.value;
    }

    this.status = 200;
    this.body = structure;
}

function cleanupNBT(obj) {
    for(const key in obj) {
        if(!obj.hasOwnProperty(key)) {
            continue;
        }

        const value = obj[key];
        if(value.type !== undefined && value.value !== undefined) {
            obj[key] = value.value;
        }

        if(typeof obj[key] === 'object' && !(obj[key] instanceof Array)) {
            cleanupNBT(obj[key]);
        }
    }
}
