import * as utils from '../lib/utils';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import * as assert from 'assert';
import { getJSON } from '../lib/utils'
import { Component } from '../lib/component'
import * as path from 'path';

process.env.NODE_ENV = 'test';

const KAZE_CONFIG = './kumoriConfig.json';
const COMPONENTS_DIR = './components';

const CONFIG = {
  name: 'test',
  domain: 'acme.com'
}

describe('Components command tests', function () {

  let component = new Component()

  before(() => {
    utils.writeEmptyConfigFile();
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

  it('add', function (done) {
    this.timeout(5000)
    try {
      component.add('@kumori/workspace:component-javascript', CONFIG)
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

  it('install and build', function (done) {
    let pkgjson = getJSON(`${process.env.PWD}/components/${CONFIG.domain}/${CONFIG.name}/package.json`)
    pkgjson.scripts.devinit = "touch devinit.test"
    pkgjson.scripts.superclean = "touch superclean.test"
    pkgjson.scripts.dist = "touch dist.test"
    fs.writeFileSync(`${process.env.PWD}/components/${CONFIG.domain}/${CONFIG.name}/package.json`, JSON.stringify(pkgjson, null, 2))
    component.build(CONFIG)
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

  it('getParameters', function() {
    let manifestPath = path.resolve(COMPONENTS_DIR, CONFIG.domain, CONFIG.name, 'Manifest.json');
    let manifest = component.getManifest(CONFIG)
    manifest.configuration.parameters.push({
      name: "param1",
      type: "eslap://eslap.cloud/parameter/string/1_0_0"
    })
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
    let parameters = component.getParameters(CONFIG)
    assert.equal(parameters.length, 1)
    assert.equal(parameters[0].name, 'param1')
    assert.equal(parameters[0].type, utils.ParameterType.STRING)
  })

  it('getDistributableFile', function() {
    let distPath = path.resolve(COMPONENTS_DIR, CONFIG.domain, CONFIG.name, 'dist');
    try {
      let config = {
        name: CONFIG.name,
        domain: CONFIG.domain,
        version: '0_0_1'
      }
      let distFilePath = path.resolve(distPath, 'bundle.zip')
      fs.mkdirSync(distPath)
      fs.writeFileSync(distFilePath, 'nothing')
      return component.getDistributableFile(config)
      .then(function (filepath) {
        assert.equal(path.relative(filepath, distFilePath), '')
        rimraf.sync(distPath)
      })
      .catch(function(error) {
        rimraf.sync(distPath)
        return Promise.reject(error)
      })
    } catch(error) {
      rimraf.sync(distPath)
      return Promise.reject(error)
    }
  })

  it('checkVersion', function() {
    let config = {
        name: CONFIG.name,
        domain: CONFIG.domain,
        version: '0_0_1'
    }
    component.checkVersion(config)
    .then(function (checked) {
        assert.ok(checked)
        config.version = '0_0_2'
        return component.checkVersion(config)
    })
    .then(function (checked) {
        assert.ok(!checked)
    })
  })

  it('getCurrentVersion', function() {
    return component.getCurrentVersion(CONFIG)
    .then(function(version) {
        assert.equal(version, '0_0_1')
    })
  })
});
