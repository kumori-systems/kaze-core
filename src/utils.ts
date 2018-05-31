import * as denodeify from 'denodeify';
import * as fs from 'fs';
import * as read from 'read';
import * as request from 'request';
import * as path from 'path';
import * as mkdirp from 'mkdirp'
import * as dot from 'dot';
import { ncp } from 'ncp';
import * as rimraf from 'rimraf';
import * as vm from 'vm';
import * as child_process from 'child_process';
import * as archiver from 'archiver';
import { Deployment } from '@kumori/admission-client';

export const DEFAULT_CONFIG_FILE = 'kumoriConfig.json'
export const configuration = {
  configFileName: DEFAULT_CONFIG_FILE
}

interface AdmissionOptions {
  auth?: {
    bearer?: string
  }
  uri?: string
  formData?: {
    bundlesZip?: fs.ReadStream
  }
}

export let question = denodeify(read);
export const mkdir = denodeify(mkdirp);
export const httpDel = denodeify(request.delete)
export const httpPost = denodeify(request.post);
export const httpGet = denodeify(request.get);
export const httpHead = denodeify(request.head);
export const access = denodeify(fs.access);
export const stampPost = async function register(path: string, stamp: string, op: string) {
  try {
    let workspaceConfig = readConfigFile();
    let stampConfig:StampConfig = workspaceConfig.stamps[stamp]
    if (!stampConfig) {
      return Promise.reject({
        err: `Stamp ${stamp} not found`
      })
    }
    let opts: AdmissionOptions = {
      uri: `${stampConfig.admission}/admission/bundles`,
      formData: {
        bundlesZip: fs.createReadStream(path)
      }
    }
    if (stampConfig && stampConfig.token) {
      opts.auth = {
        bearer: stampConfig.token
      }
    }
    let response = await httpPost(opts);
    let responseJson = JSON.parse(response.body);
    // console.log('Workspace|Utils|stampPost|response: ' + response.body);
    return Promise.resolve(responseJson);
  } catch(error) {
    // console.log("Error:", error);
    let message = error.code ? error.code : (error.message ? error.message : error)
    // console.error('Workspace|Utils|stampPost|Error: ' + message);
    return Promise.reject({
      err: `${op} operation failed in ${stamp}`,
      additionalInfo: message
    });
  }
}

export interface StampStatus {
  successful: boolean;
  code: number;
}

export interface StampConfig {
  admission: string
  token?: string
}

export async function checkStamp (stamp: string, exitOnFail: boolean = true): Promise<StampStatus> {
  let base = `Stamp "${stamp}"`;
  let status: StampStatus;
  if (!stamp) {
    console.log("Target stamp not found");
    status = {
      successful: false,
      code: undefined
    };
  } else {
    status = await getStampStatus(stamp);
    if (!status.successful) {
      if (!status.code) {
        console.log(`\n${base} is not available. If it is a Local Stamp, try\n\n    kaze localstamp start\n`);
      } else if (status.code == 500) {
        console.log(`\n${base} internal error. Check if the registered url uses "http" but the stamp expects "https".\n`);
      } else {
        console.log(`\n${base} returns code ${status.code}. If it is a Local Stamp, try\n\n    kaze localstamp restart\n\n`);
      }
    }
  }
  if (!status.successful && exitOnFail) {
    process.exit(1);
  }

  return status;
}

export const getStampStatus = async function(stamp: string): Promise<StampStatus> {
  try {
    let workspaceConfig = readConfigFile();
    let stampConfig = workspaceConfig.stamps[stamp]
    let opts: AdmissionOptions = {}
    if (stampConfig && stampConfig.token) {
      opts.auth = {
        bearer: stampConfig.token
      }
    }
    // console.log('Workspace|Utils|getStampStatus|response: ' + JSON.stringify(opts));
    let result = await httpHead(`${stampConfig.admission}/admission/deployments`, opts);
    // console.log('Workspace|Utils|getStampStatus|response: ' + result.body);
    if (result.statusCode == 200) {
      return {
        successful: true,
        code: 200
      }
    } else {
      return {
        successful: false,
        code: result.statusCode
      }
    }
  } catch(error) {
    return {
      successful: false,
      code: undefined
    }
  }
}

export function writeEmptyConfigFile() {
  const config = {
    "working-stamp": "localstamp",
    "domain": "domain.com",
    "component": {
      "template": "javascript"
    },
    "deployment": {
      "template": "basic"
    },
    "resource": {
      "template": "vhost"
    },
    "runtime": {
      "template": "basic",
      "parent": "eslap://eslap.cloud/runtime/native/2_0_0",
      "folder": "/eslap/component",
      "entrypoint": "/eslap/runtime-agent/scripts/start-runtime-agent.sh"
    },
    "service": {
      "template": "basic"
    },
    "stamps": {
      "localstamp": {
        "admission": "http://localhost:8090"
      },
      "baco": {
        "admission": "https://admission.baco.kumori.cloud"
      }
    }
  };
  overwriteConfigFile(config);
}

export function overwriteConfigFile(newConfig: any) {
  fs.writeFileSync(configuration.configFileName, JSON.stringify(newConfig, null, 4));
}

export function setupQuestionForTest() {
  question = function() {
    return 'test';
  };
}

export function readConfigFile() {
  const configPath = path.join(process.cwd(), configuration.configFileName);
  let data = fs.readFileSync(require.resolve(configPath));
  return JSON.parse(data.toString());
}

export function startupCheck() {
  const configPath = path.join(process.cwd(), configuration.configFileName);
  if (fs.existsSync(configPath)) {
    return readConfigFile();
  } else {
    console.error('You need to initialize first current workspace by using the "init" command');
    process.exit(1);
  }
}

export function getStampUrl(stamp: string): string {
  let config = startupCheck();
  let stampName = stamp ? stamp : config['working-stamp']
  let stampUrl: string = undefined;
  if (stampName && config.stamps && config.stamps[stampName]) {
    stampUrl = config.stamps[stampName].admission;
  }
  return stampUrl;
}

export function processDeploymentsInfo(dep: Deployment) {
  console.log(`\nDeployment "${dep.urn}" data:\n`)
  let depResult = {
    name: dep.urn,
    entrypoints: []
  }
  console.log(`* Deployment URN: ${dep.urn}`);
  if (dep.roles) {
    for (let role in dep.roles) {
      if (dep.roles[role].entrypoint && dep.roles[role].entrypoint.domain) {
        let epUrl = dep.roles[role].entrypoint.domain;
        let entrypoint = {
          role: role,
          domain: epUrl
        }
        depResult.entrypoints.push(entrypoint);
        console.log(`* Deployment entrypoint: ${role}: ${epUrl}`);
      }
    }
  }
  return depResult;
}

export interface ECloudNameParts {
  protocol: string;
  domain: string;
  type: string;
  path: string;
  version: string;
}

export function parseEcloudURN(urn: string): ECloudNameParts {
  let result: ECloudNameParts = {
    protocol: undefined,
    domain: undefined,
    type: undefined,
    path: undefined,
    version: undefined,
  }

  if (!urn) {
    throw new Error(`URN undefined`);
  }

  let parts = urn.split('/');

  if (parts.length < 6) {
    throw new Error(`URN "${urn}": wrong format`);
  }

  if (parts[0] != 'eslap:') {
    throw new Error(`URN "${urn}": wrong protocol ${parts[0]}`);
  }

  result.protocol = 'eslap';

  if (parts[1].length != 0) {
    throw new Error(`URN "${urn}": wrong format`);
  }

  if (parts[2].length == 0) {
    throw new Error(`URN "${urn}": domain is empty`);
  }

  result.domain = parts[2];

  if (parts[3].length == 0) {
    throw new Error(`URN "${urn}": wrong format`);
  }

  result.type = parts[3];

  let i = 4;
  result.path = '';
  for (; i < (parts.length-1); i++) {
    result.path += parts[i];
  }

  if (result.path.length == 0) {
    throw new Error(`URN "${urn}": wrong format`);
  }

  if (parts[i].length == 0) {
    throw new Error(`URN "${urn}": wrong version "${parts[i]}`);
  }

  result.version = parts[i];

  return result;
}

export function createPath(dir: string): boolean {
  let dirPath = path.join('.', dir);
  try {
    let stats = fs.statSync(dir);
    if (stats.isDirectory()) {
      console.log(`Directory "${dir}" already exists, skipping.`);
    } else {
      console.log(`Directory "${dir}" already exists and is not a directory, skipping.`);
    }
    return false;
  } catch(error) {
    mkdirp.sync(dirPath);
  }
  return true;
}

export function createElementFromTemplate(source: string, destination: string, config: Object): Promise<void> {

  return new Promise((resolve, reject) => {
    try {
      dot.templateSettings.strip = false;

      let templates = new Array();

      let options = {
        filter: (filename) => {
          let ext = filename.substring(filename.length-4);
          if (ext == '.dot') {
            templates.push(filename);
            return false;
          } else {
            return true;
          }
        }
      }

      ncp(source, destination, options, function (error) {
        if (error) {
          if (error[0] && (error[0].code == 'ENOENT')) {
            reject('Template not found');
          } else {
            reject(error);
          }
        }
        let promises: Promise<string>[] = [];
        for (let file of templates) {
          promises.push(applyTemplate(file, source, destination, config));
        }
        Promise.all(promises)
        .then(() => {resolve();})
        .catch((error) => {reject(error)});
      });
    } catch(error) {
      reject(error);
    }
  })
}

function applyTemplate(file:string, source:string, destination:string, config:Object): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      let relative = file.substring(source.length+1);
      console.log('relative ', relative);
      let destFile = `${destination}/${relative.substring(0,relative.length-4)}`;
      let readStream = fs.createReadStream(file);
      let writeStream = fs.createWriteStream(destFile);
      let data = '';
      readStream.on('data', (chunk) => {
        data = `${data}${chunk}`;
        let idx1 = data.lastIndexOf('{{=');
        let idx2 = data.lastIndexOf('}}');
        if (idx1 <= idx2) {
          data = dot.template(data)(config);
          writeStream.write(data);
          data = '';
        }
      });
      readStream.on('end', ()=> {
        resolve(destFile);
      })
      readStream.on('error', (error) => {
        reject(error);
      })
    } catch(error) {
      reject(error);
    }
  });
}

export function deleteFolder(dir: string): boolean {
  let dirPath = path.join('.', dir);
  try {
    let stats = fs.statSync(dir);
    if (stats.isDirectory()) {
      rimraf.sync(dirPath);
      return true;
    } else {
      console.log(`"${dir}" is not a directory, skipping.`);
      return false;
    }
  } catch(error) {
    return false;
  }
}

export function getJSON(filepath: string): any {
  const jsonString = "g = " + fs.readFileSync(filepath, 'utf8') + "; g";
  return (new vm.Script(jsonString)).runInNewContext();
}

export function writeJSON(filepath: string, data: string){
  fs.writeFileSync(filepath, data, 'utf8');
}

export enum ParameterType {
  BOOLEAN = 1,
  INTEGER,
  JSON,
  LIST,
  NUMBER,
  STRING,
  VHOST
}

export interface Parameter {
  name: string,
  type: ParameterType,
  default?: boolean | number | string | Object
}

export enum ResourceType {
  CERT_CLIENT = 1,
  CERT_SERVER,
  FAULT_GROUP,
  VHOST,
  VOLUME_PERSITENT,
  VOLUME_VOLATILE
}

export interface Resource {
  name: string,
  type: ResourceType
}

export function processResources(rawResources: any[]): Resource[] {
  let resources:Resource[] = [];
  for (let res of rawResources) {
    let type:ResourceType;
    switch (res.type) {
      case 'eslap://eslap.cloud/resource/cert/client/1_0_0':
        type = ResourceType.CERT_CLIENT;
        break;
      case 'eslap://eslap.cloud/resource/cert/server/1_0_0':
        type = ResourceType.CERT_SERVER;
        break;
      case 'eslap://eslap.cloud/resource/faultgroups/1_0_0':
        type = ResourceType.FAULT_GROUP;
        break;
      case 'eslap://eslap.cloud/resource/vhost/1_0_0':
        type = ResourceType.VHOST;
        break;
      case 'eslap://eslap.cloud/resource/volume/persistent/1_0_0':
        type = ResourceType.VOLUME_PERSITENT;
        break;
      case 'eslap://eslap.cloud/resource/disk/1_0_0':
        type = ResourceType.VOLUME_PERSITENT;
        break;
      case 'eslap://eslap.cloud/resource/volume/volatile/1_0_0':
        type = ResourceType.VOLUME_VOLATILE;
        break;
    }
    let resource:Resource = {
      name: res.name,
      type: type
    }
    resources.push(resource);
  }
  return resources;
}

export function processParameters(rawParams: any[]): Parameter[] {
  let parameters:Parameter[] = [];
  for (let param of rawParams) {
    let type:ParameterType;
    switch (param.type) {
      case 'eslap://eslap.cloud/parameter/boolean/1_0_0':
        type = ParameterType.BOOLEAN;
        break;
      case 'eslap://eslap.cloud/parameter/integer/1_0_0':
        type = ParameterType.INTEGER;
        break;
      case 'eslap://eslap.cloud/parameter/json/1_0_0':
        type = ParameterType.JSON;
        break;
      case 'eslap://eslap.cloud/parameter/list/1_0_0':
        type = ParameterType.LIST;
        break;
      case 'eslap://eslap.cloud/parameter/number/1_0_0':
        type = ParameterType.NUMBER;
        break;
      case 'eslap://eslap.cloud/parameter/string/1_0_0':
        type = ParameterType.STRING;
        break;
      case 'eslap://eslap.cloud/parameter/vhost/1_0_0':
        type = ParameterType.VHOST;
        break;
    }
    let parameter:Parameter = {
      name: param.name,
      type: type
    }
    parameters.push(parameter);
  }
  return parameters;
}

export function executeProgram(command: string, args:string[], options:child_process.SpawnOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    let proc = child_process.spawn(command, args, options);
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
    proc.on('close', (code) => {
      if (code != 0) {
        reject(new Error(`child process exited with code ${code}`));
      } else {
        resolve();
      }
    })
  })
}

// Creates the bundle file containing the manifest and the Docker runtime image
export function createBundleFile(targetFile: string, sourceFiles: string[]): Promise<string> {

    return new Promise((resolve, reject) => {

      try {

        // Create an archiver and the output stream with the target file
        let archive = archiver('zip', {
          zlib: { level: 9 } // Sets the compression level.
        });
        let output = fs.createWriteStream(targetFile);

        // listen for all archive data to be written
        // 'close' event is fired only when a file descriptor is involved
        output.on('close', function() {
          resolve(targetFile);
        });

        // This event is fired when the data source is drained no matter what was the data source.
        // It is not part of this library but rather from the NodeJS Stream API.
        // @see: https://nodejs.org/api/stream.html#stream_event_end
        output.on('end', function() {
          // console.log('Data has been drained');
          resolve(targetFile);
        });

        // Manages warnings (ie stat failures and other non-blocking errors)
        archive.on('warning', function(err) {
          reject(err);
        });

        // Manages errors
        archive.on('error', function(err) {
          reject(err);
        });

        // Pipes archive data to the file
        archive.pipe(output);

        // Appends the files included in the bundle
        for (let i in sourceFiles) {
          let folder = `folder${i}`;
          let filepath = sourceFiles[i];
          let stats = fs.statSync(filepath);
          if (stats.isFile()) {
            let basename = path.basename(filepath);
            archive.append(fs.createReadStream(filepath), { name: `${folder}/${basename}` });
          } else if (stats.isDirectory()){
            archive.directory(filepath, `${folder}`);
          }
        }

        // Finalize the archive (ie we are done appending files but streams have to
        // finish yet)
        // 'close', 'end' or 'finish' may be fired right after calling this method so
        // register to them beforehand
        archive.finalize();
      } catch(error) {
        let message = ((error & error.message) ? error.message : error.toString() );
        reject(`Error bundeling ${targetFile}: ${message}`);
      }
    });
  }