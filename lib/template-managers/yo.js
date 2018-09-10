"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yeoman = require("yeoman-environment");
const path = require("path");
function runTemplate(name, targetPath, params) {
    console.log("RUNNING TEMPLATE");
    return new Promise((resolve, reject) => {
        try {
            let options = {
                cwd: path.resolve(process.cwd(), targetPath)
            };
            for (let name in params) {
                options[name] = params[name];
            }
            const env = yeoman.createEnv(name, options);
            env.lookup(() => {
                let result = env.run((err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
                console.log("RESULT", result);
                if (result) {
                  result.on('error', (error) => console.log(error));
                }
            });
        }
        catch (error) {
            reject(new Error(`Error downloading template: ${error.message || error}`));
        }
    });
}
exports.runTemplate = runTemplate;
//# sourceMappingURL=yo.js.map
