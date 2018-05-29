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
function infoCommand(requestedInfo, stamp) {
    return __awaiter(this, void 0, void 0, function* () {
        // Supported information retrieval
        let response = {
            successful: [],
            errors: [],
            deployments: []
        };
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
            // console.log(`${stamp}/admission/${requestedInfo}`)
            let raw = yield utils.httpGet({ uri: `${stamp}/admission/${requestedInfo}` });
            let result = JSON.parse(raw.body);
            if (result && result.data) {
                if (result.success) {
                    console.log("Deployments information retrieval succeed");
                }
                else {
                    console.log("Deployments information retrieval failed");
                }
                for (let depName in result.data) {
                    if (result.data[depName] == null) {
                        response.errors.push(`Deployment ${depName} not found`);
                    }
                    else {
                        let depResult = utils.processDeploymentsInfo(result.data[depName]);
                        response.deployments.push(depResult);
                    }
                }
            }
            console.log("");
            return Promise.resolve(true);
        }
        catch (e) {
            return Promise.reject({
                err: `Couldn't retrieve ${requestedInfo} informations from ${stamp}`,
                additionalInfo: e
            });
        }
    });
}
exports.infoCommand = infoCommand;
//# sourceMappingURL=info.js.map