import { startupCheck } from './utils';
// import { runTemplate } from './templates';
import { runTemplate } from './template-managers/yo';

export interface ProjectConfig {
  domain: string;
  name: string;
}

export class Project {

  private rootPath: string;
  private workspacePath: string;

  constructor(workspacePath?: string) {
    this.workspacePath = (workspacePath ? workspacePath : '.');
    this.rootPath = `${this.workspacePath}`;
  }

  public async add(template: string, config: ProjectConfig): Promise<string> {
    startupCheck();
    await runTemplate(template, this.rootPath, config)
    return this.rootPath
  }
}