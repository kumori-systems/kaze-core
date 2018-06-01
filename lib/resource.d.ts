export interface ResourceConfig {
    domain: string;
    name: string;
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
export declare class Resource {
    private rootPath;
    private templatesPath;
    private workspacePath;
    constructor(workspacePath?: string, templatesPath?: string);
    getRootPath(): string;
    add(template: string, config: ResourceConfig): Promise<string>;
    getManifest(config: ResourceConfig): any;
    parseName(urn: string): ResourceConfig;
    getDistributableFile(config: ResourceConfig): Promise<string>;
    generateUrn(name: string, domain: string): any;
}
