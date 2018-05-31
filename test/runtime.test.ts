import { writeEmptyConfigFile } from '../lib/utils';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import * as assert from 'assert';
import { workspace } from '../lib/index';


// REMOVE
import * as cp from 'child_process';
import * as path from 'path';

process.env.NODE_ENV = 'test';

const KAZE_CONFIG = './kumoriConfig.json';
const RUNTMES_DIR = './runtimes';


describe('Runtime command tests', () => {

  before(() => {
    writeEmptyConfigFile();
  });

  after((done) => {
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

  it('Create new runtime from basic template', (done) => {
    try {
      let config = {
        name: 'test',
        domain: 'acme.com',
        parent: 'eslap://eslap.cloud/runtime/native/1_1_1'
      }
      workspace.runtime.add('basic', config)
      .then( () => {
        let manifest = require(`${process.env.PWD}/runtimes/acme.com/test/Manifest.json`);
        assert.equal(manifest.name, `eslap://${config.domain}/runtime/${config.name}/0_0_1`);
        assert.equal(manifest.derived.from, config.parent);
        let dockerfile:string = fs.readFileSync(`${process.env.PWD}/runtimes/acme.com/test/Dockerfile`, {encoding:'utf8'});
        assert.equal(dockerfile.startsWith('FROM eslap.cloud/runtime/native:1_1_1'),true);
        done()
      })
      .catch( error => done(error));
    } catch(error) {
     done(error);
    }
  });
});
