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
const runtime = require("@kumori/runtime");
const path = require("path");
// import { runTemplate } from './templates';
const yo_1 = require("./template-managers/yo");
class Runtime {
    constructor(workspacePath = '.', runtimeStub = runtime) {
        this.workspacePath = workspacePath;
        this.rootPath = `${this.workspacePath}/runtimes`;
        this.runtimeStub = runtimeStub;
    }
    add(template, config) {
        return __awaiter(this, void 0, void 0, function* () {
            utils_1.startupCheck();
            // let parts = parseEcloudURN(config.name);
            let dstdir = `${this.rootPath}/${config.domain}/${config.name}`;
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
            yield yo_1.runTemplate(template, dstdir, dockerConfig);
            return `Runtime ${config.name} added in ${dstdir}`;
        });
    }
    build(config) {
        return __awaiter(this, void 0, void 0, function* () {
            let runtimeFolder = `${this.rootPath}/${config.domain}/${config.name}`; // TODO
            let manifestPath = `${runtimeFolder}/Manifest.json`;
            let targetFile = `${runtimeFolder}/dist/bundle.zip`;
            return yield this.runtimeStub.bundle(runtimeFolder, manifestPath, targetFile);
        });
    }
    generateUrn(name, domain, version) {
        return `eslap://${domain}/runtime/${name}/${version}`;
    }
    install(urn) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.runtimeStub.install(urn);
        });
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