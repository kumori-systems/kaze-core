import { Component, ComponentConfig } from './component';
import { Deployment, DeploymentConfig } from './deployment';
import { Service, ServiceConfig } from './service';
import { Resource } from './resource'
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
import * as tshirt from './tshirt-patch';

let localStamp = new LocalStamp();

export class Workspace {

  public component: Component;
  public deployment: Deployment;
  public localStamp: LocalStamp;
  public runtime: Runtime;
  public service: Service;
  public stamp: Stamp;
  public resource: Resource;

  constructor (component: Component, deployment: Deployment, localStamp: LocalStamp, runtime: Runtime, service: Service, resource: Resource, stamp: Stamp) {
    this.component = component;
    this.deployment = deployment;
    this.localStamp = localStamp;
    this.runtime = runtime;
    this.service = service;
    this.stamp = stamp;
    this.resource = resource;
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
  public deployWithDependencies(name: string, stamp: string, addRandomInbounds?: boolean): Promise<any> {
    try {
      let config = readConfigFile();
      stamp = ( stamp ? stamp : config['working-stamp'] );
      if (!stamp) {
        return Promise.reject(new Error('Stamp not specified and default stamp not found.'));
      }
      let toBeBundled: string [] = [];
      let blobs:{pathInZip: string, data: Buffer}[] = []
      let deployUuid : string;
      let manifest = this.deployment.getManifest(name);
      if (addRandomInbounds) {
        manifest.name = uuid().replace("_", "-");
      }
      blobs.push({
        pathInZip: `deployments/${name}/Manifest.json`,
        data: new Buffer(JSON.stringify(manifest, null, 2))
      })
      return this.stamp.isRegistered(stamp, manifest.servicename)
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
        return Promise.all(promises);
      })
      .then(() => {
        if (addRandomInbounds) {
          let serviceConfig = this.deployment.getService(name)
          let serviceManifest = this.service.getManifest(serviceConfig)
          if (serviceManifest.channels && serviceManifest.channels.provides && serviceManifest.channels.provides.length > 0) {
            let serviceName = serviceManifest.name
            for (let i in serviceManifest.channels.provides) {
              let inboundName = `inbound-deployment-${i}`
              let channel = serviceManifest.channels.provides[i]
              let inboundManifest = tshirt.createInboundManifest(inboundName)
              let linkManifest = tshirt.createLinkManifest(manifest.name, channel.name, inboundName, "frontend")
              let tshirtPath = `tshirt/${channel.name}`
              let inboundBlob = {
                pathInZip: `${tshirtPath}/inbound/Manifest.json`,
                data: new Buffer(JSON.stringify(inboundManifest, null, 2))
              }
              let linkBlob = {
                pathInZip: `${tshirtPath}/link/Manifest.json`,
                data: new Buffer(JSON.stringify(linkManifest, null, 2))
              }
              blobs.push(inboundBlob)
              blobs.push(linkBlob)
            }
          }
        }
        let targetFile = path.join('.', 'builts', `${name}_${Date.now().toString()}.zip`);
        return createBundleFile(targetFile, toBeBundled, blobs);
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

  public init(configFileName?: string): Promise<boolean> {
    return initCommand(configFileName);
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