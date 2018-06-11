const path       = require('path');
const http       = require('http-message');
const express    = require('express');
const q          = require('q');


// REST API implementation.
//
// We have used Express, with only a single thing that is exclusively related
// to Kumori PaaS: instead of using Node.js http module, we are employing Kumori
// httpMessage module (see above require statement). This http server doesn't
// listen on certain IP+port, but on a Kumori channel.
//
// The API is quite simple:
// On / we serve a static page.
// On /api/sayhello, we reply with 'Hello world!' message.
// On /api/echo, we reply with message received in request msg parameter.
// On any other path, we reply with 404 Not Found.

class RestApi {


  constructor(channel, logger) {
    this.channel = channel;
    this.logger = logger;
    this.logger.info('RestApi.constructor');
  }


  start() {
    this.logger.info('RestApi.start');

    return q.Promise((resolve, reject) => {
      const expressApp = this._createExpressApp();
      this.httpServer = http.createServer(expressApp);
      // http-message instances can make use of a Winston-like logger
      this.httpServer.logger = this.logger;

      this.httpServer.on('error', err => {
        this.logger.error(`RestApi.start onError ${err.stack}`);
      });

      this.httpServer.listen(this.channel, err => { // Listens on Kumori channel
        this.logger.info(`RestApi.start listening on channel ${this.channel.name}`);

        if (err != null) {
          this.logger.error(`RestApi.start OnListen ${err.stack}`);
          reject(err);
        }
        else {
          resolve();
        }
      });
    });
  }


  stop() {
    this.logger.info('RestApi.stop');

    return q.Promise((resolve, reject) => {
      this.httpServer.close(() => {
        this.logger.info('RestApi.stop stopped');
        resolve();
      });
    });
  }


  _createExpressApp() {
    this.logger.info('RestApi._createExpressApp');

    const app = express();

    app.use('/', express.static(path.join(__dirname, 'static')));
    app.use('/api/sayhello', (req, res, next) => {
      res.status(200).send('Hello world!');
    });
    app.get('/api/echo/:msg', (req, res) => {
      res.send(req.params.msg);
    });
    app.use((req, res, next) => {
      res.status(404).send('Not Found');
    });

    return app;
  }
}


module.exports = RestApi;