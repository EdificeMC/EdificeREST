'use strict';

let Joi = require('joi');

let structureSchema = {
    edit: {
        input: Joi.object().keys({
            name: Joi.string().max(50).optional(),
            screenshot: Joi.object().keys({
                url: Joi.string().uri().required(),
                deletehash: Joi.string().required()
            }).required(),
            modelRendering: Joi.object().keys({
                fov: Joi.number().required(),
                lon: Joi.number().required(),
                lat: Joi.number().required(),
                texturePack: Joi.string().required(),
            }).optional()
        })
    }
};

module.exports = structureSchema;
