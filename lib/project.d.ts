export interface ProjectConfig {
    domain: string;
    name: string;
}
export declare class Project {
    private rootPath;
    private workspacePath;
    constructor(workspacePath?: string);
    add(template: string, config: ProjectConfig): Promise<string>;
}
