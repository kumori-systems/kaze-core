import { startupCheck, getJSON } from './utils';
// import { runTemplate } from './templates';
import { runTemplate } from './template-managers/yo';

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
  private workspacePath: string;

  constructor(workspacePath?: string) {
    this.workspacePath = (workspacePath ? workspacePath : '.');
    this.rootPath = `${this.workspacePath}/resources`;
  }

  public getRootPath(): string{
    return this.rootPath;
  }

  public async add(template: string, config: ResourceConfig): Promise<string> {
      startupCheck();
      let dstdir = `${this.rootPath}/${config.domain}/${config.name}`;
      await runTemplate(template, dstdir, config)
      return `Resource "${config.name}" added in ${dstdir}`
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
    if (!manifest || !manifest.name) {
      throw new Error('Wrong resource manifest format: name missing')
    }
    return manifest.name
  }
}