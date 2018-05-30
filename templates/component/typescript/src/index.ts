import { BaseComponent, ChannelHash, Reply, Runtime } from '@kumori/component';
import * as http from 'http-message';
// go write something interesting

class Component extends BaseComponent {

  private httpChannel:Reply;

  constructor
    (public runtime: Runtime     // TODO: type of RUNTIME instead
    , public role: string         // ID of the role as a string.
    , public iid: string
    , public incnum: number       // An integer, also
    , public localData: string    // TODO: what is this? a Path?
    , public resources: Object   // A dictionary of key/value pairs. TODO: revise this definition
    , public parameters: Object  // Again, an object used as a dictionary
    , public dependencies: ChannelHash
    , public offerings: ChannelHash
    ) {
      super(runtime, role, iid, incnum, localData, resources, parameters, dependencies, offerings);
      this.httpChannel = offerings.endpoint as Reply;
  }

  run (): void {
    super.run();
    const server = http.createServer();
    server.on('request', (req, res) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Hello World\n');
    });
    
    server.listen(this.httpChannel);
  }
}
module.exports = Component;
