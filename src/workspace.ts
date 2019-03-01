import { Component, ComponentConfig } from './component';
import { Deployment } from './deployment';
import { Service, ServiceConfig } from './service';
import { Resource } from './resource'
import { bundleCommand } from './bundle';
import { deployCommand } from './deploy';
import { infoCommand } from './info';
import { initCommand } from './initialize';
import { LocalStamp} from './localstamp';
import { Project } from './project';
import { registerCommand } from './register';
import { Runtime } from './runtime';
import { Stamp } from './stamp'
import { undeployCommand } from './undeploy';
import { readConfigFile, checkStamp, StampStatus, getStampUrl, startupCheck, getStampStatus, createBundleFile } from './utils';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import * as tshirt from './tshirt-patch';
import { RegistrationResult } from './stamp-manager'

export class ExtendedRegistrationResult extends RegistrationResult {
  public skipped?: string[]
}

export class Workspace {

  public component: Component;
  public deployment: Deployment;
  public localStamp: LocalStamp;
  public runtime: Runtime;
  public service: Service;
  public stamp: Stamp;
  public resource: Resource;
  public project: Project;

  constructor (component: Component, deployment: Deployment, localStamp: LocalStamp, runtime: Runtime, service: Service, resource: Resource, project: Project, stamp: Stamp) {
    this.component = component;
    this.deployment = deployment;
    this.localStamp = localStamp;
    this.project = project;
    this.runtime = runtime;
    this.service = service;
    this.stamp = stamp;
    this.resource = resource;
  }

  public bundle(paths: string[]): Promise<any> {
    return bundleCommand(paths);
  }

  public deploy(paths: string[], stamp: string): Promise<any> {
    return deployCommand(paths, stamp, this.stamp);
  }

  /**
   * Creates a bundle with the deployment configuration and any other element needed and not already registered in the stamp (currently this only includes the service manifest and the components).
   *
   * @param name The deployment name in the workspace.
   * @param stamp The stamp where the service instance will be deployed.
   * @param addRandomInbounds If true, inbounds with random domains will be created.
   * @param buildComponents If true, a service component will be built if it is not registered in the target stamp and it has not a distributable file.
   * @param forceBuildComponents If true, a service component will be built if it is not registered in the target stamp, even if already exists a distributable file for this component.
   *
   * @returns A promise resolved with information about the registration process results.
   */
  public deployWithDependencies(
    name: string,
    stamp: string,
    addRandomInbounds: boolean,
    buildComponents: boolean,
    forceBuildComponents: boolean
  ): Promise<RegistrationResult> {
    try {
      let config = readConfigFile();
      let skipped:string[] = []
      stamp = ( stamp ? stamp : config['working-stamp'] );
      if (!stamp) {
        return Promise.reject(new Error('Stamp not specified and default stamp not found.'));
      }
      let toBeBundled: string [] = [];
      let toBeRebuild:ComponentConfig[] = []
      let blobs:{pathInZip: string, data: Buffer}[] = []
      let manifest = this.deployment.getManifest(name);
      if (addRandomInbounds) {
        manifest.name = uuid().replace("_", "-");
      }
      blobs.push({
        pathInZip: `deployments/${name}/Manifest.json`,
        data: new Buffer(JSON.stringify(manifest, null, 2))
      })
      if (!manifest || !manifest.servicename) {
        throw new Error("Wrong deployment manifest. Field \"servicename\" not found")
      }
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
          skipped.push(manifest.servicename)
          return Promise.resolve(serviceConfig);
        }
      })
      .then((serviceConfig) => {
        if (skipped.indexOf(manifest.servicename) != -1) {
          return Promise.resolve([])
        }
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
                  if (forceBuildComponents) {
                    toBeRebuild.push(componentConfig)
                  } else {
                    toBeBundled.push(filepath);
                  }
                  return Promise.resolve();
                })
                .catch((error) => {
                  let rebuild: boolean = (error.message && (error.message.indexOf('Distributable file not') != -1))
                  rebuild = rebuild && (buildComponents || forceBuildComponents)
                  if (rebuild) {
                    toBeRebuild.push(componentConfig)
                    return Promise.resolve();
                  } else {
                    return Promise.reject(error)
                  }
                })
              } else {
                skipped.push(name)
                return Promise.resolve();
              }
            }));
          })(name);
        }
        return Promise.all(promises);
      })
      .then(() => {
        let promise = Promise.resolve('')
        for (let config of toBeRebuild) {
          ((config) => {
            promise = promise.then(() => {
              console.log(`Rebuilding ${config.name}`)
              return this.component.build(config)
              .then(() => {
                return this.component.getDistributableFile(config)
              })
              .then((filepath) => {
                toBeBundled.push(filepath)
                return('')
              })
            })
          })(config);
        }
        return promise
      })
      .then(() => {
        if (addRandomInbounds) {
          let serviceConfig = this.deployment.getService(name)
          let serviceManifest = this.service.getManifest(serviceConfig)
          if (serviceManifest && serviceManifest.channels && serviceManifest.channels.provides && serviceManifest.channels.provides.length > 0) {
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
      .then((result) => {
        let extendedResult:ExtendedRegistrationResult = result
        extendedResult.skipped = skipped
        return extendedResult
      })
      // return Promise.reject(new Error('Not implemented'));
    } catch(error) {
      return Promise.reject(error);
    }
  }

  public info(requestedInfo: string, stamp: string): Promise<any> {
    return infoCommand(requestedInfo, stamp, this.stamp);
  }

  public init(template: string): Promise<boolean> {
    return initCommand(template);
  }

  public register(paths: string[], stamp: string): Promise<any> {
    return registerCommand(paths, stamp, this.stamp);
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