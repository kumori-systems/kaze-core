import { Component } from './component';
import { Deployment } from './deployment';
import { Service } from './service';
import { Resource } from './resource';
import { LocalStamp} from './localstamp';
import { Runtime } from './runtime';
export { IError } from './interface';
import { Workspace } from './workspace';
import { Project } from './project';
import { Stamp } from './stamp';
export { StampConfig, configuration } from './utils';
export { Deployment, DeploymentInstanceInfo, RegistrationResult } from '@kumori/admission-client';
export { ComponentConfig } from './component';
export { ServiceConfig } from './service';
export { DeploymentConfig } from './deployment';
export { RuntimeConfig } from './runtime';
export { ResourceConfig } from './resource';
import { StampStubFactoryImpl } from './stamp-manager'

export const workspace = new Workspace(new Component(),
                                       new Deployment(new StampStubFactoryImpl()),
                                       new LocalStamp(),
                                       new Runtime(),
                                       new Service(),
                                       new Resource(),
                                       new Project(),
                                       new Stamp(new StampStubFactoryImpl()));
