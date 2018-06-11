const q         = require('q');
const Component = require('component');
const winston   = require('winston');
const winstonLogzio = require('winston-logzio');


// Component implementation.
//
// Constructor, run, shutdown and configure methods are invoked by Kumori PaaS,
// managing instance lifecycle.

class DataStorage extends Component {


  // Constructor.
  //
  // - runtime: object providing toolkit API of the runtime agent that runs
  //    this component. In this example we will not use it.
  // - role: name of the role carried out by the component. In this example we
  //    will not use it, since this component doesn't play multiple roles in the
  //    service.
  // - iid: identifier assigned to this instance of the component. Typically
  //    there will be several instances of the component at a given time
  //    (variable over time depending on the load and performance).
  // - incnum: incarnation number. If an instance "dies" unexpectedly (e.g. due
  //    to a bug), the platform will restart it and increase this value.
  // - localdata: path where the instance can store data. It is volatile, and
  //    data persistence is not ensured on instance restart or relocation. All
  //    instances have this resource by default, although we will not use it in
  //    this example.
  // - resources: dictionary of assigned Kumori resources to the instance. For
  //    example, a persistent volume. We will not use it in this example.
  // - parameters: dictionary of instance configuration parameters. When
  //    deploying a service, value is given to the different parameters of each
  //    component, that particular instances can retrieve through this argument.
  //    In this example, the Fe component has a single configuration parameter
  //    named "sampleParameter", a string.
  // - dependencies: dictionary of the channels required by the component,
  //    through which you can issue requests to other roles or services.
  //    Keys are channel names, values are channel objects.
  // - offerings: dictionary of the channels offered by the component, through
  //    which you can answer requests from other roles or services.

  constructor(runtime, role, iid, incnum, localData, resources,
                parameters, dependencies, offerings ) {

    // Component class (parent) constructor invocation.
    super(...arguments);

    this.runtime = runtime;
    this.role = role;
    this.iid = iid;
    this.incnum = incnum;
    this.localData = localData;
    this.resources = resources;
    this.parameters = parameters;
    this.dependencies = dependencies;
    this.offerings = offerings;

    // In this example, the one and only instance configuration parameter is
    // used to configure the log system (in this example we use Winston with
    // Logz.io transport, but you could use your own, or use no logger at all).
    this.logger = winston;
    const loggerOptions = {
      token: this.parameters['logzioToken'],
      host: 'listener.logz.io'
    };
    try {
      var logzioWinstonTransport = new winstonLogzio(loggerOptions);
      this.logger.configure({ transports: [logzioWinstonTransport]});
    }
    catch(error) {
      // An error is thrown when logzioToken parameter is not found.
    }

    // Kumori Node.js runtime handles uncaught exceptions by default, but you
    // can provide your own handler.
    process.removeAllListeners('uncaughtException');
    process.on('uncaughtException', (err => {
      this.logger.error("UncaughtException: %s", err.stack);
      logzioWinstonTransport.flush(() => process.exit(1));
    }).bind(this));

    this.logger.info(`DataStorage.constructor role=${this.role} iid=${this.iid}`);

    // This component uses a Reply channel, through which the requests coming
    // from FE role arrive.
    const dataapiChannel = this.offerings['dataapi'];
    if (dataapiChannel == null) {
      throw new Error('Dataclient channel not found');
    }

    // We assign a custom function that handles requests.
    dataapiChannel.handleRequest = this._handleDataapiRequest.bind(this);

    this._storage = {};
  }


  // Method invoked by Kumori PaaS to start instance execution.
  // Not special to do in this example.

  run() {
    this.logger.info('DataStorage.run');
    super.run();
  }


  // Method invoked by Kumori PaaS to warn instance about its inminent
  // shutdown. Instance should take necessary actions in this situation,
  // persisting its state if needed. If the instance doesn't gracefully
  // shutdown, it will be killed, so be sure to fill this method.
  // Not special to do in this example, as we store data in memory.

  shutdown() {
    this.logger.info('DataStorage.shutdown');
    super.shutdown();
  }


  // Method invoked by Kumori PaaS to modify instance configuration.
  // Not really used in this example.

  reconfig(parameters) {
    this.logger.info('DataStorage.reconfig');
    super.reconfig(parameters);
  }


  // Handler for requests coming from dataapi channel:
  //    handleRequest = (message, dynamicChannels) -> ...
  //
  // - Message: array of segments (buffers) received in request.
  //    In this example we have a single segment, that is a
  //    serialized JSON with the following attributes:
  //     - a string with the requested operation.
  //     - a key
  //     - a value (only if operation is 'write')
  // - dynamicChannels: array of dynamic channels.
  //    Not used in this example.
  //
  // It returns a promise that is either:
  // - Resolved with an array of buffers.
  // or
  // - Rejected with an error.

  _handleDataapiRequest(message, dynamicChannels) {
    this.logger.info('DataStorage._handleRequest');

    return q.Promise((resolve, reject) => {
      try {
        message = JSON.parse(message[0].toString());

        let result;

        if (message.operation == null) {
          throw new Error('Undefined operation');
        }
        if (message.key == null) {
          throw new Error('Undefined key');
        }

        switch (message.operation) {
          case 'read':
            let value = this._storage[message.key];
            if (value == null) {
              value = 'not found';
            }
            result = {
              value,
              instance: this.iid
            };
            break;

          case 'write':
            if (message.value == null) {
              throw new Error('Undefined value');
            }
            this._storage[message.key] = message.value;
            result = {
              instance: this.iid
            };
            break;

          default:
            throw new Error(`Invalid operation (${message.operation})`);
        }
        resolve([JSON.stringify(result)]);
      } catch (err) {
        this.logger.warn(`DataStorage._handleRequest ${err.message}`);

        reject(err);
      }
    });
  }
}


module.exports = DataStorage;