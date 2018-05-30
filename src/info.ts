import * as utils from './utils';
import * as request from 'request';

export async function infoCommand(requestedInfo: string, stamp: string): Promise<any> {
  // Supported information retrieval
  let response = {
    successful: [],
    errors: [],
    deployments: []
  }
  if (requestedInfo == null) {
    return Promise.reject({
      err: 'Undefined information retrieval option',
      showHelp: 'info'
    })
  } else if (!requestedInfo.match(/(deployments|registries)/)) {
    return Promise.reject({
      err: `Unsupported information retrieval option "${requestedInfo}"`,
      showHelp: 'info'
    })
  }
  try {
    // console.log(`${stamp}/admission/${requestedInfo}`)
    let raw = await utils.httpGet({uri: `${stamp}/admission/${requestedInfo}`});    
    let result = JSON.parse(raw.body);
    if (result && result.data) {
      if (result.success) {
        console.log("Deployments information retrieval succeed");
      } else {
        console.log("Deployments information retrieval failed");
      }
      for (let depName in result.data) {
        if (result.data[depName] == null) {
          response.errors.push(`Deployment ${depName} not found`);
        } else {
          let depResult = utils.processDeploymentsInfo(result.data[depName]);
          response.deployments.push(depResult);
        }
      }
    }
    console.log("");
    return Promise.resolve(true);
  } catch(e) {
    return Promise.reject({
      err: `Couldn't retrieve ${requestedInfo} informations from ${stamp}`,
      additionalInfo: e
    });
  }
}