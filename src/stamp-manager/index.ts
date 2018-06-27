import { AdmissionClient, FileStream, RegistrationResult } from "@kumori/admission-client"
export { FileStream, RegistrationResult } from "@kumori/admission-client"

export interface StampStub {
    findStorage(): Promise<string[]>
    sendBundle(bundlesZip?: FileStream, bundlesJson?: FileStream): Promise<RegistrationResult>
    getStorageManifest(urn: string): Promise<any>
    removeStorage(urn: string): Promise<any>
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