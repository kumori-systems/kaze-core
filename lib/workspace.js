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
const bundle_1 = require("./bundle");
const deploy_1 = require("./deploy");
const info_1 = require("./info");
const initialize_1 = require("./initialize");
const localstamp_1 = require("./localstamp");
const register_1 = require("./register");
const undeploy_1 = require("./undeploy");
const utils_1 = require("./utils");
const path = require("path");
const uuid_1 = require("uuid");
const tshirt = require("./tshirt-patch");
let localStamp = new localstamp_1.LocalStamp();
class Workspace {
    constructor(component, deployment, localStamp, runtime, service, resource, stamp) {
        this.component = component;
        this.deployment = deployment;
        this.localStamp = localStamp;
        this.runtime = runtime;
        this.service = service;
        this.stamp = stamp;
        this.resource = resource;
    }
    bundle(paths) {
        return bundle_1.bundleCommand(paths);
    }
    deploy(paths, stamp) {
        return deploy_1.deployCommand(paths, stamp);
    }
    // Registers a deployment manifest in a target stamp. If any of the
    // deployment manifest dependencies are not registered in the target stamp
    // and are available in the workspace, they are bundled to and registered.
    deployWithDependencies(name, stamp, addRandomInbounds) {
        try {
            let config = utils_1.readConfigFile();
            stamp = (stamp ? stamp : config['working-stamp']);
            if (!stamp) {
                return Promise.reject(new Error('Stamp not specified and default stamp not found.'));
            }
            let toBeBundled = [];
            let blobs = [];
            let deployUuid;
            let manifest = this.deployment.getManifest(name);
            if (addRandomInbounds) {
                manifest.name = uuid_1.v4().replace("_", "-");
            }
            blobs.push({
                pathInZip: `deployments/${name}/Manifest.json`,
                data: new Buffer(JSON.stringify(manifest, null, 2))
            });
            return this.stamp.isRegistered(stamp, manifest.servicename)
                .then((registered) => {
                let serviceConfig = this.deployment.getService(name);
                if (!registered) {
                    return this.service.getDistributableFile(serviceConfig)
                        .then((filepath) => {
                        toBeBundled.push(filepath);
                        return Promise.resolve(serviceConfig);
                    });
                }
                else {
                    return Promise.resolve(serviceConfig);
                }
            })
                .then((serviceConfig) => {
                let components = this.service.getComponents(serviceConfig);
                let promises = [];
                // Components
                for (let name of components) {
                    ((name) => {
                        promises.push(this.stamp.isRegistered(stamp, name)
                            .then((registered) => {
                            if (!registered) {
                                let componentConfig = this.component.parseName(name);
                                return this.component.getDistributableFile(componentConfig)
                                    .then((filepath) => {
                                    toBeBundled.push(filepath);
                                    return Promise.resolve();
                                });
                            }
                            else {
                                return Promise.resolve();
                            }
                        }));
                    })(name);
                }
                return Promise.all(promises);
            })
                .then(() => {
                if (addRandomInbounds) {
                    let serviceConfig = this.deployment.getService(name);
                    let serviceManifest = this.service.getManifest(serviceConfig);
                    if (serviceManifest.channels && serviceManifest.channels.provides && serviceManifest.channels.provides.length > 0) {
                        let serviceName = serviceManifest.name;
                        for (let i in serviceManifest.channels.provides) {
                            let inboundName = `inbound-deployment-${i}`;
                            let channel = serviceManifest.channels.provides[i];
                            let inboundManifest = tshirt.createInboundManifest(inboundName);
                            let linkManifest = tshirt.createLinkManifest(manifest.name, channel.name, inboundName, "frontend");
                            let tshirtPath = `tshirt/${channel.name}`;
                            let inboundBlob = {
                                pathInZip: `${tshirtPath}/inbound/Manifest.json`,
                                data: new Buffer(JSON.stringify(inboundManifest, null, 2))
                            };
                            let linkBlob = {
                                pathInZip: `${tshirtPath}/link/Manifest.json`,
                                data: new Buffer(JSON.stringify(linkManifest, null, 2))
                            };
                            blobs.push(inboundBlob);
                            blobs.push(linkBlob);
                        }
                    }
                }
                let targetFile = path.join('.', 'builts', `${name}_${Date.now().toString()}.zip`);
                return utils_1.createBundleFile(targetFile, toBeBundled, blobs);
            })
                .then((zipfileath) => {
                return this.stamp.register(stamp, zipfileath);
            });
            // return Promise.reject(new Error('Not implemented'));
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    info(requestedInfo, stamp) {
        return info_1.infoCommand(requestedInfo, stamp);
    }
    init(configFileName) {
        return initialize_1.initCommand(configFileName);
    }
    register(paths, stamp) {
        return register_1.registerCommand(paths, stamp);
    }
    undeploy(uris, stamp) {
        return undeploy_1.undeployCommand(uris, stamp);
    }
    readConfigFile() {
        return utils_1.readConfigFile();
    }
    checkStamp(stamp, exitOnFail = true) {
        return utils_1.checkStamp(stamp, exitOnFail);
    }
    getStampStatus(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return utils_1.getStampStatus(path);
        });
    }
    startupCheck() {
        return utils_1.startupCheck();
    }
    getStampUrl(stamp) {
        return utils_1.getStampUrl(stamp);
    }
}
exports.Workspace = Workspace;
//# sourceMappingURL=workspace.js.map