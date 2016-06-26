'use strict';

let mongoose = require('mongoose');

const EXPIRY_HOURS = 1;

let VerificationCodeSchema = new mongoose.Schema({
  created: { type: Date, required: true },
  playerId: { type: String, required: true },
  code: { type: String, required: true }
});

VerificationCodeSchema.methods.isExpired = function() {
    let expiryDate = this.created.setHours(creationDate.getHours() + EXPIRY_HOURS);
    let now = new Date();

    if(expiryDate < now) {
        return true;
    }
    return false;
};

module.exports = mongoose.model('VerificationCode', VerificationCodeSchema);
