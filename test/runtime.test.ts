import { writeEmptyConfigFile } from '../lib/utils';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import * as assert from 'assert';
import { workspace } from '../lib/index';

process.env.NODE_ENV = 'test';

const KAZE_CONFIG = './kumoriConfig.json';
const RUNTMES_DIR = './runtimes';

describe('Runtime command tests', function () {


    before(() => {
        writeEmptyConfigFile();
    });

    after(function (done) {
        let error:Error = undefined;
        try {
            let stats = fs.statSync(RUNTMES_DIR);
            if (stats.isDirectory()) {
                rimraf.sync(RUNTMES_DIR);
            } else {
                error = new Error(`${RUNTMES_DIR} is not a folder`);
            }
        } catch(err) {
            error = err;
        }
        try {
            let stats = fs.statSync(KAZE_CONFIG);
            if (stats.isFile()) {
                rimraf.sync(KAZE_CONFIG);
            } else {
                error = new Error(`${KAZE_CONFIG} is not a file`);
            }
        } catch(err) {
            error = err;
        }
        if (error) {
            done(error);
        } else {
            done();
        }
    });

    it('Create new runtime from basic template', function (done) {
        this.timeout(5000)
        try {
            let config = {
                name: 'test',
                domain: 'acme.com',
                parent: 'eslap://eslap.cloud/runtime/native/1_1_1',
                componentFolder: "/eslap/component",
                entrypoint: "/eslap/runtime-agent/scripts/start-runtime-agent.sh"
            }
            workspace.runtime.add('kumori-runtime-basic', config)
            .then( function (){
                let manifest = require(`${process.env.PWD}/runtimes/acme.com/test/Manifest.json`);
                assert.equal(manifest.name, `eslap://${config.domain}/runtime/${config.name}/0_0_1`);
                assert.equal(manifest.derived.from, config.parent);
                let dockerfile:string = fs.readFileSync(`${process.env.PWD}/runtimes/acme.com/test/Dockerfile`, {encoding:'utf8'});
                assert.equal(dockerfile.startsWith('FROM eslap.cloud/runtime/native:1_1_1'),true);
                done()
            })
            .catch( function (error) {
                done(error)
            });
        } catch(error) {
            done(error);
        }
    });
});
