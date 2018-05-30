import { Parameter, processParameters, getJSON, createPath, startupCheck, createElementFromTemplate, executeProgram } from './utils';
import * as fs from 'fs';
import * as path from 'path';

export interface ComponentConfig {
  domain: string;
  name: string;
  version?: string;
}

export class Component {

  private rootPath: string;
  private templatesPath: string;
  private workspacePath: string;

  constructor(workspacePath?: string, templatesPath?: string) {
    this.workspacePath = (workspacePath ? workspacePath : '.');
    this.rootPath = `${this.workspacePath}/components`;
    // this.templatesPath = (templatesPath ? templatesPath : path.join(__dirname,'../../template/component'));
    this.templatesPath = (templatesPath ? templatesPath : path.join(`${process.cwd()}`,'templates','component'));
  }

  public add(template: string, config: ComponentConfig): Promise<string> {
    return new Promise( (resolve, reject) => {
      try {
        startupCheck();
        let dstdir = `${this.rootPath}/${config.domain}/${config.name}`;
        if (!createPath(dstdir)) {
          reject(`Component ${config.name} not added because already exists in the workspace`);
        } else {
          let srcdir = path.join(this.templatesPath, template);
          createElementFromTemplate(srcdir, dstdir, config)
          .then(() => {resolve(dstdir)})
          .catch((error) => {reject(error)});
        }
      } catch(error) {
        reject(error);
      }
    });
  }

  public install(config: ComponentConfig, rootPath?: string): Promise<string> {
    rootPath = rootPath || this.rootPath
    let componentRootPath = `${this.rootPath}/${config.domain}/${config.name}`;
    return executeProgram('npm', ['run', 'devinit'], {cwd: componentRootPath})
    .then(() => {
      return `Component ${config.name} installed`;
    })
  }

  public build(config: ComponentConfig): Promise<string> {
    let componentRootPath = `${this.rootPath}/${config.domain}/${config.name}`;
    return this.install(config, componentRootPath)
    .then(() => {
      if (fs.existsSync(componentRootPath + "/taskfile.js")) {
        return executeProgram('./node_modules/.bin/taskr', ['installer'], {cwd: componentRootPath})
      }else if(fs.existsSync(componentRootPath + "/flyfile.js")){
        return executeProgram('./node_modules/.bin/fly', ['installer'], {cwd: componentRootPath})
      }else{
        throw "Missing file: taskfile.js || flyfile.js"
      }
    })
    .then(() => {
      if (fs.existsSync(componentRootPath + "/taskfile.js")) {
        return executeProgram('./node_modules/.bin/taskr', ['dist'], {cwd: componentRootPath})
      }else if(fs.existsSync(componentRootPath + "/flyfile.js")){
        return executeProgram('./node_modules/.bin/fly', ['dist'], {cwd: componentRootPath})
      }else{
        throw "Missing file: taskfile.js || flyfile.js"
      }
    })
    .then(() => {
      return `${componentRootPath}/dist/bundle.zip`;
    })
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
        return Promise.resolve((currentVersion === config.version));
      })
    } catch(error) {
      return Promise.reject(error);
    }
  }

  public getCurrentVersion(config: ComponentConfig): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        let bundlePath = `${this.rootPath}/${config.domain}/${config.name}/Manifest.json`;
        fs.access(bundlePath, fs.constants.R_OK, (error) => {
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

}