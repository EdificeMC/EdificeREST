'use strict';

let Boom = require('boom');
let Joi = require('joi');
let signupSchema = require('./signup.schema');
let util = require('../util');
let User = require('../../users/User.model');
let VerificationCode = require('../verificationcode/VerificationCode.model');

exports.init = function(router, app) {
    router.post('/auth/signup', signup);
}

function* signup(next) {
    let inputValidation = Joi.validate(this.request.body, signupSchema.input);
    if(inputValidation.error) {
        throw Boom.badRequest(inputValidation.error)
    }
    // Validate verification code
    let verificationCode = yield VerificationCode.findOne({
        code: this.request.body.verificationCode
    })
    if(!verificationCode || verificationCode.isExpired()) {
        throw Boom.badRequest('Invalid verification code.');
    }
    // Check for an existing user w/ that email
    let existingUser = yield User.findOne({
        email: this.request.body.email
    });
    if(existingUser) {
        throw Boom.conflict(`User with email ${this.request.body.email} already exists.`);
    }
    
    VerificationCode.remove(verificationCode).exec();
    
    this.request.body.password = yield util.hashPassword(this.request.body.password);
    let newUser = yield User.create({
        email: this.request.body.email,
        password: this.request.body.password,
        uuid: verificationCode.playerId,
        joined: new Date(),
        logins: [new Date()]
    });
    
    this.status = 201;
    this.body = {
        profile: {
            uuid: newUser.uuid,
            joined: newUser.joined,
            logins: newUser.logins
        },
        accessToken: yield util.generateAccessToken(newUser)
    };
}
