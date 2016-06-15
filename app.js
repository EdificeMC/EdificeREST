'use strict';

let koa = require('koa');
let bodyparser = require('koa-bodyparser');
let Router = require('koa-router');
let logger = require('winston');
require('./services/MongooseClient');

let app = koa({ name: 'Edifice' });

app.use(require('koa-logger')());
app.use(require('koa-cors')({ methods: ['GET', 'PUT', 'POST', 'DELETE'] }));
app.use(require('koa-static-server')({ rootDir: 'EdificeWeb/dist' }));
app.use(require('./middleware/boom'));
app.use(bodyparser());

// Set up routes
let router = new Router({ prefix: '/api' });
const controllers = ['structures/structures', 'stars/stars', 'stats/stats', 'playercache/playercache', 'imgur/imgur', 'auth/signup/signup', 'auth/verificationcode/verificationcode'];
controllers.forEach(function(file) {
    logger.info('Loading controller "' + file + '"...');
    require('./' + file + '.controller').init(router, app);
});

// load the routes
app.use(router.routes());

app.listen(3000);

module.exports = app;
