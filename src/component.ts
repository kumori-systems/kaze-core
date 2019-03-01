import { Parameter, processParameters, getJSON, startupCheck, executeProgram } from './utils';
import * as fs from 'fs';
import { runTemplate } from './template-managers/yo';
import { Runtime } from './runtime'

export interface ComponentConfig {
  domain: string;
  name: string;
  version?: string;
}

export class Component {

  private rootPath: string;
  private workspacePath: string;

  constructor(workspacePath?: string) {
    this.workspacePath = (workspacePath ? workspacePath : '.');
    this.rootPath = `${this.workspacePath}/components`;
  }

  public async add(template: string, config: ComponentConfig): Promise<string> {
    startupCheck();
    let dstdir = `${this.rootPath}/${config.domain}/${config.name}`;
    await runTemplate(template, dstdir, config)
    return dstdir
  }

  public install(config: ComponentConfig, rootPath?: string): Promise<string> {
    rootPath = rootPath || this.rootPath
    let componentRootPath = `${this.rootPath}/${config.domain}/${config.name}`;
    return executeProgram('npm', ['run', 'devinit'], {cwd: componentRootPath})
    .then(() => {
      return `Component ${config.name} installed`;
    })
  }

  public async installRuntime(config: ComponentConfig): Promise<void> {
    let runtimeUrn = this._getComponentRuntime(config)
    let devRuntime = this._getComponentDevRuntime(config)
    let runtime = new Runtime(this.rootPath)
    if (!runtimeUrn) {
        throw new Error(`Runtime not found for component "${config.name} and domain "${config.domain}"`)
    }
    try {
        if (devRuntime) {
            try {
                console.log(`\n\n\n----->INSTALLING DEV RUNTIME ${devRuntime}\n\n\n`)
                await runtime.install(devRuntime)
            } catch(error) {
                // await workspace.runtime.install(runtimeUrn)
            }
        }
        console.log(`\n\n\n----->INSTALLING RUNTIME ${runtimeUrn}\n\n\n`)
        await runtime.install(runtimeUrn)
    } catch(error) {
        throw new Error(`Cannot install runtime image for component "${name}"`)
    }
  }

  public async build(config: ComponentConfig): Promise<string> {
    let componentRootPath = `${this.rootPath}/${config.domain}/${config.name}`;
    await this.installRuntime(config)
    await this.install(config, componentRootPath)
    await executeProgram('npm', ['run', 'dist'], {cwd: componentRootPath})
    await executeProgram('npm', ['run', 'superclean'], {cwd: componentRootPath})
    return `${componentRootPath}/dist/bundle.zip`;
  }

  public getParameters(config: ComponentConfig): Parameter[] {
    let manifest:any = this.getManifest(config);
    let parameters:Parameter[] = [];
    if (manifest.configuration && manifest.configuration.parameters && (manifest.configuration.parameters.length > 0)) {
      parameters = processParameters(manifest.configuration.parameters);
    }
    return parameters;
  }

  public getManifest(config: ComponentConfig): any {
    let manifestPath = `${this.rootPath}/${config.domain}/${config.name}/Manifest.json`;
    return getJSON(manifestPath);
  }

  public parseName(urn: string): ComponentConfig {
    let parts = urn.split('/');
    let domain = parts[2];
    let name = parts[4];
    let version = parts[5];
    let config:ComponentConfig = {
      name: name,
      domain: domain,
      version: version
    }
    return config;
  }

  // Returns the distributable file for a component.
  //
  // Parameters:
  // * `config`: a ComponentConfig with the service name and domain.
  //
  // Returns: a promise resolved with the path to the distributable file.
  public getDistributableFile(config: ComponentConfig): Promise<string> {
    return this.checkVersion(config)
    .then((result) => {
      if (result) {
        return new Promise<string>((resolve, reject) => {
          try {
            let bundlePath = `${this.rootPath}/${config.domain}/${config.name}/dist/bundle.zip`;
            fs.access(bundlePath, fs.constants.R_OK, (error) => {
              if (error) {
                let message = '';
                if (error && (error.code === 'ENOENT')) {
                  message = `Distributable file not found for component "${config.domain}/${config.name}"`;
                } else {
                  message = error.message;
                }
                reject(new Error(`Error registering component ${config.domain}/${config.name}: ${message}`));
              } else {
                resolve(bundlePath);
              }
            });
          } catch(error) {
            reject(new Error(`Error registering component ${config.domain}/${config.name}: ${error.message}`));
          }
        });
      } else {
        return Promise.reject(new Error(`Version "${config.version}" of component "${config.domain}/${config.name}" not found in the workspace`));
      }
    })

  }

  // public checkVersion(config: ComponentConfig): Promise<boolean> {
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

  public checkVersion(config: ComponentConfig): Promise<boolean> {
    try {
      return this.getCurrentVersion(config)
      .then((currentVersion) => {
        return Promise.resolve((currentVersion === config.version))
      })
    } catch(error) {
      return Promise.reject(error)
    }
  }

  public getCurrentVersion(config: ComponentConfig): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        let bundlePath = `${this.rootPath}/${config.domain}/${config.name}/Manifest.json`
        fs.access(bundlePath, fs.constants.R_OK, (error) => {
          try {
            if (error) {
              reject(error);
            } else {
              let manifest = getJSON(bundlePath)
              if (!manifest.name) {
                reject(new Error('Wrong component manifest format: name missing'))
              } else {
                let wsConfig = this.parseName(manifest.name)
                resolve(wsConfig.version)
              }
            }
          } catch(error) {
            reject(error)
          }
        });
      } catch(error) {
        reject(error)
      }
    })
  }

  public generateUrn(name: string, domain: string, version: string) {
    return `eslap://${domain}/components/${name}/${version}`
  }

  private _getComponentRuntime (config: ComponentConfig): string {
    let manifest = this.getManifest(config)
    return manifest.runtime
  }

  private _getComponentDevRuntime (config): string {
      let runtimeUrn = this._getComponentRuntime(config)
      let last = runtimeUrn.lastIndexOf('/')
      if (last != -1) {
          let devManifest = runtimeUrn.substring(0, last+1)
          devManifest += 'dev/'
          devManifest += runtimeUrn.substring(last+1)
          return devManifest
      } else {
          throw new Error('Wrong ruintime URN format')
      }
  }
}