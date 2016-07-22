'use strict';

let Joi = require('joi');

let verificationCodeSchema = {};

verificationCodeSchema.input = Joi.object().keys({
    playerId: Joi.string().alphanum().length(36).required()
});

module.exports = verificationCodeSchema;
