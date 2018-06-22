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
const sao = require("sao");
// export interface Prompt {
//     message: string,
//     default: any
// }
function runTemplate(name, targetPath, params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // If the template is downloaded, notify it to the user.
            sao.on('download:start', () => {
                console.log(`Downloading ${name}...`);
            });
            sao.on('download:stop', () => {
                console.log(`Downloaded ${name}...`);
            });
            // SAO templates engine configuration. Includes:
            // * template: the name of the template to be used.
            // * clone: if it is a git repository, clone the git instead of searching a zip file.
            // * targetPath: where the files will be stored.
            // * mockPrompts: instead of asking the user for the variables values, use the one provided in this dictionary.
            let config = {
                template: name,
                clone: true,
                targetPath: targetPath,
                mockPrompts: params
            };
            // This disables the SAO templates library logger.
            sao.log.success = () => { };
            sao.log.error = (message) => {
                throw new Error(message);
            };
            sao.log.warn = () => { };
            sao.log.info = () => { };
            // Download and execute the SAP template
            yield sao(config);
        }
        catch (error) {
            throw new Error(`Error downloading template: ${error.message || error}`);
        }
    });
}
exports.runTemplate = runTemplate;
//# sourceMappingURL=sao.js.map