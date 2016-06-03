'use strict';

let Boom = require('boom');
let Joi = require('joi');
let loginSchema = require('./login.schema');
let util = require('../util');
let User = require('../../users/User.model');
let VerificationCode = require('../verificationcode/VerificationCode.model');

exports.init = function(router, app) {
    router.post('/auth/login', login);
}

function* login(next) {
    let inputValidation = Joi.validate(this.request.body, loginSchema.input);
    if(inputValidation.error) {
        throw Boom.badRequest(inputValidation.error)
    }
    
    let user = yield User.findOne({
        email: this.request.body.email
    }).exec();
    if (!user) {
        throw Boom.notFound(`User with email ${this.request.body.email} does not exist.`)
    }
    let passMatches = yield util.compare(this.request.body.password, user.password);
    
    if(!passMatches) {
        throw Boom.unauthorized('Authentication failed');
    }
    
    this.status = 200;
    this.body = {
        profile: {
            uuid: user.uuid,
            joined: user.joined
        },
        accessToken: yield util.generateAccessToken(user)
    };
}
