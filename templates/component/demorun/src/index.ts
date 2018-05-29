import { BaseComponent, ChannelHash, Message, Reply, Runtime, Segment } from '@kumori/component';
import * as vm from 'vm';
import * as q from 'q';
// go write something interesting

class Component extends BaseComponent {

  private work:Reply;

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
      this.work = offerings.work as Reply;
      this.iid = iid;
  }

  run (): void {
    super.run();
    this.work.handleRequest = (request:Message): Promise<Message> => {
      try {
        const sandbox = {
          _worker: this.iid
        };
        let code:string = request[0].toString();
        vm.runInNewContext(code, sandbox);
        let response = [[new Buffer(JSON.stringify(sandbox))]];
        return q.resolve(response);
      } catch(error) {
        let message = (error.message ? error.message : error);
        console.log("RUNNER: ERROR", error);
        return q.reject(`Unable to process request: ${message}`);
      }
    }
  }
}
module.exports = Component;
