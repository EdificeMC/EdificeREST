'use strict';

let Joi = require('joi');

let signupSchema = {};

signupSchema.input = Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/).required(), // at least 8 chars, 1 alphabet, 1 number see: http://stackoverflow.com/questions/19605150/regex-for-password-must-be-contain-at-least-8-characters-least-1-number-and-bot
    verificationCode: Joi.string().length(6).required()
});

module.exports = signupSchema;
