"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const path = require("path");
class Resource {
    constructor(workspacePath, templatesPath) {
        this.workspacePath = (workspacePath ? workspacePath : '.');
        this.rootPath = `${this.workspacePath}/resources`;
        this.templatesPath = (templatesPath ? templatesPath : path.join(`${process.cwd()}`, 'templates', 'resource'));
    }
    getRootPath() {
        return this.rootPath;
    }
    add(template, config) {
        return new Promise((resolve, reject) => {
            try {
                utils_1.startupCheck();
                let dstdir = `${this.rootPath}/${config.domain}/${config.name}`;
                if (!utils_1.createPath(dstdir)) {
                    reject(`Resource ${config.name} not added because already exists in the workspace`);
                }
                else {
                    let srcdir = path.join(this.templatesPath, template);
                    utils_1.createElementFromTemplate(srcdir, dstdir, config)
                        .then(() => { resolve(`Service "${config.name}" added in ${dstdir}`); })
                        .catch((error) => { reject(error); });
                }
            }
            catch (error) {
                reject(error);
            }
        });
    }
    getManifest(config) {
        let manifestPath = `${this.rootPath}/${config.domain}/${config.name}/Manifest.json`;
        return utils_1.getJSON(manifestPath);
    }
    parseName(urn) {
        let parts = urn.split('/');
        let domain = parts[2];
        let name = parts[4];
        let config = {
            name: name,
            domain: domain
        };
        return config;
    }
    // Returns the distributable file for a service.
    // TODO: this should create a bundle.
    //
    // Parameters:
    // * `config`: a ServiceConfig with the service name and domain.
    //
    // Returns: a promise resolved with the path to the distributable file.
    getDistributableFile(config) {
        return Promise.resolve(`${this.rootPath}/${config.domain}/${config.name}/Manifest.json`);
    }
    generateUrn(name, domain) {
        let manifest = this.getManifest({ name: name, domain: domain });
        return manifest.name;
    }
}
exports.Resource = Resource;
//# sourceMappingURL=resource.js.map