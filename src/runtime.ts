import { parseEcloudURN, createPath, startupCheck, createElementFromTemplate } from './utils';
import * as runtime from '@kumori/runtime';
import * as path from 'path';
// import { runTemplate } from './templates';
import { runTemplate } from './template-managers/yo';

export interface RuntimeConfig {
  name: string,
  domain: string,
  parent?: string,
  componentFolder?: string,
  entrypoint?: string
}

interface bundleFunction {
  (runtimeFolder: string, manifestPath: string, targetFile: string): Promise<void>;
}

interface installFunction {
  (urn: string): Promise<any>;
}

export interface RuntimeStub {
  bundle: bundleFunction;
  install: installFunction;
}

export class Runtime {

  private rootPath: string;
  private workspacePath: string;
  private runtimeStub: RuntimeStub;

  constructor(workspacePath: string = '.', runtimeStub: RuntimeStub = runtime) {
    this.workspacePath = workspacePath;
    this.rootPath = `${this.workspacePath}/runtimes`;
    this.runtimeStub = runtimeStub;
  }

  public async add(template: string, config: RuntimeConfig): Promise<string> {
    startupCheck();
    // let parts = parseEcloudURN(config.name);
    let dstdir = `${this.rootPath}/${config.domain}/${config.name}`;
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
    await runTemplate(template, dstdir, dockerConfig)
    return `Runtime ${config.name} added in ${dstdir}`
  }

  public async build(config: RuntimeConfig): Promise<void> {
    let runtimeFolder = `${this.rootPath}/${config.domain}/${config.name}`; // TODO
    let manifestPath = `${runtimeFolder}/Manifest.json`;
    let targetFile = `${runtimeFolder}/dist/bundle.zip`;
    return await this.runtimeStub.bundle(runtimeFolder, manifestPath, targetFile);
  }

  public generateUrn(name: string, domain: string, version: string) {
    return `eslap://${domain}/runtime/${name}/${version}`
  }

  public async install(urn: string): Promise<any> {
    return await this.runtimeStub.install(urn)
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