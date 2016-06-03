'use strict';

let Joi = require('joi');

let verificationCodeSchema = {};

verificationCodeSchema.input = Joi.object().keys({
    playerId: Joi.string().alphanum().length(32).required() // 32 w/o dashes, 36 w/
});

module.exports = verificationCodeSchema;
