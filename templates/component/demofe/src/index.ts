import * as ecloud from '@kumori/component';
import * as http from 'http-message';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';

class Component extends ecloud.BaseComponent {

  private httpChannel:ecloud.Reply;
  private work:ecloud.Request;
  
  constructor
    (public runtime: ecloud.Runtime     // TODO: type of RUNTIME instead
    , public role: string         // ID of the role as a string.
    , public iid: string
    , public incnum: number       // An integer, also
    , public localData: string    // TODO: what is this? a Path?
    , public resources: Object   // A dictionary of key/value pairs. TODO: revise this definition
    , public parameters: Object  // Again, an object used as a dictionary
    , public dependencies: ecloud.ChannelHash
    , public offerings: ecloud.ChannelHash
    ) {
      super(runtime, role, iid, incnum, localData, resources, parameters, dependencies, offerings);
      this.httpChannel = offerings.endpoint as ecloud.Reply;
      this.work = dependencies.work as ecloud.Request;
  }

  run (): void {
    super.run();
    let app = express();
    app.use(bodyParser.json() );       // to support JSON-encoded bodies
    app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
      extended: true
    }));
    app.use(express.json());       // to support JSON-encoded bodies
    app.use(express.urlencoded()); // to support URL-encoded bodies
    app.use(cors());
    app.use(express.static(__dirname + '/static'));
    app.route('/run')
    .get((req, res) => {
      this.sendRequest(req, res);
    })
    .post((req, res) =>{
      this.sendRequest(req, res);
    })
    const server = http.createServer(app);
    server.listen(this.httpChannel);
  }

  sendRequest(req:any, res:any): void {
    // let segments:ecloud.Segment[] = [new Buffer('let x = 1; x++;')];
    // let request:ecloud.Message = {
    //   msg: segments
    // }
    let request = [req.body.code];
    this.work.sendRequest(request)
    .then((response) => {
      let parsed = JSON.parse(response[0][1].toString());
      parsed._frontend = this.iid;
      res.send(JSON.stringify(parsed));
    })
    .catch((error) => {
      res.send(error.message);      
    })
  }

}
module.exports = Component;
