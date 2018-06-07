export interface RuntimeConfig {
    name: string;
    domain: string;
    parent?: string;
    componentFolder?: string;
    entrypoint?: string;
}
export declare class Runtime {
    private rootPath;
    private templatesPath;
    private workspacePath;
    constructor(workspacePath?: string, templatesPath?: string);
    add(template: string, config: RuntimeConfig): Promise<string>;
    build(config: RuntimeConfig): void;
    generateUrn(name: string, domain: string, version: string): string;
    install(urn: string): any;
}
export declare function addCommand(template: string, config: RuntimeConfig): Promise<string>;
export declare function buildCommand(config: RuntimeConfig): void;
