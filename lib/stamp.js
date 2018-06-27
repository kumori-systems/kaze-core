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
const utils = require("./utils");
const fs_1 = require("fs");
const stamp_manager_1 = require("./stamp-manager");
class Stamp {
    constructor(stampStubFactory) {
        this.stampStubFactory = stampStubFactory;
    }
    add(id, stampConfig, defaultStamp) {
        let workspaceConfig = utils.readConfigFile();
        if (workspaceConfig['stamps'][id]) {
            throw new Error(`${utils.configuration.configFileName} already has a stamp with id: ${id}`);
        }
        if (defaultStamp || (workspaceConfig['working-stamp'] == workspaceConfig['stamps'][id])) {
            workspaceConfig['working-stamp'] = id;
        }
        let configCopy = Object.assign({}, stampConfig);
        workspaceConfig['stamps'][id] = configCopy;
        utils.overwriteConfigFile(workspaceConfig);
    }
    update(id, stampConfig) {
        let workspaceConfig = utils.readConfigFile();
        if (!workspaceConfig['stamps'][id]) {
            throw new Error(`${utils.configuration.configFileName} does not contain any stamp with id: ${id}`);
        }
        let configCopy = Object.assign({}, stampConfig);
        workspaceConfig['stamps'][id] = configCopy;
        utils.overwriteConfigFile(workspaceConfig);
    }
    remove(id) {
        let workspaceConfig = utils.readConfigFile();
        if (!workspaceConfig['stamps'][id]) {
            console.error(`${utils.configuration.configFileName} does not contain any stamp with id: ${id}`);
            return;
        }
        if (workspaceConfig['working-stamp'] == id) {
            console.error('Cannot remove working stamp, please run first kaze switch <stamp-id>');
            return;
        }
        delete workspaceConfig['stamps'][id];
        utils.overwriteConfigFile(workspaceConfig);
    }
    use(id) {
        let workspaceConfig = utils.readConfigFile();
        if (!workspaceConfig['stamps'][id]) {
            console.error(`${utils.configuration.configFileName} does not contain any stamp with id: ${id}`);
            return;
        }
        workspaceConfig['working-stamp'] = id;
        utils.overwriteConfigFile(workspaceConfig);
    }
    // Checks if a given element is registered in a given stamp.
    // TODO: to be implemented. Right now always returns `false`.
    //
    // Parameters:
    // * `stamp`: the stamp id as introduced in configuration file.
    // * `name`: the URN of the element to be checked.
    //
    // Returns: `true` if the element is registered in the stamp, `false`
    //  otherwise.
    isRegistered(stamp, name) {
        try {
            let stampConfig = this._getStampConfig(stamp);
            if (!name) {
                return Promise.reject(new Error('Element name parameter is missing'));
            }
            let admissionUrl = stampConfig.admission;
            let token = stampConfig.token;
            let admission = this.stampStubFactory.getStub(`${admissionUrl}/admission`, token);
            return admission.findStorage()
                .then((result) => {
                for (let element of result) {
                    if (element === name) {
                        return true;
                    }
                }
                return false;
            })
                .catch((error) => {
                let message = ((error && error.message) ? error.message : error.toString());
                return Promise.reject(`Error searching for ${name} in ${stamp}: ${message}`);
            });
        }
        catch (error) {
            let message = ((error && error.message) ? error.message : error.toString());
            return Promise.reject(new Error(`Error searching for ${name} in ${stamp}: ${message}`));
        }
        // return Promise.resolve(false);
    }
    get(stamp) {
        let workspaceConfig = utils.readConfigFile();
        if ((!stamp) || (!workspaceConfig.stamps[stamp])) {
            throw new Error("Stamp not registered");
        }
        return workspaceConfig.stamps[stamp];
    }
    isDefault(name) {
        if ((!name) || (name.length == 0)) {
            return false;
        }
        else {
            let workspaceConfig = utils.readConfigFile();
            return (name.localeCompare(workspaceConfig["working-stamp"]) == 0);
        }
    }
    /**
     * Registers a bundle in a target stamp.
     *
     * @param stamp The stamp id as registered in the configuration file
     * @param bundle The path to the bundle to be registred
     * @returns The result returned by the stamp.
     */
    register(stamp, bundle) {
        try {
            let stampConfig = this._getStampConfig(stamp);
            if (!bundle) {
                return Promise.reject(new Error('The path to the bundle parameter is missing'));
            }
            return utils.access(bundle, fs_1.constants.R_OK)
                .then(() => {
                let admissionUrl = stampConfig.admission;
                let token = stampConfig.token;
                let admission = this.stampStubFactory.getStub(`${admissionUrl}/admission`, token);
                let stream = fs_1.createReadStream(bundle);
                let fileStream = new stamp_manager_1.FileStream(stream);
                return admission.sendBundle(fileStream);
            }, () => {
                return Promise.reject(new Error(`Bundle ${bundle} not available in the workspace`));
            })
                .catch((error) => {
                let message = ((error && error.message) ? error.message : error.toString());
                return Promise.reject(new Error(`Error registering ${bundle} in ${stamp}: ${message}`));
            });
        }
        catch (error) {
            let message = ((error && error.message) ? error.message : error.toString());
            return Promise.reject(new Error(`Error registering ${bundle} in ${stamp}: ${message}`));
        }
    }
    unregister(stamp, urn) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let stampConfig = this._getStampConfig(stamp);
                if (!urn) {
                    throw new Error('The element URN is missing');
                }
                let admissionUrl = stampConfig.admission;
                let token = stampConfig.token;
                let admission = this.stampStubFactory.getStub(`${admissionUrl}/admission`, token);
                yield admission.removeStorage(urn);
                return true;
            }
            catch (error) {
                let message = ((error && error.message) ? error.message : error.toString());
                if (message.indexOf(" Error code 23 - Rsync command") != -1) {
                    message = `Element ${urn} is not registered in stamp ${stamp}`;
                }
                else if (message.indexOf('not registered in the workspace') == -1) {
                    message = `Element ${urn} unregistration process failed in stamp ${stamp}`;
                }
                throw new Error(message);
            }
        });
    }
    findDeployments(stamp, urn, owner) {
        return __awaiter(this, void 0, void 0, function* () {
            let stampConfig = this._getStampConfig(stamp);
            let admissionUrl = stampConfig.admission;
            let token = stampConfig.token;
            let admission = this.stampStubFactory.getStub(`${admissionUrl}/admission`, token);
            return yield admission.findDeployments(urn, owner);
        });
    }
    _getStampConfig(stamp) {
        if (!stamp) {
            throw new Error('Stamp name parameter is missing');
        }
        let workspaceConfig = utils.readConfigFile();
        let stampConfig = workspaceConfig.stamps && workspaceConfig.stamps[stamp];
        if (!stampConfig) {
            throw new Error(`Stamp ${stamp} not registered in the workspace`);
        }
        return stampConfig;
    }
}
exports.Stamp = Stamp;
//# sourceMappingURL=stamp.js.map