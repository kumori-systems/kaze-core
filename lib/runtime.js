"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const runtime = require("@kumori/runtime");
const path = require("path");
class Runtime {
    constructor(workspacePath, templatesPath) {
        this.workspacePath = (workspacePath ? workspacePath : '.');
        this.rootPath = `${this.workspacePath}/runtimes`;
        this.templatesPath = (templatesPath ? templatesPath : path.join(`${process.cwd()}`, 'templates', 'runtime'));
    }
    add(template, config) {
        return new Promise((resolve, reject) => {
            try {
                utils_1.startupCheck();
                // let parts = parseEcloudURN(config.name);
                let dstdir = `${this.rootPath}/${config.domain}/${config.name}`;
                let srcdir = path.join(this.templatesPath, template);
                let dockerConfig = {
                    from: ''
                };
                for (let elem in config) {
                    dockerConfig[elem] = config[elem];
                }
                if (config.parent) {
                    let parts = utils_1.parseEcloudURN(config.parent);
                    dockerConfig.from = `${parts.domain}/runtime/${parts.path}:${parts.version}`;
                }
                utils_1.createElementFromTemplate(srcdir, dstdir, dockerConfig)
                    .then(() => { resolve(`Runtime ${config.name} added in ${dstdir}`); })
                    .catch((error) => { reject(error); });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    build(config) {
        let runtimeFolder = `${this.rootPath}/${config.domain}/${config.name}`; // TODO
        let manifestPath = `${runtimeFolder}/Manifest.json`;
        let targetFile = `${runtimeFolder}/dist/bundle.zip`;
        runtime.bundle(runtimeFolder, manifestPath, targetFile);
    }
    generateUrn(name, domain, version) {
        return `eslap://${domain}/runtime/${name}/${version}`;
    }
    install(urn) {
        return runtime.install(urn);
    }
}
exports.Runtime = Runtime;
function addCommand(template, config) {
    return new Promise((resolve, reject) => {
        try {
            utils_1.startupCheck();
            // let parts = parseEcloudURN(config.name);
            let dir = `./runtimes/${config.domain}/${config.name}`;
            if (!utils_1.createPath(dir)) {
                reject(`Runtime ${config.name} not added because already exists in the workspace`);
            }
            else {
                let sourceDir = path.join(__dirname, '../../template/runtime', template);
                let dockerConfig = {
                    from: ''
                };
                for (let elem in config) {
                    dockerConfig[elem] = config[elem];
                }
                if (config.parent) {
                    let parts = utils_1.parseEcloudURN(config.parent);
                    dockerConfig.from = `${parts.domain}/runtime/${parts.path}:${parts.version}`;
                }
                utils_1.createElementFromTemplate(sourceDir, dir, dockerConfig)
                    .then(() => { resolve(`Runtime ${config.name} added in ${dir}`); })
                    .catch((error) => { reject(error); });
            }
        }
        catch (error) {
            reject(error);
        }
    });
}
exports.addCommand = addCommand;
function buildCommand(config) {
    let runtimeFolder = `./runtimes/${config.domain}/${config.name}`; // TODO
    let manifestPath = `${runtimeFolder}/Manifest.json`;
    let targetFile = `${runtimeFolder}/dist/bundle.zip`;
    runtime.bundle(runtimeFolder, manifestPath, targetFile);
}
exports.buildCommand = buildCommand;
//# sourceMappingURL=runtime.js.map