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
const querystring = require("querystring");
function undeployCommand(uris, stamp) {
    return __awaiter(this, void 0, void 0, function* () {
        let response = {
            successful: [],
            errors: []
        };
        for (let uri of uris) {
            try {
                let escUri = querystring.escape(uri);
                console.log(`Undeploying: ${uri}`);
                let resp = yield utils.httpDel({ uri: `${stamp}/admission/deployments?urn=${escUri}` });
                let unparsed = JSON.parse(resp.body);
                if (unparsed.success) {
                    console.log(`Success: ${unparsed.message}`);
                    response.successful.push(`${uri}:${unparsed.message}`);
                }
                else {
                    console.log(`Failure: ${unparsed.message}`);
                    response.errors.push(`${uri}:${unparsed.message}`);
                }
                return Promise.resolve(response);
            }
            catch (e) {
                return Promise.reject({
                    err: `Failed undeploying ${uri} of ${stamp}`,
                    additionalInfo: e
                });
            }
        }
    });
}
exports.undeployCommand = undeployCommand;
//# sourceMappingURL=undeploy.js.map