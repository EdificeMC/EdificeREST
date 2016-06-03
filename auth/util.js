'use strict';

let config = require('../config.json');
let jwt = require('jsonwebtoken');
let bcrypt = require('bcrypt');
let bluebird = require('bluebird');

const SALT_ROUNDS = 10;

module.exports.hashPassword = function (rawPass) {
    let hash = bluebird.promisify(bcrypt.hash);
    return hash(rawPass, SALT_ROUNDS);
}

module.exports.compare = function(raw, hash) {
    let compare = bluebird.promisify(bcrypt.compare);
    return compare(raw, hash);
}

module.exports.generateAccessToken = function(user) {
    let sign = bluebird.promisify(jwt.sign);
    return sign({
        email: user.email
    }, config.jwtSecret, {
        expiresIn: '1m'
    })
}
