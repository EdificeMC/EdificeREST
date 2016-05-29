'use strict';

var logger = require('winston');
var Boom = require('boom');

module.exports = function* (next) {
    try {
        yield next;
    } catch(err) {
        let boomErr;
        if(err.isBoom) {
            boomErr = err;
        } else {
            logger.error('Unhandled error: ', err);
            boomErr = Boom.badImplementation('Unhandled error');
        }
        this.status = boomErr.output.statusCode;
        this.body = boomErr.output.payload;
    }
};
