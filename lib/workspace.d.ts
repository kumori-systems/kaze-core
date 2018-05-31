import { Component } from './component';
import { Deployment } from './deployment';
import { Service } from './service';
import { LocalStamp } from './localstamp';
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
    constructor(component: Component, deployment: Deployment, localStamp: LocalStamp, runtime: Runtime, service: Service, stamp: Stamp);
    bundle(paths: string[]): Promise<any>;
    deploy(paths: string[], stamp: string): Promise<any>;
    deployWithDependencies(name: string, stamp?: string, inboundsDomain?: string): Promise<any>;
    info(requestedInfo: string, stamp: string): Promise<any>;
    init(configFileName: string): Promise<boolean>;
    register(paths: string[], stamp: string): Promise<any>;
    undeploy(uris: string[], stamp: string): Promise<any>;
    readConfigFile(): any;
    checkStamp(stamp: string, exitOnFail?: boolean): Promise<StampStatus>;
    getStampStatus(path: string): Promise<StampStatus>;
    startupCheck(): any;
    getStampUrl(stamp: string): string;
}
