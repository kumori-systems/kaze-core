"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const fs = require("fs");
const path = require("path");
class Component {
    constructor(workspacePath, templatesPath) {
        this.workspacePath = (workspacePath ? workspacePath : '.');
        this.rootPath = `${this.workspacePath}/components`;
        // this.templatesPath = (templatesPath ? templatesPath : path.join(__dirname,'../../template/component'));
        this.templatesPath = (templatesPath ? templatesPath : path.join(`${process.cwd()}`, 'templates', 'component'));
    }
    add(template, config) {
        return new Promise((resolve, reject) => {
            try {
                utils_1.startupCheck();
                let dstdir = `${this.rootPath}/${config.domain}/${config.name}`;
                if (!utils_1.createPath(dstdir)) {
                    reject(`Component ${config.name} not added because already exists in the workspace`);
                }
                else {
                    let srcdir = path.join(this.templatesPath, template);
                    utils_1.createElementFromTemplate(srcdir, dstdir, config)
                        .then(() => { resolve(dstdir); })
                        .catch((error) => { reject(error); });
                }
            }
            catch (error) {
                reject(error);
            }
        });
    }
    install(config, rootPath) {
        let componentRootPath = `${this.rootPath}/${config.domain}/${config.name}`;
        return utils_1.executeProgram('npm', ['run', 'devinit'], { cwd: componentRootPath })
            .then(() => {
            return `Component ${config.name} installed`;
        });
    }
    build(config) {
        let componentRootPath = `${this.rootPath}/${config.domain}/${config.name}`;
        return this.install(config, componentRootPath)
            .then(() => {
            if (fs.existsSync(componentRootPath + "/taskfile.js")) {
                return utils_1.executeProgram('./node_modules/.bin/taskr', ['installer'], { cwd: componentRootPath });
            }
            else if (fs.existsSync(componentRootPath + "/flyfile.js")) {
                return utils_1.executeProgram('./node_modules/.bin/fly', ['installer'], { cwd: componentRootPath });
            }
            else {
                throw "Missing file: taskfile.js || flyfile.js";
            }
        })
            .then(() => {
            if (fs.existsSync(componentRootPath + "/taskfile.js")) {
                return utils_1.executeProgram('./node_modules/.bin/taskr', ['dist'], { cwd: componentRootPath });
            }
            else if (fs.existsSync(componentRootPath + "/flyfile.js")) {
                return utils_1.executeProgram('./node_modules/.bin/fly', ['dist'], { cwd: componentRootPath });
            }
            else {
                throw "Missing file: taskfile.js || flyfile.js";
            }
        })
            .then(() => {
            return `${componentRootPath}/dist/bundle.zip`;
        });
    }
    getParameters(config) {
        let manifest = this.getManifest(config);
        let parameters = [];
        if (manifest.configuration && manifest.configuration.parameters && (manifest.configuration.parameters.length > 0)) {
            parameters = utils_1.processParameters(manifest.configuration.parameters);
        }
        return parameters;
    }
    getManifest(config) {
        let manifestPath = `${this.rootPath}/${config.domain}/${config.name}/Manifest.json`;
        return utils_1.getJSON(manifestPath);
    }
    parseName(urn) {
        let parts = urn.split('/');
        let domain = parts[2];
        let name = parts[4];
        let version = parts[5];
        let component = new Component(this.workspacePath, this.templatesPath);
        let config = {
            name: name,
            domain: domain,
            version: version
        };
        return config;
    }
    // Returns the distributable file for a component.
    //
    // Parameters:
    // * `config`: a ComponentConfig with the service name and domain.
    //
    // Returns: a promise resolved with the path to the distributable file.
    getDistributableFile(config) {
        return this.checkVersion(config)
            .then((result) => {
            if (result) {
                return new Promise((resolve, reject) => {
                    try {
                        let bundlePath = `${this.rootPath}/${config.domain}/${config.name}/dist/bundle.zip`;
                        fs.access(bundlePath, fs.constants.R_OK, (error) => {
                            if (error) {
                                let message = '';
                                if (error && (error.code === 'ENOENT')) {
                                    message = `Distributable file not found for component "${config.domain}/${config.name}"`;
                                }
                                else {
                                    message = error.message;
                                }
                                reject(new Error(`Error registering component ${config.domain}/${config.name}: ${message}`));
                            }
                            else {
                                resolve(bundlePath);
                            }
                        });
                    }
                    catch (error) {
                        reject(new Error(`Error registering component ${config.domain}/${config.name}: ${error.message}`));
                    }
                });
            }
            else {
                return Promise.reject(new Error(`Version "${config.version}" of component "${config.domain}/${config.name}" not found in the workspace`));
            }
        });
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
    checkVersion(config) {
        try {
            return this.getCurrentVersion(config)
                .then((currentVersion) => {
                return Promise.resolve((currentVersion === config.version));
            });
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    getCurrentVersion(config) {
        return new Promise((resolve, reject) => {
            try {
                let bundlePath = `${this.rootPath}/${config.domain}/${config.name}/Manifest.json`;
                fs.access(bundlePath, fs.constants.R_OK, (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        let manifest = utils_1.getJSON(bundlePath);
                        let wsConfig = this.parseName(manifest.name);
                        resolve(wsConfig.version);
                    }
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
exports.Component = Component;
//# sourceMappingURL=component.js.map