export interface RuntimeConfig {
    name: string;
    domain: string;
    parent?: string;
    componentFolder?: string;
    entrypoint?: string;
}
export declare class Runtime {
    private rootPath;
    private workspacePath;
    constructor(workspacePath?: string);
    add(template: string, config: RuntimeConfig): Promise<string>;
    build(config: RuntimeConfig): void;
    generateUrn(name: string, domain: string, version: string): string;
    install(urn: string): Promise<any>;
}
export declare function addCommand(template: string, config: RuntimeConfig): Promise<string>;
export declare function buildCommand(config: RuntimeConfig): void;
