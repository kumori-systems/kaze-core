"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const denodeify = require("denodeify");
const fs = require("fs");
const read = require("read");
const request = require("request");
const path = require("path");
const mkdirp = require("mkdirp");
const dot = require("dot");
const ncp_1 = require("ncp");
const rimraf = require("rimraf");
const vm = require("vm");
const child_process = require("child_process");
const archiver = require("archiver");
exports.DEFAULT_CONFIG_FILE = 'kumoriConfig.json';
exports.configuration = {
    configFileName: exports.DEFAULT_CONFIG_FILE
};
exports.question = denodeify(read);
exports.mkdir = denodeify(mkdirp);
exports.httpDel = denodeify(request.delete);
exports.httpPost = denodeify(request.post);
exports.httpGet = denodeify(request.get);
exports.httpHead = denodeify(request.head);
exports.access = denodeify(fs.access);
exports.stampPost = function register(path, stamp, op) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let workspaceConfig = readConfigFile();
            let stampConfig = workspaceConfig.stamps[stamp];
            if (!stampConfig) {
                return Promise.reject({
                    err: `Stamp ${stamp} not found`
                });
            }
            let opts = {
                uri: `${stampConfig.admission}/admission/bundles`,
                formData: {
                    bundlesZip: fs.createReadStream(path)
                }
            };
            if (stampConfig && stampConfig.token) {
                opts.auth = {
                    bearer: stampConfig.token
                };
            }
            let response = yield exports.httpPost(opts);
            let responseJson = JSON.parse(response.body);
            // console.log('Workspace|Utils|stampPost|response: ' + response.body);
            return Promise.resolve(responseJson);
        }
        catch (error) {
            // console.log("Error:", error);
            let message = error.code ? error.code : (error.message ? error.message : error);
            // console.error('Workspace|Utils|stampPost|Error: ' + message);
            return Promise.reject({
                err: `${op} operation failed in ${stamp}`,
                additionalInfo: message
            });
        }
    });
};
function checkStamp(stamp, exitOnFail = true) {
    return __awaiter(this, void 0, void 0, function* () {
        let base = `Stamp "${stamp}"`;
        let status;
        if (!stamp) {
            console.log("Target stamp not found");
            status = {
                successful: false,
                code: undefined
            };
        }
        else {
            status = yield exports.getStampStatus(stamp);
            if (!status.successful) {
                if (!status.code) {
                    console.log(`\n${base} is not available. If it is a Local Stamp, try\n\n    kaze localstamp start\n`);
                }
                else if (status.code == 500) {
                    console.log(`\n${base} internal error. Check if the registered url uses "http" but the stamp expects "https".\n`);
                }
                else {
                    console.log(`\n${base} returns code ${status.code}. If it is a Local Stamp, try\n\n    kaze localstamp restart\n\n`);
                }
            }
        }
        if (!status.successful && exitOnFail) {
            process.exit(1);
        }
        return status;
    });
}
exports.checkStamp = checkStamp;
exports.getStampStatus = function (stamp) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let workspaceConfig = readConfigFile();
            let stampConfig = workspaceConfig.stamps[stamp];
            let opts = {};
            if (stampConfig && stampConfig.token) {
                opts.auth = {
                    bearer: stampConfig.token
                };
            }
            // console.log('Workspace|Utils|getStampStatus|response: ' + JSON.stringify(opts));
            let result = yield exports.httpHead(`${stampConfig.admission}/admission/deployments`, opts);
            // console.log('Workspace|Utils|getStampStatus|response: ' + result.body);
            if (result.statusCode == 200) {
                return {
                    successful: true,
                    code: 200
                };
            }
            else {
                return {
                    successful: false,
                    code: result.statusCode
                };
            }
        }
        catch (error) {
            return {
                successful: false,
                code: undefined
            };
        }
    });
};
function writeEmptyConfigFile() {
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
exports.writeEmptyConfigFile = writeEmptyConfigFile;
function overwriteConfigFile(newConfig) {
    fs.writeFileSync(exports.configuration.configFileName, JSON.stringify(newConfig, null, 4));
}
exports.overwriteConfigFile = overwriteConfigFile;
function setupQuestionForTest() {
    exports.question = function () {
        return 'test';
    };
}
exports.setupQuestionForTest = setupQuestionForTest;
function readConfigFile() {
    const configPath = path.join(process.cwd(), exports.configuration.configFileName);
    let data = fs.readFileSync(require.resolve(configPath));
    return JSON.parse(data.toString());
}
exports.readConfigFile = readConfigFile;
function startupCheck() {
    const configPath = path.join(process.cwd(), exports.configuration.configFileName);
    if (fs.existsSync(configPath)) {
        return readConfigFile();
    }
    else {
        console.error('You need to initialize first current workspace by using the "init" command');
        process.exit(1);
    }
}
exports.startupCheck = startupCheck;
function getStampUrl(stamp) {
    let config = startupCheck();
    let stampName = stamp ? stamp : config['working-stamp'];
    let stampUrl = undefined;
    if (stampName && config.stamps && config.stamps[stampName]) {
        stampUrl = config.stamps[stampName].admission;
    }
    return stampUrl;
}
exports.getStampUrl = getStampUrl;
function processDeploymentsInfo(dep) {
    console.log(`\nDeployment "${dep.urn}" data:\n`);
    let depResult = {
        name: dep.urn,
        entrypoints: []
    };
    console.log(`* Deployment URN: ${dep.urn}`);
    if (dep.roles) {
        for (let role in dep.roles) {
            if (dep.roles[role].entrypoint && dep.roles[role].entrypoint.domain) {
                let epUrl = dep.roles[role].entrypoint.domain;
                let entrypoint = {
                    role: role,
                    domain: epUrl
                };
                depResult.entrypoints.push(entrypoint);
                console.log(`* Deployment entrypoint: ${role}: ${epUrl}`);
            }
        }
    }
    return depResult;
}
exports.processDeploymentsInfo = processDeploymentsInfo;
function parseEcloudURN(urn) {
    let result = {
        protocol: undefined,
        domain: undefined,
        type: undefined,
        path: undefined,
        version: undefined,
    };
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
    for (; i < (parts.length - 1); i++) {
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
exports.parseEcloudURN = parseEcloudURN;
function createPath(dir) {
    let dirPath = path.join('.', dir);
    try {
        let stats = fs.statSync(dir);
        if (stats.isDirectory()) {
            console.log(`Directory "${dir}" already exists, skipping.`);
        }
        else {
            console.log(`Directory "${dir}" already exists and is not a directory, skipping.`);
        }
        return false;
    }
    catch (error) {
        mkdirp.sync(dirPath);
    }
    return true;
}
exports.createPath = createPath;
function createElementFromTemplate(source, destination, config) {
    return new Promise((resolve, reject) => {
        try {
            dot.templateSettings.strip = false;
            let templates = new Array();
            let options = {
                filter: (filename) => {
                    let ext = filename.substring(filename.length - 4);
                    if (ext == '.dot') {
                        templates.push(filename);
                        return false;
                    }
                    else {
                        return true;
                    }
                }
            };
            ncp_1.ncp(source, destination, options, function (error) {
                if (error) {
                    if (error[0] && (error[0].code == 'ENOENT')) {
                        reject('Template not found');
                    }
                    else {
                        reject(error);
                    }
                }
                let promises = [];
                for (let file of templates) {
                    promises.push(applyTemplate(file, source, destination, config));
                }
                Promise.all(promises)
                    .then(() => { resolve(); })
                    .catch((error) => { reject(error); });
            });
        }
        catch (error) {
            reject(error);
        }
    });
}
exports.createElementFromTemplate = createElementFromTemplate;
function applyTemplate(file, source, destination, config) {
    return new Promise((resolve, reject) => {
        try {
            let relative = file.substring(source.length + 1);
            console.log('relative ', relative);
            let destFile = `${destination}/${relative.substring(0, relative.length - 4)}`;
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
            readStream.on('end', () => {
                resolve(destFile);
            });
            readStream.on('error', (error) => {
                reject(error);
            });
        }
        catch (error) {
            reject(error);
        }
    });
}
function deleteFolder(dir) {
    let dirPath = path.join('.', dir);
    try {
        let stats = fs.statSync(dir);
        if (stats.isDirectory()) {
            rimraf.sync(dirPath);
            return true;
        }
        else {
            console.log(`"${dir}" is not a directory, skipping.`);
            return false;
        }
    }
    catch (error) {
        return false;
    }
}
exports.deleteFolder = deleteFolder;
function getJSON(filepath) {
    const jsonString = "g = " + fs.readFileSync(filepath, 'utf8') + "; g";
    return (new vm.Script(jsonString)).runInNewContext();
}
exports.getJSON = getJSON;
function writeJSON(filepath, data) {
    fs.writeFileSync(filepath, data, 'utf8');
}
exports.writeJSON = writeJSON;
var ParameterType;
(function (ParameterType) {
    ParameterType[ParameterType["BOOLEAN"] = 1] = "BOOLEAN";
    ParameterType[ParameterType["INTEGER"] = 2] = "INTEGER";
    ParameterType[ParameterType["JSON"] = 3] = "JSON";
    ParameterType[ParameterType["LIST"] = 4] = "LIST";
    ParameterType[ParameterType["NUMBER"] = 5] = "NUMBER";
    ParameterType[ParameterType["STRING"] = 6] = "STRING";
    ParameterType[ParameterType["VHOST"] = 7] = "VHOST";
})(ParameterType = exports.ParameterType || (exports.ParameterType = {}));
var ResourceType;
(function (ResourceType) {
    ResourceType[ResourceType["CERT_CLIENT"] = 1] = "CERT_CLIENT";
    ResourceType[ResourceType["CERT_SERVER"] = 2] = "CERT_SERVER";
    ResourceType[ResourceType["FAULT_GROUP"] = 3] = "FAULT_GROUP";
    ResourceType[ResourceType["VHOST"] = 4] = "VHOST";
    ResourceType[ResourceType["VOLUME_PERSITENT"] = 5] = "VOLUME_PERSITENT";
    ResourceType[ResourceType["VOLUME_VOLATILE"] = 6] = "VOLUME_VOLATILE";
})(ResourceType = exports.ResourceType || (exports.ResourceType = {}));
function processResources(rawResources) {
    let resources = [];
    for (let res of rawResources) {
        let type;
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
        let resource = {
            name: res.name,
            type: type
        };
        resources.push(resource);
    }
    return resources;
}
exports.processResources = processResources;
function processParameters(rawParams) {
    let parameters = [];
    for (let param of rawParams) {
        let type;
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
        let parameter = {
            name: param.name,
            type: type
        };
        parameters.push(parameter);
    }
    return parameters;
}
exports.processParameters = processParameters;
function executeProgram(command, args, options) {
    return new Promise((resolve, reject) => {
        let proc = child_process.spawn(command, args, options);
        proc.stdout.pipe(process.stdout);
        proc.stderr.pipe(process.stderr);
        proc.on('close', (code) => {
            if (code != 0) {
                reject(new Error(`child process exited with code ${code}`));
            }
            else {
                resolve();
            }
        });
    });
}
exports.executeProgram = executeProgram;
// Creates the bundle file containing the manifest and the Docker runtime image
function createBundleFile(targetFile, sourceFiles, blobs) {
    return new Promise((resolve, reject) => {
        try {
            // Create an archiver and the output stream with the target file
            let archive = archiver('zip', {
                zlib: { level: 9 } // Sets the compression level.
            });
            let output = fs.createWriteStream(targetFile);
            // listen for all archive data to be written
            // 'close' event is fired only when a file descriptor is involved
            output.on('close', function () {
                resolve(targetFile);
            });
            // This event is fired when the data source is drained no matter what was the data source.
            // It is not part of this library but rather from the NodeJS Stream API.
            // @see: https://nodejs.org/api/stream.html#stream_event_end
            output.on('end', function () {
                // console.log('Data has been drained');
                resolve(targetFile);
            });
            // Manages warnings (ie stat failures and other non-blocking errors)
            archive.on('warning', function (err) {
                reject(err);
            });
            // Manages errors
            archive.on('error', function (err) {
                reject(err);
            });
            // Pipes archive data to the file
            archive.pipe(output);
            // Appends the files included in the bundle
            if (sourceFiles) {
                for (let i in sourceFiles) {
                    let folder = `folder${i}`;
                    let filepath = sourceFiles[i];
                    let stats = fs.statSync(filepath);
                    if (stats.isFile()) {
                        let basename = path.basename(filepath);
                        archive.append(fs.createReadStream(filepath), { name: `${folder}/${basename}` });
                    }
                    else if (stats.isDirectory()) {
                        archive.directory(filepath, `${folder}`);
                    }
                }
            }
            // Appends the blobs included in the bundle
            if (blobs) {
                for (let blob of blobs) {
                    archive.append(blob.data, { name: blob.pathInZip });
                }
            }
            // Finalize the archive (ie we are done appending files but streams have to
            // finish yet)
            // 'close', 'end' or 'finish' may be fired right after calling this method so
            // register to them beforehand
            archive.finalize();
        }
        catch (error) {
            let message = ((error & error.message) ? error.message : error.toString());
            reject(`Error bundeling ${targetFile}: ${message}`);
        }
    });
}
exports.createBundleFile = createBundleFile;
//# sourceMappingURL=utils.js.map