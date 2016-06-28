'use strict';

const koa = require('koa');
const bodyparser = require('koa-bodyparser');
const Router = require('koa-router');
const logger = require('winston');
const fs = require('fs');
const config = require('config');
const http = require('http');
const https = require('https');
require('./services/MongooseClient');

let app = koa({ name: 'Edifice' });

app.use(require('koa-logger')());
app.use(require('koa-cors')({ methods: ['GET', 'PUT', 'POST', 'DELETE'] }));
app.use(require('./middleware/boom'));
app.use(bodyparser());

// Set up routes
const router = new Router();
const controllers = ['structures/structures', 'stars/stars', 'stats/stats', 'playercache/playercache', 'imgur/imgur', 'auth/signup/signup', 'auth/verificationcode/verificationcode'];
controllers.forEach(function(file) {
    logger.info('Loading controller "' + file + '"...');
    require('./' + file + '.controller').init(router, app);
});

// load the routes
app.use(router.routes());

const port = config.get('API_PORT');
logger.info('Opening server on port ' + port);
if(process.env.NODE_ENV === 'production') {
    const options = {
        key: fs.readFileSync(config.get('KEY_PATH')),
        cert: fs.readFileSync(config.get('CERT_PATH'))
    };
    https.createServer(options, app.callback()).listen(port);
} else {
    http.createServer(app.callback()).listen(port);
}


module.exports = app;
