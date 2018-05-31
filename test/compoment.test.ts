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
const COMPONENTS_DIR = './components';
const TEMPLATES_DIR = './templates';


describe('Components command tests', () => {

  before(() => {
    writeEmptyConfigFile();
  });

  after((done) => {
    let error:Error = undefined;
    let folders = [ COMPONENTS_DIR ];

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

  it('Create new component', (done) => {
    try {
      let config = {
        name: 'test',
        domain: 'acme.com'
      }
      workspace.component.add('typescript', config)
      .then( () => {
        let data = fs.readFileSync(`${process.env.PWD}/components/${config.domain}/${config.name}/Manifest.json`,'utf8');
        assert.equal(data.includes(`eslap://${config.domain}/components/${config.name}/0_0_1`), true);
        assert.equal(data.includes(`${config.name}-code-blob`), true);
        done()
      })
      .catch( error => done(error));
    } catch(error) {
     done(error);
    }
  });
});
