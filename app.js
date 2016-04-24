'use strict';

var koa = require('koa');
var Router = require('koa-router');
var logger = require('winston');
var mongoose = require('mongoose');

var app = koa({ name: 'Edifice' });

app.use(require('koa-cors')({ methods: 'GET,PUT,POST,DELETE' }));
app.use(require('koa-logger')());

app.use(require('koa-static-server')({ rootDir: 'public' }));

// Set up routes
var router = new Router({ prefix: '/api' });
const controllers = ['structures', 'playercache'];
controllers.forEach(function(file) {
    logger.info('Loading controller "' + file + '"...');
    require('./' + file + '/' + file + '.controller').init(router, app);
});

// Set up MongoDB connection
mongoose.connect('mongodb://localhost/edifice-test');

// load the routes
app.use(router.routes());

app.listen(3000);
