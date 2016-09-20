'use strict';

const koa = require('koa');
const bodyparser = require('koa-bodyparser');
const Router = require('koa-router');
const logger = require('winston');
const config = require('config');
const gcloud = require('gcloud')({
    projectId: 'project-2072714222187644603'
});

let app = koa({ name: 'Edifice' });

app.gcloud = gcloud; // Keep the configured instance of gcloud around in app

app.use(require('koa-logger')());
app.use(require('koa-cors')({ methods: ['GET', 'PUT', 'POST', 'DELETE'] }));
app.use(require('./middleware/boom'));
app.use(bodyparser());

// Set up routes
const router = new Router();
const controllers = ['structures/structures', 'stars/stars', 'playercache/playercache', 'imgur/imgur', 'auth/signup/signup', 'auth/verificationcode/verificationcode'];
controllers.forEach(function(file) {
    logger.info('Loading controller "' + file + '"...');
    require('./' + file + '.controller').init(router, app);
});

// load the routes
app.use(router.routes());

const port = config.get('API_PORT');
logger.info('Opening server on port ' + port);
app.listen(port);

module.exports = app;
