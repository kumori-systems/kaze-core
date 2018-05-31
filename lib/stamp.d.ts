import * as utils from './utils';
import { RegistrationResult } from '@kumori/admission-client';
export declare class Stamp {
    add(id: string, stampConfig: utils.StampConfig, defaultStamp: boolean): void;
    update(id: string, stampConfig: utils.StampConfig): void;
    remove(id: string): void;
    use(id: string): void;
    isRegistered(stamp: string, name: string): Promise<boolean>;
    get(stamp: string): utils.StampConfig;
    isDefault(name: string): boolean;
    register(stamp: string, bundle: string): Promise<RegistrationResult>;
}
