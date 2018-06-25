import { writeEmptyConfigFile } from '../lib/utils';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import * as assert from 'assert';
import { workspace } from '../lib/index';
import { getJSON } from '../lib/utils'

process.env.NODE_ENV = 'test';

const KAZE_CONFIG = './kumoriConfig.json';
const COMPONENTS_DIR = './components';

const CONFIG = {
  name: 'test',
  domain: 'acme.com'
}

describe('Components command tests', function () {

  before(() => {
    writeEmptyConfigFile();
  });

  after(function (done) {
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

  it('Create new component', function (done) {
    this.timeout(5000)
    try {
      workspace.component.add('kumori-component-javascript', CONFIG)
      .then( () => {
        let data = fs.readFileSync(`${process.env.PWD}/components/${CONFIG.domain}/${CONFIG.name}/Manifest.json`,'utf8');
        assert.equal(data.includes(`eslap://${CONFIG.domain}/components/${CONFIG.name}/0_0_1`), true);
        assert.equal(data.includes(`${CONFIG.name}-code-blob`), true);
        done()
      })
      .catch( (error) => done(error));
    } catch(error) {
     done(error);
    }
  });

  it('Install and build a component', function (done) {
    let pkgjson = getJSON(`${process.env.PWD}/components/${CONFIG.domain}/${CONFIG.name}/package.json`)
    pkgjson.scripts.devinit = "touch devinit.test"
    pkgjson.scripts.superclean = "touch superclean.test"
    pkgjson.scripts.dist = "touch dist.test"
    fs.writeFileSync(`${process.env.PWD}/components/${CONFIG.domain}/${CONFIG.name}/package.json`, JSON.stringify(pkgjson, null, 2))
    workspace.component.build(CONFIG)
    .then(function() {
      let files = [
        `${process.env.PWD}/components/${CONFIG.domain}/${CONFIG.name}/devinit.test`,
        `${process.env.PWD}/components/${CONFIG.domain}/${CONFIG.name}/superclean.test`,
        `${process.env.PWD}/components/${CONFIG.domain}/${CONFIG.name}/dist.test`
      ]
      for (let filePath of files) {
        let stats = fs.statSync(filePath)
        assert.ok(stats.isFile())
      }
      done()
    })
    .catch(function (error) {
      done(error)
    })
  })
});
