import { Component, ComponentConfig } from './component';
import { Deployment, DeploymentConfig } from './deployment';
import { Service, ServiceConfig } from './service';
import { LocalStamp} from './localstamp';
import { Runtime } from './runtime';
export { IError } from './interface';
import { Workspace } from './workspace';
import { Stamp } from './stamp';

export const workspace = new Workspace(new Component(), new Deployment()
  , new LocalStamp(), new Runtime(), new Service(), new Stamp());
