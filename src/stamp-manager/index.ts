import {
    AdmissionClient,
    DeploymentInstanceInfo,
    DeploymentModification,
    FileStream,
    RegistrationResult
} from "@kumori/admission-client"

export {
    DeploymentInstanceInfo,
    DeploymentModification,
    FileStream,
    RegistrationResult,
    ScalingDeploymentModification
} from "@kumori/admission-client"

export interface StampStub {
    findStorage(): Promise<string[]>
    getStorageManifest(urn: string): Promise<any>
    modifyDeployment (configuration: DeploymentModification): Promise<any>
    removeStorage(urn: string): Promise<any>
    sendBundle(bundlesZip?: FileStream, bundlesJson?: FileStream): Promise<RegistrationResult>
    undeploy (urn: string): Promise<DeploymentInstanceInfo[]>
}

export interface StampStubFactory {
    getStub(basePath: string, accessToken?: string): StampStub
}

export class StampStubImpl extends AdmissionClient implements StampStub {
}

export class StampStubFactoryImpl implements StampStubFactory {
    public getStub (basePath: string, accessToken?: string): StampStub {
        return new StampStubImpl(basePath, accessToken)
    }
}