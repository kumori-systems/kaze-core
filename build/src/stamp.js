"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("./utils");
const admission_client_1 = require("admission-client");
const fs_1 = require("fs");
class Stamp {
    add(id, stampConfig, defaultStamp) {
        let workspaceConfig = utils.readConfigFile();
        if (workspaceConfig['stamps'][id]) {
            console.error(`${utils.configuration.configFileName} already has a stamp with id: ${id}`);
            return;
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
            console.error(`${utils.configuration.configFileName} does not contain any stamp with id: ${id}`);
            return;
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
            if (!stamp) {
                return Promise.reject(new Error('Stamp name parameter is missing'));
            }
            if (!name) {
                return Promise.reject(new Error('Element name parameter is missing'));
            }
            let workspaceConfig = utils.readConfigFile();
            let stampConfig = workspaceConfig.stamps && workspaceConfig.stamps[stamp];
            if (!stampConfig) {
                return Promise.reject(new Error(`Stamp ${stamp} not registered in the workspace`));
            }
            let admissionUrl = stampConfig.admission;
            let token = stampConfig.token;
            let admission = new admission_client_1.AdmissionClient(`${admissionUrl}/admission`, token);
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
            return Promise.reject(`Error searching for ${name} in ${stamp}: ${message}`);
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
    // Registers a bundle in a stamp using AdmissionClient.
    //
    // Parameters:
    // * `stamp`: the stamp id as rgistered in configurationFile.
    // * `bundle`: the path to the bundle file.
    //
    // Returns: a RegistrationResult with the results.
    register(stamp, bundle) {
        try {
            if (!stamp) {
                return Promise.reject(new Error('Stamp name parameter is missing'));
            }
            if (!bundle) {
                return Promise.reject(new Error('The path to the bundle parameter is missing'));
            }
            let workspaceConfig = utils.readConfigFile();
            let stampConfig = workspaceConfig.stamps && workspaceConfig.stamps[stamp];
            if (!stampConfig) {
                return Promise.reject(new Error(`Stamp ${stamp} not registered in the workspace`));
            }
            return utils.access(bundle, fs_1.constants.R_OK)
                .then(() => {
                let admissionUrl = stampConfig.admission;
                let token = stampConfig.token;
                let admission = new admission_client_1.AdmissionClient(`${admissionUrl}/admission`, token);
                let stream = fs_1.createReadStream(bundle);
                let fileStream = new admission_client_1.FileStream(stream);
                return admission.sendBundle(fileStream);
            }, (error) => {
                return Promise.reject(`Bundle ${bundle} not available in the workspace`);
            })
                .catch((error) => {
                let message = ((error && error.message) ? error.message : error.toString());
                return Promise.reject(`Error registering ${bundle} in ${stamp}: ${message}`);
            });
        }
        catch (error) {
            let message = ((error && error.message) ? error.message : error.toString());
            return Promise.reject(`Error registering ${bundle} in ${stamp}: ${message}`);
        }
    }
}
exports.Stamp = Stamp;
//# sourceMappingURL=stamp.js.map