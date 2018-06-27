import * as path from 'path';
import * as utils from './utils';
import { bundleCommand } from './bundle';
import * as fs from 'fs';
import { Stamp } from './stamp';

export async function registerCommand(paths: string[], stamp: string, stampStub: Stamp): Promise<any> {
  let response = {
    successful: [],
    errors: [],
    deployments: []
  }
  console.log(`Target stamp: ${stamp}`);
  console.log('Paths', paths);
  for (let _path of paths) {
    console.log(`Registering ${_path}, it may take a while...`)
    try {
      // _path is pointing to directory, bundle then register
      let bundlePath: string = undefined;
      if (!fs.existsSync(_path)) {
        console.warn(`${_path} does not exist. Skipping.`);
      } else if (path.extname(_path) === '') {
        console.info(`${_path} does exist.`);
        bundlePath = await bundleCommand([_path]);
      } else if (path.extname(_path) === '.zip') {
        console.info(`${_path} is a zip file.`);
        bundlePath = _path;
      } else {
        console.warn(`${_path} is pointing to neither a directory nor zip. Skipping.`);
      }

      if (bundlePath) {
        // let result = await utils.stampPost(bundlePath, stamp, 'register');
        let result = await stampStub.register(stamp, bundlePath);
        if (result) {
          if (result.successful) {
            response.successful = response.successful.concat(result.successful);
          }
          if (result.errors && result.errors.length > 0) {
            response.errors = response.errors.concat(result.errors);
            for (let e of result.errors) {
              let index = e.indexOf(":");
              let mes = e.substring(index+1);
              console.log(`Error: ${mes}`);
            }
          }
          if (result.deployments) {
            if (result.deployments.successful) {
              // response.successful = response.successful.concat(result.data.deployments.successful);
              for (let dep of result.deployments.successful) {
                let depResult = {
                  name: dep.urn,
                  entrypoints: []
                }
                console.log(`New deployment URN: ${dep.urn}`);
                if (dep.roles) {
                  for (let role in dep.roles) {
                    if (dep.roles[role].entrypoint && dep.roles[role].entrypoint.domain) {
                      let epUrl = dep.roles[role].entrypoint.domain;
                      let entrypoint = {
                        role: role,
                        domain: epUrl
                      }
                      depResult.entrypoints.push(entrypoint);
                      console.log(`New deployment entrypoint: ${role}: ${epUrl}`);
                    }
                  }
                }
                response.deployments.push(depResult);
              }
            }
            if (result.deployments.errors && result.deployments.errors.length > 0) {
              response.errors = response.errors.concat(result.deployments.errors);
              for (let e of result.deployments.errors) {
                let index = e.indexOf(":");
                let mes = e.substring(index+1);
                console.log(`Error: ${mes}`);
              }
            }
          }
        }
      }
    } catch (e) {
      // console.log("ERROR", e);
      return Promise.reject(e);
    }
  }
  // console.log("Response", response);
  return Promise.resolve(response);
}
