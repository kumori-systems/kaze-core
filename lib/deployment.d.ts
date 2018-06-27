import { ServiceConfig } from './service';
import { DeploymentInstanceInfo, StampStubFactory } from './stamp-manager';
export interface DeploymentConfig {
    name: string;
    service: ServiceConfig;
}
export declare class Deployment {
    private rootPath;
    private workspacePath;
    private stampStubFactory;
    constructor(stampStubFactory: StampStubFactory, workspacePath?: string);
    add(template: string, config: DeploymentConfig): Promise<string>;
    getManifest(name: string): any;
    updateManifest(name: string, manifest: any): any;
    getService(name: string): ServiceConfig;
    getDistributableFile(name: string): Promise<string>;
    scaleRole(name: string, role: string, numInstances: number, stamp: string): Promise<string>;
    undeploy(name: string, stamp: string): Promise<DeploymentInstanceInfo[]>;
    private createDeploymentResources;
    private createDeploymentParameters;
    private getComponentParameters;
    private processParametersDefaultValues;
    private processResourcesDefaultValues;
    private getRole;
}
