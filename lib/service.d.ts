import { Parameter, Resource } from './utils';
export interface ServiceConfig {
    domain: string;
    name: string;
    version?: string;
}
export interface Role {
    name: string;
    component: string;
}
export interface Channel {
    name: string;
    type: string;
    protocol: string;
}
export declare class Service {
    private rootPath;
    private templatesPath;
    private workspacePath;
    constructor(workspacePath?: string, templatesPath?: string);
    getRootPath(): string;
    add(template: string, config: ServiceConfig): Promise<string>;
    getRoles(config: ServiceConfig): Role[];
    getProvidedChannels(config: ServiceConfig): Channel[];
    getRequiredChannels(config: ServiceConfig): Channel[];
    getParameters(config: ServiceConfig): Parameter[];
    getResources(config: ServiceConfig): Resource[];
    getManifest(config: ServiceConfig): any;
    parseName(urn: string): ServiceConfig;
    getComponents(config: ServiceConfig): string[];
    getDistributableFile(config: ServiceConfig): Promise<string>;
    checkVersion(config: ServiceConfig): Promise<boolean>;
    getCurrentVersion(config: ServiceConfig): Promise<string>;
    generateGenericInbound(config: ServiceConfig, channel: Channel, inboundsDomain: string, deployUuid: string): Promise<void>;
}
