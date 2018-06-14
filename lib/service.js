"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const path = require("path");
const component_1 = require("./component");
const fs_1 = require("fs");
class Service {
    constructor(workspacePath, templatesPath) {
        this.workspacePath = (workspacePath ? workspacePath : '.');
        this.rootPath = `${this.workspacePath}/services`;
        this.templatesPath = (templatesPath ? templatesPath : path.join(`${process.cwd()}`, 'templates', 'service'));
    }
    getRootPath() {
        return this.rootPath;
    }
    add(template, config) {
        return new Promise((resolve, reject) => {
            try {
                utils_1.startupCheck();
                let dstdir = `${this.rootPath}/${config.domain}/${config.name}`;
                let srcdir = path.join(this.templatesPath, template);
                utils_1.createElementFromTemplate(srcdir, dstdir, config)
                    .then(() => { resolve(`Service "${config.name}" added in ${dstdir}`); })
                    .catch((error) => { reject(error); });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    getRoles(config) {
        let manifest = this.getManifest(config);
        let roles = [];
        for (let role of manifest.roles) {
            roles.push({ name: role.name, component: role.component });
        }
        return roles;
    }
    getProvidedChannels(config) {
        let manifest = this.getManifest(config);
        let channels = [];
        for (let channel of manifest.channels.provides) {
            channels.push({ name: channel.name, type: channel.type, protocol: channel.protocol });
        }
        return channels;
    }
    getRequiredChannels(config) {
        let manifest = this.getManifest(config);
        let channels = [];
        for (let channel of manifest.channels.requires) {
            channels.push({ name: channel.name, type: channel.type, protocol: channel.protocol });
        }
        return channels;
    }
    getParameters(config) {
        let manifest = this.getManifest(config);
        let parameters = [];
        if (manifest.configuration && manifest.configuration.parameters && (manifest.configuration.parameters.length > 0)) {
            parameters = utils_1.processParameters(manifest.configuration.parameters);
        }
        return parameters;
    }
    getResources(config) {
        let manifest = this.getManifest(config);
        let resources = [];
        if (manifest.configuration && manifest.configuration.resources && (manifest.configuration.resources.length > 0)) {
            resources = utils_1.processResources(manifest.configuration.resources);
        }
        return resources;
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
    getComponents(config) {
        let dependencies = [];
        let component = new component_1.Component(this.workspacePath, this.templatesPath);
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
    getDistributableFile(config) {
        return this.checkVersion(config)
            .then((result) => {
            if (result) {
                return Promise.resolve(`${this.rootPath}/${config.domain}/${config.name}/Manifest.json`);
            }
            else {
                return Promise.reject(new Error(`Version "${config.version}" of service "${config.domain}/${config.name}" not found in the workspace`));
            }
        });
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
                fs_1.access(bundlePath, fs_1.constants.R_OK, (error) => {
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
        return `eslap://${domain}/services/${name}/${version}`;
    }
}
exports.Service = Service;
//# sourceMappingURL=service.js.map