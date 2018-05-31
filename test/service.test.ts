import { writeEmptyConfigFile } from '../lib/utils';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import * as assert from 'assert';
import { workspace } from '../lib/index';


// REMOVE
import * as cp from 'child_process';
import * as path from 'path';

process.env.NODE_ENV = 'test';

const KAZE_CONFIG = `${process.env.PWD}/kumoriConfig.json`;
const SERVICES_DIR = `${process.env.PWD}/services`;


describe('Service command tests', () => {

  before(() => {
    writeEmptyConfigFile();
  });

  after((done) => {
    let error:Error = undefined;
    try {
      let stats = fs.statSync(SERVICES_DIR);
      if (stats.isDirectory()) {
        rimraf.sync(SERVICES_DIR);
      } else {
        error = new Error(`${SERVICES_DIR} is not a folder`);
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

  it('Create new service', (done) => {
    try {
      let config = {
        name: 'test',
        domain: 'acme.com'
      }
      workspace.service.add('basic', config)
      .then( () => {
        let data = fs.readFileSync(`${SERVICES_DIR}/${config.domain}/${config.name}/Manifest.json`,'utf8');
        assert.equal(data.includes(`eslap://${config.domain}/services/${config.name}/0_0_1`), true);
        done()
      })
      .catch( error => done(error));
    } catch(error) {
     done(error);
    }
  });
});