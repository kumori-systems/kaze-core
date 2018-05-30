import * as dot from 'dot';
import * as fs from 'fs';
import { parseEcloudURN, createPath, startupCheck, ECloudNameParts, createElementFromTemplate, deleteFolder } from './utils';
import * as runtime from 'runtime';
import * as path from 'path';

export interface RuntimeConfig {
  name: string,
  domain: string,
  parent?: string,
  componentFolder?: string,
  entrypoint?: string
}

export class Runtime {

  private rootPath: string;
  private templatesPath: string;
  private workspacePath: string;

  constructor(workspacePath?: string, templatesPath?: string) {
    this.workspacePath = (workspacePath ? workspacePath : '.');
    this.rootPath = `${this.workspacePath}/runtimes`;
    this.templatesPath = (templatesPath ? templatesPath : path.join(`${process.cwd()}`,'templates','runtime'));    
  }

  public add(template: string, config: RuntimeConfig): Promise<string> {
    return new Promise( (resolve, reject) => {
      try {
        startupCheck();
        // let parts = parseEcloudURN(config.name);
        let dstdir = `${this.rootPath}/${config.domain}/${config.name}`;
        if (!createPath(dstdir)) {
          reject(`Runtime ${config.name} not added because already exists in the workspace`);
        } else {
          let srcdir = path.join(this.templatesPath, template);
          let dockerConfig = {
            from: ''
          };
          for (let elem in config) {
            dockerConfig[elem] = config[elem];
          }
          if (config.parent) {
            let parts = parseEcloudURN(config.parent);
            dockerConfig.from = `${parts.domain}/runtime/${parts.path}:${parts.version}`
          }
          createElementFromTemplate(srcdir, dstdir, dockerConfig)
          .then(() => {resolve(`Runtime ${config.name} added in ${dstdir}`)})
          .catch((error) => { reject(error) });
        }
      } catch(error) {
        reject(error);
      }
    });
  }

  public build(config: RuntimeConfig) {
    let runtimeFolder = `${this.rootPath}/${config.domain}/${config.name}`; // TODO
    let manifestPath = `${runtimeFolder}/Manifest.json`;
    let targetFile = `${runtimeFolder}/dist/bundle.zip`;
    runtime.bundle(runtimeFolder, manifestPath, targetFile);
  }

}

export function addCommand(template: string, config: RuntimeConfig): Promise<string> {
  return new Promise( (resolve, reject) => {
    try {
      startupCheck();
      // let parts = parseEcloudURN(config.name);
      let dir = `./runtimes/${config.domain}/${config.name}`;
      if (!createPath(dir)) {
        reject(`Runtime ${config.name} not added because already exists in the workspace`);
      } else {
        let sourceDir = path.join(__dirname, '../../template/runtime', template);
        let dockerConfig = {
          from: ''
        };
        for (let elem in config) {
          dockerConfig[elem] = config[elem];
        }
        if (config.parent) {
          let parts = parseEcloudURN(config.parent);
          dockerConfig.from = `${parts.domain}/runtime/${parts.path}:${parts.version}`
        }
        createElementFromTemplate(sourceDir, dir, dockerConfig)
        .then(() => {resolve(`Runtime ${config.name} added in ${dir}`)})
        .catch((error) => { reject(error) });
      }
    } catch(error) {
      reject(error);
    }
  });
}

export function buildCommand(config: RuntimeConfig) {
  let runtimeFolder = `./runtimes/${config.domain}/${config.name}`; // TODO
  let manifestPath = `${runtimeFolder}/Manifest.json`;
  let targetFile = `${runtimeFolder}/dist/bundle.zip`;
  runtime.bundle(runtimeFolder, manifestPath, targetFile);
}