'use strict';

var koa = require('koa');
var bodyparser = require('koa-bodyparser');
var mount = require('koa-mount');
var Router = require('koa-router');
var logger = require('winston');
var mongoose = require('./services/MongooseClient');

var app = koa({ name: 'Edifice' });

app.use(require('koa-logger')());
app.use(require('koa-cors')({ methods: ['GET', 'PUT', 'POST', 'DELETE'] }));
app.use(require('koa-static-server')({ rootDir: 'EdificeWeb/dist' }));
app.use(require('./middleware/boom'));
app.use(bodyparser());

// Set up routes
var router = new Router({ prefix: '/api' });
const controllers = ['structures', 'stars', 'playercache', 'imgur'];
controllers.forEach(function(file) {
    logger.info('Loading controller "' + file + '"...');
    require('./' + file + '/' + file + '.controller').init(router, app);
});

// load the routes
app.use(router.routes());

// Mount the auth server
logger.info('Mounting the authentication app');
app.use(mount('/api/auth', require('../EdificeAuth')));

app.listen(3000);

module.exports = app;
