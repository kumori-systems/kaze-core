export interface RuntimeConfig {
    name: string;
    domain: string;
    parent?: string;
    componentFolder?: string;
    entrypoint?: string;
}
interface bundleFunction {
    (runtimeFolder: string, manifestPath: string, targetFile: string): Promise<void>;
}
interface installFunction {
    (urn: string): Promise<any>;
}
export interface RuntimeStub {
    bundle: bundleFunction;
    install: installFunction;
}
export declare class Runtime {
    private rootPath;
    private workspacePath;
    private runtimeStub;
    constructor(workspacePath?: string, runtimeStub?: RuntimeStub);
    add(template: string, config: RuntimeConfig): Promise<string>;
    build(config: RuntimeConfig): Promise<void>;
    generateUrn(name: string, domain: string, version: string): string;
    install(urn: string): Promise<any>;
}
export declare function addCommand(template: string, config: RuntimeConfig): Promise<string>;
export declare function buildCommand(config: RuntimeConfig): void;
export {};
