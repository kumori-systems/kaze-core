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
const child = require("child_process");
const utils = require("./utils");
function bundleCommand(paths) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let builtsDirectory = path.join('.', 'builts');
            if (!fs.existsSync(builtsDirectory)) {
                console.warn('"builts" directory does not exist, initializing...');
                utils.mkdir(builtsDirectory);
            }
            let validPaths = [];
            for (let path of paths) {
                if (!fs.existsSync(path)) {
                    console.log(`Warning. Path ${path} does not exist. Skipping`);
                }
                else {
                    validPaths.push(path);
                }
            }
            if (validPaths.length == 0) {
                console.log('No valid paths found.');
            }
            else {
                let zipName = yield utils.question({ prompt: 'Output zip =', default: Date.now().toString() });
                let zipPath = path.join(builtsDirectory, zipName);
                let cmd = `zip -r ${zipPath} `.concat(validPaths.join(" "));
                console.log(`Bundling ${validPaths} into ${zipPath}.zip.`);
                // Execute zip command with a maximum buffer of 256MB
                child.execSync(cmd, { maxBuffer: (Math.pow(1024, 2)) * 256 });
                return Promise.resolve(`${zipPath}.zip`);
            }
        }
        catch (e) {
            return Promise.reject({ err: `Failed zipping ${paths}`, additionalInfo: e });
        }
    });
}
exports.bundleCommand = bundleCommand;
//# sourceMappingURL=bundle.js.map