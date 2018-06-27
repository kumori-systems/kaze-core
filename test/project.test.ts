import * as assert from 'assert';
import * as fs from 'fs';
import { workspace } from '../lib/index';
import { writeEmptyConfigFile } from '../lib/utils';
import * as rimraf from 'rimraf';

process.env.NODE_ENV = 'test';
const KAZE_CONFIG = `${process.env.PWD}/kumoriConfig.json`;
const SERVICES_DIR = `${process.env.PWD}/services`;
const COMPONENTS_DIR = `${process.env.PWD}/components`;

describe('Project command tests', function () {

    before(function () {
        writeEmptyConfigFile();
    });

    after(function (done) {
        let error:Error = undefined;
        let folders = [ COMPONENTS_DIR, SERVICES_DIR ];

        for (let folder of folders) {
          try {
            let stats = fs.statSync(folder);
            if (stats.isDirectory()) {
              rimraf.sync(folder);
            } else {
              error = new Error(`${folder} is not a folder`);
            }
          } catch(err) {
            error = err;
          }
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

    it('Project command creates properly all directories', function (done) {
        this.timeout(5000)
        let config = {
            name: 'test',
            domain: 'acme.com'
        }
        workspace.project.add('@kumori/workspace:project-hello-world', config)
        .then(success => {
            assert.equal(fs.existsSync('components/acme.com/test'), true);
            assert.equal(fs.existsSync('services/acme.com/test'), true);
            done();
        })
        .catch(err => {
            done(err);
        })
    });

})