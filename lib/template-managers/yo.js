"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yeoman = require("yeoman-environment");
const path = require("path");
function runTemplate(name, targetPath, params) {
    return new Promise((resolve, reject) => {
        try {
            const env = yeoman.createEnv(name, { cwd: path.resolve(process.cwd(), targetPath) });
            // Override the prompt method to avoid asking for values we already have.
            if (params) {
                let originalPrompt = env.adapter.prompt;
                env.adapter.prompt = (questions, callback) => {
                    if (questions) {
                        let newQuestions = [];
                        for (let question of questions) {
                            if (params && (!params[question.name])) {
                                newQuestions.push(question);
                            }
                        }
                        questions = newQuestions;
                    }
                    if (callback) {
                        originalPrompt.call(env.adapter, questions, (error, answers) => {
                            for (let param in params) {
                                answers[param] = params[param];
                            }
                            callback(error, answers);
                        });
                    }
                    else {
                        return originalPrompt.call(env.adapter, questions)
                            .then((answers) => {
                            for (let param in params) {
                                answers[param] = params[param];
                            }
                            return Promise.resolve(answers);
                        });
                    }
                };
            }
            env.lookup(() => {
                let result = env.run((err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
                result.on('error', (error) => console.log(error));
            });
        }
        catch (error) {
            reject(new Error(`Error downloading template: ${error.message || error}`));
        }
    });
}
exports.runTemplate = runTemplate;
//# sourceMappingURL=yo.js.map