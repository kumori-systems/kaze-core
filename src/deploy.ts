import * as path from 'path';
import * as utils from './utils'
import { bundleCommand } from './bundle';
import * as fs from 'fs';

export async function deployCommand(paths: string[], stamp: string): Promise<any> {
  let response = {
    successful: [],
    errors: [],
    deployments: []
  }
  console.log(`Target stamp: ${stamp}`); 
  for (let _path of paths) {
    console.log(`Deploying ${_path}, it may take a while...`)
    try {
      // _path is pointing to directory, bundle then register
      let bundlePath: string = undefined;
      if (!fs.existsSync(_path)) {
        console.warn(`${_path} does not exist. Skipping.`);
      } else if (path.extname(_path) === '') {
        bundlePath = await bundleCommand([_path]);
      } else if (path.extname(_path) === '.json') {
        bundlePath = await bundleCommand([_path]);
      } else if (path.extname(_path) === '.zip') {
        bundlePath = _path;
      } else {
        console.warn(`${_path} is pointing to neither a directory nor zip. Skipping.`);
      }

      if (bundlePath) {  
        let result = await utils.stampPost(bundlePath, stamp, 'deploy');
        if (result && result.data) {
          if (result.success) {
            console.log(`${_path} registered`);
          } else {
            console.log(`${_path} registration failed`);
          }
          if (result.data.successful) {
            response.successful = response.successful.concat(result.data.successful);
          }
          if (result.data.errors && result.data.errors.length > 0) {
            response.errors = response.errors.concat(result.data.errors);
            for (let e of result.data.errors) {
              let index = e.indexOf(":");
              let mes = e.substring(index+1);
              console.log(`Error: ${mes}`);
            }
          }
          if (result.data.deployments) {
            if (result.data.deployments.successful) {
              // response.successful = response.successful.concat(result.data.deployments.successful);
              for (let dep of result.data.deployments.successful) {
                let depResult = utils.processDeploymentsInfo(dep);
                response.deployments.push(depResult);
              }
            }
            if (result.data.deployments.errors && result.data.deployments.errors.length > 0) {
              response.errors = response.errors.concat(result.data.deployments.errors);
              for (let e of result.data.deployments.errors) {
                let mes = (e.message) ? e.message : e;
                console.log(`Error: ${mes}`);
              }
            }
          }
        }
      }
    } catch (e) {
      return Promise.reject(e);
    }
    console.log("");
    // console.log("Response", JSON.stringify(response));
    return Promise.resolve(response);
  }
}

//export async function deployCommand(paths: string[], stamp: string): Promise<any> {
//  let successDeployment = 0;
//  for (let _path of paths) {
//    try {
//      if (!fs.existsSync(_path)) {
//        console.warn(`${_path} does not exist.`);
//      } else if (path.extname(_path) === '.json' || path.extname(_path) === '') {
//        let outputZipPath = await bundleCommand([_path]);
//        await utils.stampPost(outputZipPath, stamp, 'deploy');
//        successDeployment++;
//      } else if (path.extname(_path) === '.zip') {
//        let result = await utils.stampPost(_path, stamp, 'deploy');
//        console.log("RESULT: ", result);
//        successDeployment++;
//      } else {
//        console.warn(`${_path} is pointing neither to a directory, manifest json nor zip, skipping.`);
//      }
//    } catch (e) {
//      return Promise.reject(e);
//    }
//  }
//  return Promise.resolve(successDeployment);
//}
