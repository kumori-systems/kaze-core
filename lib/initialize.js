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
const fs = require("fs");
const path = require("path");
const utils = require("./utils");
const ncp_1 = require("ncp");
function initCommand(templatesPath) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Initializing workspace following standard Kumori project hierarchy...');
        return new Promise((resolve, reject) => {
            try {
                const stdDirs = [
                    'builts', 'components', 'dependencies', 'deployments', 'resources', 'runtimes', 'services', 'templates', 'tests'
                ];
                for (let dir of stdDirs) {
                    utils.createPath(dir);
                }
                if (fs.existsSync(utils.configuration.configFileName)) {
                    console.log(`"${utils.configuration.configFileName}" already exists, skipping.`);
                }
                else {
                    console.log(`Initializing ${utils.configuration.configFileName} for this workspace...`);
                    utils.writeEmptyConfigFile();
                }
                let destination = path.join(`${process.cwd()}`, 'templates');
                let source = (templatesPath ? templatesPath : path.join(__dirname, '../templates'));
                let relative = path.relative(destination, source);
                if (relative && (relative.length > 0)) {
                    ncp_1.ncp(source, destination, function (error) {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve(true);
                        }
                    });
                }
                else {
                    resolve(true);
                }
            }
            catch (error) {
                reject(error);
            }
        });
    });
}
exports.initCommand = initCommand;
//# sourceMappingURL=initialize.js.map