"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../src/utils");
const fs = require("fs");
const rimraf = require("rimraf");
const assert = require("assert");
const index_1 = require("../src/index");
process.env.NODE_ENV = 'test';
const KAZE_CONFIG = `${process.env.PWD}/kazeConfig.json`;
const SERVICES_DIR = `${process.env.PWD}/services`;
describe('Service command tests', () => {
    before(() => {
        utils_1.writeEmptyConfigFile();
    });
    after((done) => {
        let error = undefined;
        try {
            let stats = fs.statSync(SERVICES_DIR);
            if (stats.isDirectory()) {
                rimraf.sync(SERVICES_DIR);
            }
            else {
                error = new Error(`${SERVICES_DIR} is not a folder`);
            }
        }
        catch (err) {
            error = err;
        }
        try {
            let stats = fs.statSync(KAZE_CONFIG);
            if (stats.isFile()) {
                rimraf.sync(KAZE_CONFIG);
            }
            else {
                error = new Error(`${KAZE_CONFIG} is not a file`);
            }
        }
        catch (err) {
            error = err;
        }
        if (error) {
            done(error);
        }
        else {
            done();
        }
    });
    it('Create new service', (done) => {
        try {
            let config = {
                name: 'test',
                domain: 'acme.com'
            };
            index_1.workspace.service.add('basic', config)
                .then(() => {
                let data = fs.readFileSync(`${SERVICES_DIR}/${config.domain}/${config.name}/Manifest.json`, 'utf8');
                assert.equal(data.includes(`eslap://${config.domain}/services/${config.name}/0_0_1`), true);
                done();
            })
                .catch(error => done(error));
        }
        catch (error) {
            done(error);
        }
    });
});
//# sourceMappingURL=service.test.js.map