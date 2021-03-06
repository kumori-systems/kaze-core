import * as utils from './utils';
import { Stamp } from './stamp';

async function getDeployments(stamp: string, stampStub: Stamp): Promise<any> {
  let workspaceConfig = utils.readConfigFile();
  let stampConfig:utils.StampConfig = workspaceConfig.stamps && workspaceConfig.stamps[stamp]
  if (!stampConfig) {
    return Promise.reject(new Error(`Stamp ${stamp} not registered in the workspace`));
  }
  let admissionUrl = stampConfig.admission
  let token = stampConfig.token
  let deployments = await stampStub.findDeployments(stamp);
  for (let depName in deployments) {
    let deployment = deployments[depName]

    console.log(`\n-------------------------------------------------------------------------------------`);
    console.log(`Deployment URN:\t\t${deployment.urn}`);
    if (deployment.nickname) {
      console.log(`Deployment nickname:\t\t${deployment.urn}`);
    }
    console.log(`Deployment roles:\t\t${Object.keys(deployment.roles).length}`);
    for (let roleName in deployment.roles) {
      let role = deployment.roles[roleName]
      console.log(`\tRole "${roleName}"`);
      console.log(`\t\tComponent: \t${role.component}`);
      if (role.entrypoint && role.entrypoint.domain) {
        console.log(`\t\tEntrypoint: \t${role.entrypoint.domain}`);
      }
    }
    console.log(`-------------------------------------------------------------------------------------`);
  }
}

export async function infoCommand(requestedInfo: string, stamp: string, stampStub: Stamp): Promise<any> {
  // Supported information retrieval
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
    await getDeployments(stamp, stampStub);
    return Promise.resolve(true);
  } catch(e) {
    return Promise.reject({
      err: `Couldn't retrieve ${requestedInfo} information from ${stamp}`,
      additionalInfo: e
    });
  }
}