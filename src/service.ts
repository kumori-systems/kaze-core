import { processParameters, Parameter, ParameterType, ResourceData, processResources, createElementFromTemplate, createPath, startupCheck, getJSON } from './utils';
import * as path from 'path';
import { Component } from './component';
import { access, constants} from 'fs';
import { v4 as uuid } from 'uuid';
import * as child_process from 'child_process';

export interface ServiceConfig {
  domain: string;
  name: string;
  version?: string;
}

export interface Role {
  name: string;
  component: string;
}

export interface Channel {
  name: string;
  type: string;
  protocol: string;
}

export class Service {

  private rootPath: string;
  private templatesPath: string;
  private workspacePath: string;

  constructor(workspacePath?: string, templatesPath?: string) {
    this.workspacePath = (workspacePath ? workspacePath : '.');
    this.rootPath = `${this.workspacePath}/services`;
    this.templatesPath = (templatesPath ? templatesPath : path.join(`${process.cwd()}`,'templates','service'));
  }

  public getRootPath(): string{
    return this.rootPath;
  }

  public add(template: string, config: ServiceConfig): Promise<string> {
    return new Promise( (resolve, reject) => {
      try {
        startupCheck();
        let dstdir = `${this.rootPath}/${config.domain}/${config.name}`;
        if (!createPath(dstdir)) {
          reject(`Service ${config.name} not added because already exists in the workspace`);
        } else {
          let srcdir = path.join(this.templatesPath, template);
          createElementFromTemplate(srcdir, dstdir, config)
          .then(() => {resolve(`Service "${config.name}" added in ${dstdir}`)})
          .catch((error) => {reject(error)});
        }
      } catch(error) {
        reject(error);
      }
    });
  }

  public getRoles(config: ServiceConfig): Role[] {
    let manifest:any = this.getManifest(config);
    let roles:Role[] = [];
    for (let role of manifest.roles) {
      roles.push({name: role.name, component: role.component});
    }
    return roles;
  }

  public getProvidedChannels(config: ServiceConfig): Channel[] {
    let manifest:any = this.getManifest(config);
    let channels:Channel[] = [];
    for (let channel of manifest.channels.provides) {
      channels.push({name: channel.name, type: channel.type, protocol: channel.protocol});
    }
    return channels;
  }

  public getRequiredChannels(config: ServiceConfig): Channel[] {
    let manifest:any = this.getManifest(config);
    let channels:Channel[] = [];
    for (let channel of manifest.channels.requires) {
      channels.push({name: channel.name, type: channel.type, protocol: channel.protocol});
    }
    return channels;
  }

  public getParameters(config: ServiceConfig): Parameter[] {
    let manifest = this.getManifest(config)
    let parameters:Parameter[] = [];
    if (manifest.configuration && manifest.configuration.parameters && (manifest.configuration.parameters.length > 0)) {
      parameters = processParameters(manifest.configuration.parameters);
    }
    return parameters;
  }

  public getResources(config: ServiceConfig): ResourceData[] {
    let manifest = this.getManifest(config)
    let resources:ResourceData[] = [];
    if (manifest.configuration && manifest.configuration.resources && (manifest.configuration.resources.length > 0)) {
      resources = processResources(manifest.configuration.resources);
    }
    return resources;
  }

  public getManifest(config: ServiceConfig): any {
    let manifestPath = `${this.rootPath}/${config.domain}/${config.name}/Manifest.json`;
    return getJSON(manifestPath);
  }

  public parseName(urn: string): ServiceConfig {
    let parts = urn.split('/');
    let domain = parts[2];
    let name = parts[4];
    let version = parts[5];
    let config:ServiceConfig = {
      name: name,
      domain: domain,
      version: version
    }
    return config;
  }

  public getComponents(config: ServiceConfig) {
    let dependencies: string[] = [];
    let component = new Component(this.workspacePath, this.templatesPath);
    let roles = this.getRoles(config);
    for (let role of roles) {
      dependencies.push(role.component);
    }
    return dependencies;
  }

  // Returns the distributable file for a service.
  // TODO: this should create a bundle.
  //
  // Parameters:
  // * `config`: a ServiceConfig with the service name and domain.
  //
  // Returns: a promise resolved with the path to the distributable file.
  public getDistributableFile(config: ServiceConfig): Promise<string> {
    return this.checkVersion(config)
    .then((result) => {
      if (result) {
        return Promise.resolve(`${this.rootPath}/${config.domain}/${config.name}/Manifest.json`);
      } else {
        return Promise.reject(new Error(`Version "${config.version}" of service "${config.domain}/${config.name}" not found in the workspace`));
      }
    })
  }

  // public checkVersion(config: ServiceConfig): Promise<boolean> {
  //   return new Promise((resolve, reject) => {
  //     try {
  //       let bundlePath = `${this.rootPath}/${config.domain}/${config.name}/Manifest.json`;
  //       access(bundlePath, constants.R_OK, (error) => {
  //         if (error) {
  //           reject(error);
  //         } else {
  //           if (config.version) {
  //             let manifest = getJSON(bundlePath);
  //             let wsConfig = this.parseName(manifest.name);
  //             if (config.version === wsConfig.version) {
  //               resolve(true);
  //             } else {
  //               resolve(false);
  //             }
  //           } else {
  //             resolve(true);
  //           }
  //         }
  //       });
  //     } catch(error) {
  //       reject(error);
  //     }
  //   })
  // }

  public checkVersion(config: ServiceConfig): Promise<boolean> {
    try {
      return this.getCurrentVersion(config)
      .then((currentVersion) => {
        return Promise.resolve((currentVersion === config.version));
      })
    } catch(error) {
      return Promise.reject(error);
    }
  }

  public getCurrentVersion(config: ServiceConfig): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        let bundlePath = `${this.rootPath}/${config.domain}/${config.name}/Manifest.json`;
        access(bundlePath, constants.R_OK, (error) => {
          if (error) {
            reject(error);
          } else {
            let manifest = getJSON(bundlePath);
            let wsConfig = this.parseName(manifest.name);
            resolve(wsConfig.version);
          }
        });
      } catch(error) {
        reject(error);
      }
    })
  }

  public generateUrn(name: string, domain: string, version: string) {
    return `eslap://${domain}/services/${name}/${version}`
  }
}