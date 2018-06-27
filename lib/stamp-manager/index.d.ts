import { AdmissionClient, Deployment, DeploymentInstanceInfo, DeploymentModification, FileStream, RegistrationResult } from "@kumori/admission-client";
export { Deployment, DeploymentInstanceInfo, DeploymentModification, FileStream, RegistrationResult, ScalingDeploymentModification } from "@kumori/admission-client";
export interface StampStub {
    findDeployments(urn?: string, owner?: string): Promise<{
        [key: string]: Deployment;
    }>;
    findStorage(): Promise<string[]>;
    getStorageManifest(urn: string): Promise<any>;
    modifyDeployment(configuration: DeploymentModification): Promise<any>;
    removeStorage(urn: string): Promise<any>;
    sendBundle(bundlesZip?: FileStream, bundlesJson?: FileStream): Promise<RegistrationResult>;
    undeploy(urn: string): Promise<DeploymentInstanceInfo[]>;
}
export interface StampStubFactory {
    getStub(basePath: string, accessToken?: string): StampStub;
}
export declare class StampStubImpl extends AdmissionClient implements StampStub {
}
export declare class StampStubFactoryImpl implements StampStubFactory {
    getStub(basePath: string, accessToken?: string): StampStub;
}
