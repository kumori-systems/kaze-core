import * as utils from './utils';
import * as querystring from 'querystring';

export async function undeployCommand(uris: string[], stamp: string): Promise<any> {
  let response = {
    successful: [],
    errors: []
  }
  for (let uri of uris) {
    try {
      let workspaceConfig = utils.readConfigFile();
      let stampConfig:utils.StampConfig = workspaceConfig.stamps[stamp]
      if (!stampConfig) {
        return Promise.reject({
          err: `Stamp ${stamp} not found`
        })
      }
      let escUri = querystring.escape(uri);
      console.log(`Undeploying: ${uri}`);
      let resp = await utils.httpDel({ uri: `${stampConfig.admission}/admission/deployments?urn=${escUri}` });
      let unparsed = JSON.parse(resp.body)
      if (unparsed.success) {
        console.log(`Success: ${unparsed.message}`)
        response.successful.push(`${uri}:${unparsed.message}`)
      } else {
        console.log(`Failure: ${unparsed.message}`)
        response.errors.push(`${uri}:${unparsed.message}`)
      }
      return Promise.resolve(response);
    } catch (e) {
      return Promise.reject({
        err: `Failed undeploying ${uri} of ${stamp}`,
        additionalInfo: e
      });
    }
  }
}