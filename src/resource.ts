import { processParameters, Parameter, ParameterType, ResourceData, processResources, createElementFromTemplate, createPath, startupCheck, getJSON } from './utils';
import * as path from 'path';
import { Component } from './component';
import { access, constants} from 'fs';
import { v4 as uuid } from 'uuid';
import * as child_process from 'child_process';

export interface ResourceConfig {
  domain: string;
  name: string;
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

export class Resource {

  private rootPath: string;
  private templatesPath: string;
  private workspacePath: string;

  constructor(workspacePath?: string, templatesPath?: string) {
    this.workspacePath = (workspacePath ? workspacePath : '.');
    this.rootPath = `${this.workspacePath}/resources`;
    this.templatesPath = (templatesPath ? templatesPath : path.join(`${process.cwd()}`,'templates','resource'));
  }

  public getRootPath(): string{
    return this.rootPath;
  }

  public add(template: string, config: ResourceConfig): Promise<string> {
    return new Promise( (resolve, reject) => {
      try {
        startupCheck();
        let dstdir = `${this.rootPath}/${config.domain}/${config.name}`;
        let srcdir = path.join(this.templatesPath, template);
        createElementFromTemplate(srcdir, dstdir, config)
        .then(() => {resolve(`Service "${config.name}" added in ${dstdir}`)})
        .catch((error) => {reject(error)});
      } catch(error) {
        reject(error);
      }
    });
  }

  public getManifest(config: ResourceConfig): any {
    let manifestPath = `${this.rootPath}/${config.domain}/${config.name}/Manifest.json`;
    return getJSON(manifestPath);
  }

  public parseName(urn: string): ResourceConfig {
    let parts = urn.split('/');
    let domain = parts[2];
    let name = parts[4];
    let config:ResourceConfig = {
      name: name,
      domain: domain
    }
    return config;
  }

  // Returns the distributable file for a service.
  // TODO: this should create a bundle.
  //
  // Parameters:
  // * `config`: a ServiceConfig with the service name and domain.
  //
  // Returns: a promise resolved with the path to the distributable file.
  public getDistributableFile(config: ResourceConfig): Promise<string> {
    return Promise.resolve(`${this.rootPath}/${config.domain}/${config.name}/Manifest.json`);
  }

  public generateUrn(name: string, domain: string) {
    let manifest = this.getManifest({name: name, domain: domain})
    return manifest.name
  }
}