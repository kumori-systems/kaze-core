import * as utils from './utils';
import { Deployment, StampStubFactory, RegistrationResult } from './stamp-manager';
export declare class Stamp {
    private stampStubFactory;
    constructor(stampStubFactory: StampStubFactory);
    add(id: string, stampConfig: utils.StampConfig, defaultStamp: boolean): void;
    update(id: string, stampConfig: utils.StampConfig): void;
    remove(id: string): void;
    use(id: string): void;
    isRegistered(stamp: string, name: string): Promise<boolean>;
    get(stamp: string): utils.StampConfig;
    isDefault(name: string): boolean;
    /**
     * Registers a bundle in a target stamp.
     *
     * @param stamp The stamp id as registered in the configuration file
     * @param bundle The path to the bundle to be registred
     * @returns The result returned by the stamp.
     */
    register(stamp: string, bundle: string): Promise<RegistrationResult>;
    unregister(stamp: string, urn: string): Promise<boolean>;
    findDeployments(stamp: string, urn?: string, owner?: string): Promise<{
        [key: string]: Deployment;
    }>;
    private _getStampConfig;
}
