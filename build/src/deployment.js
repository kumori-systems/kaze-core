"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const path = require("path");
const service_1 = require("./service");
const component_1 = require("./component");
const fs_1 = require("fs");
const admission_client_1 = require("admission-client");
class Deployment {
    constructor(workspacePath, templatesPath) {
        this.workspacePath = (workspacePath ? workspacePath : '.');
        this.rootPath = `${this.workspacePath}/deployments`;
        // this.templatesPath = (templatesPath ? templatesPath : path.join(__dirname,'../../template/deployment'));
        this.templatesPath = (templatesPath ? templatesPath : path.join(`${process.cwd()}`, 'templates', 'deployment'));
    }
    add(template, config) {
        return new Promise((resolve, reject) => {
            try {
                utils_1.startupCheck();
                if (!config.service.version) {
                    reject('Service version missing');
                    return;
                }
                let templateConfig = {
                    name: config.name,
                    parameters: null,
                    resources: null,
                    roles: null,
                    service: config.service
                };
                let dstdir = `${this.rootPath}/${config.name}`;
                if (!utils_1.createPath(dstdir)) {
                    reject(`Deployment ${config.name} not added because already exists in the workspace`);
                }
                else {
                    // Adds the roles configurarion to the parameters needed by the
                    // templates engine
                    let srcdir = path.join(this.templatesPath, template);
                    let service = new service_1.Service(this.workspacePath, this.templatesPath);
                    let serviceRoles = service.getRoles(config.service);
                    templateConfig.roles = serviceRoles;
                    // Calculates which parameters should be added to the templates
                    // engine configuration.
                    templateConfig.parameters = this.createDeploymentParameters(config.service);
                    // Calculates which resources should be added
                    templateConfig.resources = this.createDeploymentResources(config.service);
                    // Generate the deployment manifest from the template
                    return utils_1.createElementFromTemplate(srcdir, dstdir, templateConfig)
                        .then(() => { resolve(`Deployment "${config.name}" added in ${dstdir}`); })
                        .catch((error) => { reject(error); });
                }
            }
            catch (error) {
                reject(error);
            }
        });
    }
    getManifest(name) {
        let manifestPath = `${this.rootPath}/${name}/Manifest.json`;
        return utils_1.getJSON(manifestPath);
    }
    updateManifest(name, manifest) {
        let manifestPath = `${this.rootPath}/${name}/Manifest.json`;
        return utils_1.writeJSON(manifestPath, JSON.stringify(manifest, null, 2));
    }
    getService(name) {
        let manifest = this.getManifest(name);
        let urn = manifest.servicename;
        let service = new service_1.Service(this.workspacePath, this.templatesPath);
        return service.parseName(urn);
    }
    // Returns the distributable file for a deployment.
    // TODO: this should create a bundle.
    //
    // Parameters:
    // * `name`: the deployment name.
    //
    // Returns: a promise resolved with the path to the distributable file.
    getDistributableFile(name) {
        return new Promise((resolve, reject) => {
            try {
                let bundlePath = `${this.rootPath}/${name}/Manifest.json`;
                fs_1.access(bundlePath, fs_1.constants.R_OK, (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(bundlePath);
                    }
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    // Changes the number of replicas for a given role
    //
    // Parameters:
    // * `name`: the deployment name.
    // * `role`: the role to scale.
    // * `numInstances`: the new number of replicas.
    // * `stamp`: the stamp hosting this deployment.
    //
    // Returns a promise resolved with a message.
    scaleRole(name, role, numInstances, stamp) {
        let stampUrl = utils_1.getStampUrl(stamp);
        if (!stampUrl) {
            return Promise.reject(new Error(`Stamp ${stamp} not registered in the workspace`));
        }
        let admission = new admission_client_1.AdmissionClient(`${stampUrl}/admission`);
        let modification = new admission_client_1.ScalingDeploymentModification();
        modification.deploymentURN = name;
        modification.scaling = {};
        modification.scaling[role] = numInstances;
        return admission.modifyDeployment(modification)
            .then((value) => {
            return `Result: ${value}`;
        });
    }
    // Calculates de deployment resources from the service resources.
    createDeploymentResources(config) {
        let service = new service_1.Service(this.workspacePath, this.templatesPath);
        // Calculates which resources should be added to the templates
        // engine configuration.
        let resources = service.getResources(config);
        let processed = [];
        // The resources are processed using generator functions.
        let resourcesIt = this.processResourcesDefaultValues(resources);
        let elem = resourcesIt.next();
        while (!elem.done) {
            let param = elem.value;
            processed.push(param);
            elem = resourcesIt.next();
        }
        return processed;
    }
    // Calculates de deployment parameters from the service and roles parameters.
    createDeploymentParameters(config) {
        let service = new service_1.Service(this.workspacePath, this.templatesPath);
        let roles = service.getRoles(config);
        // Calculates which parameters should be added to the templates
        // engine configuration.
        let serviceParams = service.getParameters(config);
        let paramsProcessed = [];
        // Parameters are processed to add default values depending on their
        // type and the default value. The parameters are processed using
        // generator functions.
        let paramsIt = this.processParametersDefaultValues(serviceParams);
        let elem = paramsIt.next();
        while (!elem.done) {
            let param = elem.value;
            // If the parameter type is JSON and the parameter name is also a
            // service role, then change the value with a JSON document
            // including the parameters of the role's component with initial
            // values.
            if (param.type == utils_1.ParameterType.JSON) {
                let role = this.getRole(param.name, roles);
                if ((role) && (role.component)) {
                    let compParams = this.getComponentParameters(role.component);
                    let value = '{';
                    let compParamsIt = this.processParametersDefaultValues(compParams);
                    let compElem = compParamsIt.next();
                    let first = true;
                    while (!compElem.done) {
                        let compParam = compElem.value;
                        if (first) {
                            value = `${value}\n        "${compParam.name}":${compParam.value}`;
                            first = false;
                        }
                        else {
                            value = `,${value}\n        "${compParam.name}":${compParam.value},`;
                        }
                        compElem = compParamsIt.next();
                    }
                    console.log("COMP PARAMS", compParams, value);
                    value = `${value}\n      }`;
                    param.value = value;
                }
            }
            paramsProcessed.push(param);
            elem = paramsIt.next();
        }
        return paramsProcessed;
    }
    // Given a component URN, returns its parameters.
    getComponentParameters(urn) {
        let component = new component_1.Component(this.workspacePath, this.templatesPath);
        let config = component.parseName(urn);
        return component.getParameters(config);
    }
    // Gets a list of Parameter and calculates its default value. This is a
    // generator function. 
    *processParametersDefaultValues(parameters) {
        for (let param of parameters) {
            switch (param.type) {
                case utils_1.ParameterType.BOOLEAN:
                    yield {
                        name: param.name,
                        type: param.type,
                        value: (param.default ? param.default : "false")
                    };
                    break;
                case utils_1.ParameterType.INTEGER:
                    yield {
                        name: param.name,
                        type: param.type,
                        value: (param.default ? param.default : "0")
                    };
                    break;
                case utils_1.ParameterType.JSON:
                    yield {
                        name: param.name,
                        type: param.type,
                        value: (param.default ? param.default : "{}")
                    };
                    break;
                case utils_1.ParameterType.LIST:
                    yield {
                        name: param.name,
                        type: param.type,
                        value: (param.default ? param.default : "[]")
                    };
                    break;
                case utils_1.ParameterType.NUMBER:
                    yield {
                        name: param.name,
                        type: param.type,
                        value: (param.default ? param.default : "0")
                    };
                    break;
                case utils_1.ParameterType.STRING:
                    yield {
                        name: param.name,
                        type: param.type,
                        value: (param.default ? param.default : '""')
                    };
                    break;
                case utils_1.ParameterType.VHOST:
                    yield {
                        name: param.name,
                        type: param.type,
                        value: (param.default ? param.default : '""')
                    };
                    break;
            }
        }
    }
    *processResourcesDefaultValues(resources) {
        for (let res of resources) {
            switch (res.type) {
                case utils_1.ResourceType.CERT_CLIENT:
                    yield {
                        name: res.name,
                        type: res.type,
                        value: '""'
                    };
                    break;
                case utils_1.ResourceType.CERT_SERVER:
                    yield {
                        name: res.name,
                        type: res.type,
                        value: '""'
                    };
                    break;
                case utils_1.ResourceType.FAULT_GROUP:
                    yield {
                        name: res.name,
                        type: res.type,
                        value: '""'
                    };
                    break;
                case utils_1.ResourceType.VHOST:
                    yield {
                        name: res.name,
                        type: res.type,
                        value: '""'
                    };
                    break;
                case utils_1.ResourceType.VOLUME_PERSITENT:
                    yield {
                        name: res.name,
                        type: res.type,
                        value: '""'
                    };
                    break;
                case utils_1.ResourceType.VOLUME_VOLATILE:
                    yield {
                        name: res.name,
                        type: res.type,
                        value: '""'
                    };
                    break;
            }
        }
    }
    getRole(name, roles) {
        for (let role of roles) {
            if (name == role.name) {
                return role;
            }
        }
        return undefined;
    }
}
exports.Deployment = Deployment;
//# sourceMappingURL=deployment.js.map