'use strict';

let Joi = require('joi');

let signupSchema = {};

signupSchema.input = Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    verificationCode: Joi.string().length(6).required()
});

module.exports = signupSchema;
