import { Parameter, ParameterType, Resource, ResourceType, StampConfig, readConfigFile, createElementFromTemplate, createPath, startupCheck, getJSON, writeJSON } from './utils';
import * as path from 'path';
import { Role, Service, ServiceConfig } from './service';
import { Component, ComponentConfig } from './component';
import { access, constants } from 'fs';
import { AdmissionClient, ScalingDeploymentModification, DeploymentInstanceInfo } from 'admission-client';

export interface DeploymentConfig {
  name: string,
  service: ServiceConfig
}

export class Deployment {

  private rootPath: string;
  private templatesPath: string;
  private workspacePath: string;

  constructor(workspacePath?: string, templatesPath?: string) {
    this.workspacePath = (workspacePath ? workspacePath : '.');
    this.rootPath = `${this.workspacePath}/deployments`;
    // this.templatesPath = (templatesPath ? templatesPath : path.join(__dirname,'../../template/deployment'));
    this.templatesPath = (templatesPath ? templatesPath : path.join(`${process.cwd()}`,'templates','deployment'));
  }

  public add(template: string, config: DeploymentConfig): Promise<string> {
    return new Promise( (resolve, reject) => {
      try {
        startupCheck();
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
        if (!createPath(dstdir)) {
          reject(`Deployment ${config.name} not added because already exists in the workspace`);
        } else {
          // Adds the roles configurarion to the parameters needed by the
          // templates engine
          let srcdir = path.join(this.templatesPath, template);
          let service = new Service(this.workspacePath, this.templatesPath);
          let serviceRoles = service.getRoles(config.service);
          templateConfig.roles = serviceRoles;
          // Calculates which parameters should be added to the templates
          // engine configuration.
          templateConfig.parameters = this.createDeploymentParameters(config.service);
          // Calculates which resources should be added
          templateConfig.resources = this.createDeploymentResources(config.service);
          // Generate the deployment manifest from the template
          return createElementFromTemplate(srcdir, dstdir, templateConfig)
          .then(() => {resolve(`Deployment "${config.name}" added in ${dstdir}`)})
          .catch((error) => {reject(error)});
        }
      } catch(error) {
        reject(error);
      }
    });
  }

  public getManifest(name: string): any {
    let manifestPath = `${this.rootPath}/${name}/Manifest.json`;
    return getJSON(manifestPath);
  }

  public updateManifest(name: string, manifest): any {
    let manifestPath = `${this.rootPath}/${name}/Manifest.json`;
    return writeJSON(manifestPath, JSON.stringify(manifest, null, 2));
  }

  public getService(name: string): ServiceConfig {
    let manifest = this.getManifest(name);
    let urn = manifest.servicename;
    let service = new Service(this.workspacePath, this.templatesPath);
    return service.parseName(urn);
  }

  // Returns the distributable file for a deployment.
  // TODO: this should create a bundle.
  //
  // Parameters:
  // * `name`: the deployment name.
  //
  // Returns: a promise resolved with the path to the distributable file.
  public getDistributableFile(name: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        let bundlePath = `${this.rootPath}/${name}/Manifest.json`;
        access(bundlePath, constants.R_OK, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve(bundlePath);
          }
        });
      } catch(error) {
        reject(error);
      }
    })
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
  public scaleRole(name:string, role:string, numInstances: number, stamp: string): Promise<string> {
    let workspaceConfig = readConfigFile();
    let stampConfig:StampConfig = workspaceConfig.stamps && workspaceConfig.stamps[stamp]
    if (!stampConfig) {
      return Promise.reject(new Error(`Stamp ${stamp} not registered in the workspace`));
    }
    let admissionUrl = stampConfig.admission
    let token = stampConfig.token
    let admission = new AdmissionClient(`${admissionUrl}/admission`, token);
    let modification = new ScalingDeploymentModification();
    modification.deploymentURN = name;
    modification.scaling = {};
    modification.scaling[role] = numInstances;
    return admission.modifyDeployment(modification)
    .then((value) => {
      return `Result: ${value}`;
    })
  }

  public undeploy(name: string, stamp: string) {
    let workspaceConfig = readConfigFile();
    let stampConfig:StampConfig = workspaceConfig.stamps && workspaceConfig.stamps[stamp]
    if (!stampConfig) {
      return Promise.reject(new Error(`Stamp ${stamp} not registered in the workspace`));
    }
    let admissionUrl = stampConfig.admission
    let token = stampConfig.token
    let admission = new AdmissionClient(`${admissionUrl}/admission`, token);
    return admission.undeploy(name)
  }

  // Calculates de deployment resources from the service resources.
  private createDeploymentResources(config: ServiceConfig): any[] {
    let service = new Service(this.workspacePath, this.templatesPath);
    // Calculates which resources should be added to the templates
    // engine configuration.
    let resources = service.getResources(config);
    let processed: any[] = [];
    // The resources are processed using generator functions.
    let resourcesIt = this.processResourcesDefaultValues(resources);
    let elem = resourcesIt.next();
    while (!elem.done) {
      let param = elem.value;
      processed.push(param);
      elem = resourcesIt.next()
    }
    return processed;
  }

  // Calculates de deployment parameters from the service and roles parameters.
  private createDeploymentParameters(config: ServiceConfig): any[] {
    let service = new Service(this.workspacePath, this.templatesPath);
    let roles = service.getRoles(config);
    // Calculates which parameters should be added to the templates
    // engine configuration.
    let serviceParams = service.getParameters(config);
    let paramsProcessed: any[] = [];
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
      if (param.type == ParameterType.JSON) {
        let role = this.getRole(param.name, roles);
        if ((role) && (role.component)) {
          let compParams = this.getComponentParameters(role.component);
          let value = '{';
          let compParamsIt = this.processParametersDefaultValues(compParams);
          let compElem = compParamsIt.next();
          let first = true;
          while(!compElem.done) {
            let compParam = compElem.value;
            if (first) {
              value = `${value}\n        "${compParam.name}":${compParam.value}`;
              first = false;
            } else {
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
      elem = paramsIt.next()
    }
    return paramsProcessed;
  }

  // Given a component URN, returns its parameters.
  private getComponentParameters(urn: string): Parameter[] {
    let component = new Component(this.workspacePath, this.templatesPath);
    let config = component.parseName(urn);
    return component.getParameters(config);
  }

  // Gets a list of Parameter and calculates its default value. This is a
  // generator function.
  private *processParametersDefaultValues(parameters: Parameter[]) {
    for (let param of parameters) {
      switch (param.type) {
        case ParameterType.BOOLEAN:
          yield {
            name: param.name,
            type: param.type,
            value: (param.default ? param.default : "false")
          }
          break;
        case ParameterType.INTEGER:
          yield {
            name: param.name,
            type: param.type,
            value: (param.default ? param.default : "0")
          }
          break;
        case ParameterType.JSON:
           yield {
            name: param.name,
            type: param.type,
            value: (param.default ? param.default : "{}")
          }
          break;
        case ParameterType.LIST:
          yield {
            name: param.name,
            type: param.type,
            value: (param.default ? param.default : "[]")
          }
          break;
        case ParameterType.NUMBER:
          yield {
            name: param.name,
            type: param.type,
            value: (param.default ? param.default : "0")
          }
          break;
        case ParameterType.STRING:
          yield {
            name: param.name,
            type: param.type,
            value: (param.default ? param.default : '""')
          }
          break;
        case ParameterType.VHOST:
          yield {
            name: param.name,
            type: param.type,
            value: (param.default ? param.default : '""')
          }
          break;
      }
    }
  }

  private *processResourcesDefaultValues(resources: Resource[]) {
    for (let res of resources) {
      switch (res.type) {
        case ResourceType.CERT_CLIENT:
          yield {
            name: res.name,
            type: res.type,
            value: '""'
          }
          break;
        case ResourceType.CERT_SERVER:
          yield {
            name: res.name,
            type: res.type,
            value: '""'
          }
          break;
        case ResourceType.FAULT_GROUP:
          yield {
            name: res.name,
            type: res.type,
            value: '""'
          }
          break;
        case ResourceType.VHOST:
          yield {
            name: res.name,
            type: res.type,
            value: '""'
          }
          break;
        case ResourceType.VOLUME_PERSITENT:
          yield {
            name: res.name,
            type: res.type,
            value: '""'
          }
          break;
        case ResourceType.VOLUME_VOLATILE:
          yield {
            name: res.name,
            type: res.type,
            value: '""'
          }
          break;
      }
    }
  }

  private getRole(name: string, roles: Role[]): Role | undefined {
    for (let role of roles) {
      if (name == role.name) {
        return role;
      }
    }
    return undefined;
  }
}