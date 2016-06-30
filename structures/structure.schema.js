'use strict';

let Joi = require('joi');

let structureSchema = {
    finalize: {
        input: Joi.object().keys({
            name: Joi.string().alphanum().max(50).optional(),
            screenshot: Joi.object().keys({
                url: Joi.string().uri().required(),
                deletehash: Joi.string().required()
            }).required()
        })
    }
};

module.exports = structureSchema;
