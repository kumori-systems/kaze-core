import { Component, ComponentConfig } from './component';
import { Deployment, DeploymentConfig } from './deployment';
import { Service, ServiceConfig } from './service';
import { bundleCommand } from './bundle';
import { deployCommand } from './deploy';
import { infoCommand } from './info';
import { initCommand } from './initialize';
import { LocalStamp} from './localstamp';
import { registerCommand } from './register';
import { Runtime } from './runtime';
import { Stamp } from './stamp'
import { undeployCommand } from './undeploy';
import { readConfigFile, checkStamp, StampStatus, getStampUrl, startupCheck, getStampStatus, createBundleFile, createPath } from './utils';
import * as path from 'path';
import * as child_process from 'child_process';
import { v4 as uuid } from 'uuid';

let localStamp = new LocalStamp();

export class Workspace {

  public component: Component;
  public deployment: Deployment;
  public localStamp: LocalStamp;
  public runtime: Runtime;
  public service: Service;
  public stamp: Stamp;

  constructor (component: Component, deployment: Deployment, localStamp: LocalStamp, runtime: Runtime, service: Service, stamp: Stamp) {
    this.component = component;
    this.deployment = deployment;
    this.localStamp = localStamp;
    this.runtime = runtime;
    this.service = service;
    this.stamp = stamp;
  }

  public bundle(paths: string[]): Promise<any> {
    return bundleCommand(paths);
  }

  public deploy(paths: string[], stamp: string): Promise<any> {
    return deployCommand(paths, stamp);
  }

  // Registers a deployment manifest in a target stamp. If any of the
  // deployment manifest dependencies are not registered in the target stamp
  // and are available in the workspace, they are bundled to and registered.
  public deployWithDependencies(name: string, stamp?: string, inboundsDomain?: string): Promise<any> {
    try {
      let config = readConfigFile();
      stamp = ( stamp ? stamp : config['working-stamp'] );
      if (!stamp) {
        return Promise.reject(new Error('Stamp not specified and default stamp not found.'));
      }
      let toBeBundled: string [] = [];
      let deployUuid : string;      
      let manifest = this.deployment.getManifest(name);
      if(inboundsDomain){
        manifest.name = uuid().replace("_", "-");
        manifest.interconnection = true;
        this.deployment.updateManifest(name, manifest);
      }
      return this.deployment.getDistributableFile(name)
      .then((filepath) => {
        toBeBundled.push(filepath);
        return this.stamp.isRegistered(stamp, manifest.servicename)
      })
      .then((registered):Promise<ServiceConfig> => {
        let serviceConfig = this.deployment.getService(name);
        if (!registered) {
          return this.service.getDistributableFile(serviceConfig)
          .then((filepath) => {
            toBeBundled.push(filepath);
            return Promise.resolve(serviceConfig);
          })
        } else {
          return Promise.resolve(serviceConfig);
        }
      })
      .then((serviceConfig) => {
        let components = this.service.getComponents(serviceConfig);
        let promises:Promise<any>[] = [];
        // Components
        for (let name of components) {
          ((name) => {
            promises.push(this.stamp.isRegistered(stamp, name)
            .then((registered) => {
              if (!registered) {
                let componentConfig = this.component.parseName(name);
                return this.component.getDistributableFile(componentConfig)
                .then((filepath) => {
                  toBeBundled.push(filepath);
                  return Promise.resolve();
                })
              } else {
                return Promise.resolve();
              }
            }));
          })(name);
        }
        // Inbounds
        if(inboundsDomain !== undefined){          
          let serviceBuildPath = `${this.service.getRootPath()}/${serviceConfig.domain}/${serviceConfig.name}/build`;
          child_process.execSync(`rm -rf ${serviceBuildPath}`);
          createPath(serviceBuildPath);
          let inboundPromises:Promise<any>[] = [];
          let channels = this.service.getProvidedChannels(serviceConfig);
          for (let channel of channels) {
            inboundPromises.push(
              this.service.generateGenericInbound(serviceConfig, channel, inboundsDomain, manifest.name)              
            )
          }
          promises.push(            
            Promise.all(inboundPromises)
            .then(() => {
              toBeBundled.push(serviceBuildPath);
              return Promise.resolve();              
            })
          );
        }
        return Promise.all(promises);
      })
      .then(() => {
        let targetFile = path.join('.', 'builts', `${name}_${Date.now().toString()}.zip`);
        return createBundleFile(targetFile, toBeBundled);
      })
      .then((zipfileath) => {
        return this.stamp.register(stamp, zipfileath);
      })
      // return Promise.reject(new Error('Not implemented'));
    } catch(error) {
      return Promise.reject(error);
    }
  }

  public info(requestedInfo: string, stamp: string): Promise<any> {
    return infoCommand(requestedInfo, stamp);
  }

  public init(): Promise<boolean> {
    return initCommand();
  }

  public register(paths: string[], stamp: string): Promise<any> {
    return registerCommand(paths, stamp);
  }

  public undeploy(uris: string[], stamp: string): Promise<any> {
    return undeployCommand(uris, stamp);
  }

  public readConfigFile() {
    return readConfigFile();
  }

  public checkStamp(stamp: string, exitOnFail: boolean = true): Promise<StampStatus> {
    return checkStamp(stamp, exitOnFail);
  }

  public async getStampStatus(path: string): Promise<StampStatus> {
    return getStampStatus(path);
  }

  public startupCheck() {
    return startupCheck();
  }

  public getStampUrl(stamp: string) {
    return getStampUrl(stamp);
  }

}