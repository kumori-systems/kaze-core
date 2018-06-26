import { Component } from './component';
import { Deployment } from './deployment';
import { Service } from './service';
import { Resource } from './resource';
import { LocalStamp } from './localstamp';
import { Project } from './project';
import { Runtime } from './runtime';
import { Stamp } from './stamp';
import { StampStatus } from './utils';
export declare class Workspace {
    component: Component;
    deployment: Deployment;
    localStamp: LocalStamp;
    runtime: Runtime;
    service: Service;
    stamp: Stamp;
    resource: Resource;
    project: Project;
    constructor(component: Component, deployment: Deployment, localStamp: LocalStamp, runtime: Runtime, service: Service, resource: Resource, project: Project, stamp: Stamp);
    bundle(paths: string[]): Promise<any>;
    deploy(paths: string[], stamp: string): Promise<any>;
    /**
     * Creates a bundle with the deployment configuration and any other element needed and not already registered in the stamp (currently this only includes the service manifest and the components).
     *
     * @param name The deployment name in the workspace.
     * @param stamp The stamp where the service instance will be deployed.
     * @param addRandomInbounds If true, inbounds with random domains will be created.
     * @param buildComponents If true, a service component will be built if it is not registered in the target stamp and it has not a distributable file.
     * @param forceBuildComponents If true, a service component will be built if it is not registered in the target stamp, even if already exists a distributable file for this component.
     *
     * @returns A promise resolved with information about the registration process results.
     */
    deployWithDependencies(name: string, stamp: string, addRandomInbounds: boolean, buildComponents: boolean, forceBuildComponents: boolean): Promise<any>;
    info(requestedInfo: string, stamp: string): Promise<any>;
    init(template: string): Promise<boolean>;
    register(paths: string[], stamp: string): Promise<any>;
    undeploy(uris: string[], stamp: string): Promise<any>;
    readConfigFile(): any;
    checkStamp(stamp: string, exitOnFail?: boolean): Promise<StampStatus>;
    getStampStatus(path: string): Promise<StampStatus>;
    startupCheck(): any;
    getStampUrl(stamp: string): string;
}
