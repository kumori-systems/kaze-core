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
function getDeployments(stamp, stampStub) {
    return __awaiter(this, void 0, void 0, function* () {
        let workspaceConfig = utils.readConfigFile();
        let stampConfig = workspaceConfig.stamps && workspaceConfig.stamps[stamp];
        if (!stampConfig) {
            return Promise.reject(new Error(`Stamp ${stamp} not registered in the workspace`));
        }
        let admissionUrl = stampConfig.admission;
        let token = stampConfig.token;
        let deployments = yield stampStub.findDeployments(stamp);
        for (let depName in deployments) {
            let deployment = deployments[depName];
            console.log(`\n-------------------------------------------------------------------------------------`);
            console.log(`Deployment URN:\t\t${deployment.urn}`);
            if (deployment.nickname) {
                console.log(`Deployment nickname:\t\t${deployment.urn}`);
            }
            console.log(`Deployment roles:\t\t${Object.keys(deployment.roles).length}`);
            for (let roleName in deployment.roles) {
                let role = deployment.roles[roleName];
                console.log(`\tRole "${roleName}"`);
                console.log(`\t\tComponent: \t${role.component}`);
                if (role.entrypoint && role.entrypoint.domain) {
                    console.log(`\t\tEntrypoint: \t${role.entrypoint.domain}`);
                }
            }
            console.log(`-------------------------------------------------------------------------------------`);
        }
    });
}
function infoCommand(requestedInfo, stamp, stampStub) {
    return __awaiter(this, void 0, void 0, function* () {
        // Supported information retrieval
        if (requestedInfo == null) {
            return Promise.reject({
                err: 'Undefined information retrieval option',
                showHelp: 'info'
            });
        }
        else if (!requestedInfo.match(/(deployments|registries)/)) {
            return Promise.reject({
                err: `Unsupported information retrieval option "${requestedInfo}"`,
                showHelp: 'info'
            });
        }
        try {
            yield getDeployments(stamp, stampStub);
            return Promise.resolve(true);
        }
        catch (e) {
            return Promise.reject({
                err: `Couldn't retrieve ${requestedInfo} information from ${stamp}`,
                additionalInfo: e
            });
        }
    });
}
exports.infoCommand = infoCommand;
//# sourceMappingURL=info.js.map