"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const fs = require("fs");
// import { runTemplate } from './templates';
const yo_1 = require("./template-managers/yo");
class Component {
    constructor(workspacePath) {
        this.workspacePath = (workspacePath ? workspacePath : '.');
        this.rootPath = `${this.workspacePath}/components`;
    }
    add(template, config) {
        return __awaiter(this, void 0, void 0, function* () {
            utils_1.startupCheck();
            let dstdir = `${this.rootPath}/${config.domain}/${config.name}`;
            yield yo_1.runTemplate(template, dstdir, config);
            return dstdir;
        });
    }
    install(config, rootPath) {
        rootPath = rootPath || this.rootPath;
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
            return utils_1.executeProgram('npm', ['run', 'dist'], { cwd: componentRootPath });
        })
            .then(() => {
            return utils_1.executeProgram('npm', ['run', 'superclean'], { cwd: componentRootPath });
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
    generateUrn(name, domain, version) {
        return `eslap://${domain}/components/${name}/${version}`;
    }
}
exports.Component = Component;
//# sourceMappingURL=component.js.map