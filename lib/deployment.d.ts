import { ServiceConfig } from './service';
export interface DeploymentConfig {
    name: string;
    service: ServiceConfig;
}
export declare class Deployment {
    private rootPath;
    private templatesPath;
    private workspacePath;
    constructor(workspacePath?: string, templatesPath?: string);
    add(template: string, config: DeploymentConfig): Promise<string>;
    getManifest(name: string): any;
    updateManifest(name: string, manifest: any): any;
    getService(name: string): ServiceConfig;
    getDistributableFile(name: string): Promise<string>;
    scaleRole(name: string, role: string, numInstances: number, stamp: string): Promise<string>;
    undeploy(name: string, stamp: string): Promise<import("../node_modules/@kumori/admission-client/lib/deployment-instance-info").DeploymentInstanceInfo[]>;
    private createDeploymentResources;
    private createDeploymentParameters;
    private getComponentParameters;
    private processParametersDefaultValues;
    private processResourcesDefaultValues;
    private getRole;
}
