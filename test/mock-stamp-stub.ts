import {
    Deployment,
    DeploymentInstanceInfo,
    DeploymentModification,
    StampStubFactory,
    StampStub,
    FileStream,
    RegistrationResult
  } from '../lib/stamp-manager'

export const MOCK_URN ='eslap://mock.urn/'
export const MOCK_RESPONSE = 'mock response'

class MockAdmissionClient {
    findStorage(): Promise<string[]> {
        return Promise.resolve(['mockElement'])
    }

    findDeployments (urn?: string, owner?: string): Promise<{[key: string]:Deployment}> {
        return Promise.resolve({})
    }

    sendBundle(bundlesZip?: FileStream, bundlesJson?: FileStream): Promise<RegistrationResult> {
        let result:RegistrationResult = {
            successful: [],
            errors: [],
            deployments: {
                successful: [],
                errors: []
            },
            links: {},
            tests: {},
            testToken: ''
        }
        return Promise.resolve(result)
    }

    getStorageManifest(urn: string): Promise<any> {
        return Promise.reject(new Error('Not implemented'))
    }

    removeStorage(urn: string): Promise<any> {
        if (urn && (urn.localeCompare(MOCK_URN) == 0)) {
            return Promise.resolve(true)
        } else {
            return Promise.reject(new Error(' Error code 23 - Rsync command'))
        }
    }

    modifyDeployment (configuration: DeploymentModification): Promise<any> {
        if (configuration.deploymentURN.localeCompare(MOCK_URN) == 0) {
            return Promise.resolve(MOCK_RESPONSE)
        } else {
            return Promise.reject('Element not found')
        }
    }

    undeploy (urn: string): Promise<DeploymentInstanceInfo[]> {
        if (urn.localeCompare(MOCK_URN) == 0) {
            return Promise.resolve([])
        } else {
            return Promise.reject('Element not found')
        }
    }
}

export class MockStampStubFactory implements StampStubFactory {
    public getStub(basePath: string, accessToken?: string): StampStub {
        return new MockAdmissionClient()
    }
}