import { Parameter } from './utils';
export interface ComponentConfig {
    domain: string;
    name: string;
    version?: string;
}
export declare class Component {
    private rootPath;
    private templatesPath;
    private workspacePath;
    constructor(workspacePath?: string, templatesPath?: string);
    add(template: string, config: ComponentConfig): Promise<string>;
    install(config: ComponentConfig, rootPath?: string): Promise<string>;
    build(config: ComponentConfig): Promise<string>;
    getParameters(config: ComponentConfig): Parameter[];
    getManifest(config: ComponentConfig): any;
    parseName(urn: string): ComponentConfig;
    getDistributableFile(config: ComponentConfig): Promise<string>;
    checkVersion(config: ComponentConfig): Promise<boolean>;
    getCurrentVersion(config: ComponentConfig): Promise<string>;
}
