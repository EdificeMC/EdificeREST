'use strict';

let Joi = require('joi');

let signupSchema = {};

signupSchema.input = Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(), // Won't enforce the regex in case it ever changes in the future
});

module.exports = signupSchema;
