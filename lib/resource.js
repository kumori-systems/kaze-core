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
// import { runTemplate } from './templates';
const yo_1 = require("./template-managers/yo");
class Resource {
    constructor(workspacePath) {
        this.workspacePath = (workspacePath ? workspacePath : '.');
        this.rootPath = `${this.workspacePath}/resources`;
    }
    getRootPath() {
        return this.rootPath;
    }
    add(template, config) {
        return __awaiter(this, void 0, void 0, function* () {
            utils_1.startupCheck();
            let dstdir = `${this.rootPath}/${config.domain}/${config.name}`;
            yield yo_1.runTemplate(template, dstdir, config);
            return `Resource "${config.name}" added in ${dstdir}`;
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