/// <reference types="node" />
import * as child_process from 'child_process';
import { Deployment } from '@kumori/admission-client';
export declare const DEFAULT_CONFIG_FILE = "kumoriConfig.json";
export declare const configuration: {
    configFileName: string;
};
export declare let question: any;
export declare const mkdir: any;
export declare const httpDel: any;
export declare const httpPost: any;
export declare const httpGet: any;
export declare const httpHead: any;
export declare const access: any;
export declare const stampPost: (path: string, stamp: string, op: string) => Promise<any>;
export interface StampStatus {
    successful: boolean;
    code: number;
}
export interface StampConfig {
    admission: string;
    token?: string;
}
export declare function checkStamp(stamp: string, exitOnFail?: boolean): Promise<StampStatus>;
export declare const getStampStatus: (stamp: string) => Promise<StampStatus>;
export declare function writeEmptyConfigFile(): void;
export declare function overwriteConfigFile(newConfig: any): void;
export declare function setupQuestionForTest(): void;
export declare function readConfigFile(): any;
export declare function startupCheck(): any;
export declare function getStampUrl(stamp: string): string;
export declare function processDeploymentsInfo(dep: Deployment): {
    name: string;
    entrypoints: any[];
};
export interface ECloudNameParts {
    protocol: string;
    domain: string;
    type: string;
    path: string;
    version: string;
}
export declare function parseEcloudURN(urn: string): ECloudNameParts;
export declare function createPath(dir: string): boolean;
export declare function createElementFromTemplate(source: string, destination: string, config: Object): Promise<void>;
export declare function deleteFolder(dir: string): boolean;
export declare function getJSON(filepath: string): any;
export declare function writeJSON(filepath: string, data: string): void;
export declare enum ParameterType {
    BOOLEAN = 1,
    INTEGER = 2,
    JSON = 3,
    LIST = 4,
    NUMBER = 5,
    STRING = 6,
    VHOST = 7
}
export interface Parameter {
    name: string;
    type: ParameterType;
    default?: boolean | number | string | Object;
}
export declare enum ResourceType {
    CERT_CLIENT = 1,
    CERT_SERVER = 2,
    FAULT_GROUP = 3,
    VHOST = 4,
    VOLUME_PERSITENT = 5,
    VOLUME_VOLATILE = 6
}
export interface ResourceData {
    name: string;
    type: ResourceType;
}
export declare function processResources(rawResources: any[]): ResourceData[];
export declare function processParameters(rawParams: any[]): Parameter[];
export declare function executeProgram(command: string, args: string[], options: child_process.SpawnOptions): Promise<void>;
export declare function createBundleFile(targetFile: string, sourceFiles?: string[], blobs?: {
    pathInZip: string;
    data: Buffer;
}[]): Promise<string>;
