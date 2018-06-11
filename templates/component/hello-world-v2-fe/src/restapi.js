const path       = require('path');
const url        = require('url');
const http       = require('http-message');
const express    = require('express');
const q          = require('q');


// REST API v2 implementation.
//
// We have used Express, with only a single thing that is exclusively related
// to Kumori PaaS: instead of using Node.js http module, we are employing Kumori
// httpMessage module (see above require statement). This http server doesn't
// listen on certain IP+port, but on a Kumori channel.
//
// RestApi v2 implements two features:
// - write(key, value)
// - read(key) - returns value
//
// Data persistency (in-memory) is provided by dataStorage role, which is
// reachable through dataclientChannel channel.

class RestApi {


  constructor(entrypointChannel, dataclientChannel, logger) {
    this.entrypointChannel = entrypointChannel;
    this.dataclientChannel = dataclientChannel;
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

      // Listen on Kumori channel
      this.httpServer.listen(this.entrypointChannel, err => {
        this.logger.info(`RestApi.start listening on channel ${this.entrypointChannel.name}`);

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

    app.use('/', this._getRouter());
    app.use((req, res, next) => {
      res.status(404).send('Not Found')
    });

    return app;
  }


  _getRouter() {
    this.logger.info('RestApi._getRouter');

    const router = express.Router();

    router.get('/read', this._read.bind(this));
    router.get('/write', this._write.bind(this));

    return router;
  }


  _read(req, res) {
    const query = url.parse(req.url, true).query;
    const key = query != null ? query.key : undefined;

    this.logger.info(`RestApi._read key=${key}`);

    const message = JSON.stringify({
      operation: 'read',
      key
    });

    this._send(message, res);
  }


  _write(req, res) {
    const query = url.parse(req.url, true).query;
    const key = query != null ? query.key : undefined;
    const value = query != null ? query.value : undefined;

    this.logger.info(`RestApi._write key=${key} value=${value}`);

    const message = JSON.stringify({
      operation: 'write',
      key,
      value
    });

    this._send(message, res);
  }


  // Sending the request to the dataStorage role.
  //
  // It uses a Request channel:
  //     channel.sendRequest(message, dynamicChannels)
  //     .then (result) -> ...
  //     .fail (err) -> ...
  // - Message: array of segments to be sent.
  //    Segments are either strings or buffers (therefore, objects cannot be
  //    sent directly, they must be serialized).
  // - DynamicChannels: (optional) array of dynamic channels.
  //    Not used in this example.
  // - Result: array of arrays, where:
  //     - result[0][0] : status - **OBSOLETE** Not to be used.
  //     - result[0][1..] : array of segments received in the reply.
  //        Segments are buffers.
  //     - result[1] : (optional) array of dynamic channels received in the
  //        reply. Sin uso en este ejemplo.
  // - Err: Error object related to the rejected promise.
  // As an example:
  //  channel.sendRequest([value1, value2, value3], [dynChannel1, dynChannel2])
  //  .then ([[status, result1, result2], [dynChannel3]]) -> ...
  //  .fail (err) -> ...

  _send(message, response) {
    this.dataclientChannel.sendRequest([message])
    .then(([[status_DEPRECATED, reply], dynamicChannels]) => {
      reply = JSON.parse(reply.toString()); // Received Buffer -> String -> JSON

      response.status(200).json(reply);
    }).fail(err => {
      this.logger.warn(`RestApi:_send promise rejected ${err.message}`);

      response.status(500).json({ error: err.message });
    });
  }

  // Sending the request to the dataStorage role.
  //
  // It uses a Request channel:
  //     channel.sendRequest(message, dynamicChannels)
  //     .then (result) -> ...
  //     .fail (err) -> ...
  // - Message: array of segments to be sent.
  //    Segments are either strings or buffers (therefore, objects cannot be
  //    sent directly, they must be serialized).
  // - DynamicChannels: (optional) array of dynamic channels.
  //    Not used in this example.
  // - Result: Object with following keys:
  //     - message: array of segments received in the reply.
  //        Segments are buffers.
  //     - dynamicChannels: array of dynamic channels received in the reply.
  //        Not used in this example.
  // - Err: Error object related to the rejected promise.
  // As an example:
  //  channel.sendRequest([value1, value2, value3], [dynChannel1, dynChannel2])
  //  .then (result) -> ...
  //    // result: { message: [value1, value2, value3],
  //    //            dynamicChannels: [dynChannel1, dynChannel2] }
  //  .fail (err) -> ...

  _send(message, response) {
    this.dataclientChannel.sendRequest([message])
    .then(result => {
      //            JSON <- String <- Buffer
      const reply = JSON.parse(result.message.toString());

      response.status(200).json(reply);
    }).fail(err => {
      this.logger.warn(`RestApi:_send promise rejected ${err.message}`);

      response.status(500).json({ error: err.message });
    });
  }
}


module.exports = RestApi;