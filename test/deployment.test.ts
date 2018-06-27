import { writeEmptyConfigFile, getJSON } from '../lib/utils'
import * as fs from 'fs'
import * as rimraf from 'rimraf'
import * as assert from 'assert'
import * as mkdirp from 'mkdirp'
import * as path from 'path'
import { MOCK_URN, MOCK_RESPONSE, MockStampStubFactory } from './mock-stamp-stub'
import { Deployment } from '../lib/deployment'

process.env.NODE_ENV = 'test';

const KAZE_CONFIG = `${process.env.PWD}/kumoriConfig.json`;
const DEPLOYMENTS_DIR = `${process.env.PWD}/deployments`;
const SERVICES_DIR = `${process.env.PWD}/services`;
const COMPONENTS_DIR = `${process.env.PWD}/components`;

const CONFIG = {
  name: 'test',
  service: {
    domain: 'acme.com',
    name: 'test',
    version: '0_0_1'
  }
}


function createMockService() {
  mkdirp.sync(`${SERVICES_DIR}/acme.com/test`);
  let data = '{\
    "spec": "http://eslap.cloud/manifest/service/1_0_0",\
    "name": "eslap://acme.com/services/test/0_0_1",\
    "configuration": {\
      "resources": [{\
        "name": "aclientcert",\
        "type": "eslap://eslap.cloud/resource/cert/client/1_0_0"\
      },{\
        "name": "aservercert",\
        "type": "eslap://eslap.cloud/resource/cert/server/1_0_0"\
      },{\
        "name": "afaultgrout",\
        "type": "eslap://eslap.cloud/resource/faultgroups/1_0_0"\
      },{\
        "name": "avhost",\
        "type": "eslap://eslap.cloud/resource/vhost/1_0_0"\
      },{\
        "name": "apersistentvolume",\
        "type": "eslap://eslap.cloud/resource/volume/persistent/1_0_0"\
      },{\
        "name": "avolatilevolume",\
        "type": "eslap://eslap.cloud/resource/volume/volatile/1_0_0"\
      }],\
      "parameters": [{\
        "name": "aboolean",\
        "type": "eslap://eslap.cloud/parameter/boolean/1_0_0"\
      },{\
        "name": "aninteger",\
        "type": "eslap://eslap.cloud/parameter/integer/1_0_0"\
      },{\
        "name": "ajson",\
        "type": "eslap://eslap.cloud/parameter/json/1_0_0"\
      },{\
        "name": "alist",\
        "type": "eslap://eslap.cloud/parameter/list/1_0_0"\
      },{\
        "name": "anumber",\
        "type": "eslap://eslap.cloud/parameter/number/1_0_0"\
      },{\
        "name": "astring",\
        "type": "eslap://eslap.cloud/parameter/string/1_0_0"\
      },{\
        "name": "avhost",\
        "type": "eslap://eslap.cloud/parameter/vhost/1_0_0"\
      },{\
        "name": "role1",\
        "type": "eslap://eslap.cloud/parameter/json/1_0_0"\
      }]\
    },\
    "roles": [{\
      "name": "role1",\
      "component": "eslap://acme.com/components/test/0_0_1"\
    },{\
      "name": "role2",\
      "component": "eslap://acme.com/components/test/0_0_1"\
    }],\
    "channels": {\
      "provides": [],\
      "requires": []\
    },\
    "connectors": []\
  }'
  fs.writeFileSync(`${SERVICES_DIR}/acme.com/test/Manifest.json`, data);
}

function createMockComponent() {
  mkdirp.sync(`${COMPONENTS_DIR}/acme.com/test`);
  let data = '{\
    "spec": "http://eslap.cloud/manifest/component/1_0_0",\
    "name": "eslap://acme.com/components/test/0_0_1",\
    "configuration": {\
      "resources": [],\
      "parameters": [{\
        "name": "astring",\
        "type": "eslap://eslap.cloud/parameter/string/1_0_0"\
      }]\
    },\
    "channels": {\
      "provides": [],\
      "requires": []\
    },\
    "profile": {\
      "threadability": "*"\
    }\
  }'
  fs.writeFileSync(`${COMPONENTS_DIR}/acme.com/test/Manifest.json`, data);
}

let deployment = new Deployment(new MockStampStubFactory())

describe('Deployment command tests', function () {

  before(() => {
    writeEmptyConfigFile();
    createMockService();
    createMockComponent();
  });

  after(function (done) {
    let error:Error = undefined;
    let folders = [DEPLOYMENTS_DIR, SERVICES_DIR, COMPONENTS_DIR];

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
      deployment.add('@kumori/workspace:deployment-basic', CONFIG)
      .then( () => {
        let manifest = getJSON(`${DEPLOYMENTS_DIR}/${CONFIG.name}/Manifest.json`);
        assert.equal(manifest.servicename, `eslap://${CONFIG.service.domain}/services/${CONFIG.service.name}/0_0_1`);
        assert.equal(manifest.nickname, CONFIG.name);
        let roleResources = {
          "__instances": 1,
          "__maxinstances": 3,
          "__cpu": 1,
          "__memory": 1,
          "__ioperf": 1,
          "__iopsintensive": false,
          "__bandwidth": 10,
          "__resilience": 1
        }
        assert.deepEqual(manifest.roles.role1.resources, roleResources);
        assert.deepEqual(manifest.roles.role2.resources, roleResources);
        let parameters = {
          "aboolean": false,
          "aninteger": 0,
          "ajson": {},
          "alist": [],
          "anumber": 0,
          "astring": "",
          "avhost": "",
          "role1": {
            "astring":""
          }
        }
        assert.deepEqual(manifest.configuration.parameters, parameters);
        // let resources = {
        //   "aclientcert": "",
        //   "aservercert": "",
        //   "afaultgrout": "",
        //   "avhost": "",
        //   "apersistentvolume": "",
        //   "volatilevolume": ""
        // }
        done()
      })
      .catch( error => done(error));
    } catch(error) {
     done(error);
    }
  });

  it('getService and getManifest', function () {
    let config = deployment.getService(CONFIG.name)
    assert.equal(config.name, CONFIG.service.name)
    assert.equal(config.domain, CONFIG.service.domain)
    assert.equal(config.version, CONFIG.service.version)
  });

  it('getDistributableFile', function() {
    return deployment.getDistributableFile(CONFIG.name)
    .then(function(bundlePath) {
      let expectedPath = path.resolve('./deployments', CONFIG.name, 'Manifest.json')
      assert.equal(path.relative(expectedPath, bundlePath), 0)
    })
  })

  it('scaleRole', function() {
    return deployment.scaleRole(MOCK_URN, 'role1', 3, 'localstamp')
    .then(function (result) {
      assert.equal(result, `Result: ${MOCK_RESPONSE}`)
      return deployment.scaleRole(MOCK_URN, 'role1', 3, 'wrong')
    })
    .catch(function(error) {
      if (error.message.localeCompare("Stamp wrong not registered in the workspace") != 0) {
        return Promise.reject(error)
      } else {
        return Promise.resolve()
      }
    })
  })

  it('undeploy', function() {
    return deployment.undeploy(MOCK_URN, 'localstamp')
    .then(function () {
      return deployment.undeploy(MOCK_URN, 'wrong')
    })
    .catch(function(error) {
      if (error.message.localeCompare("Stamp wrong not registered in the workspace") != 0) {
        return Promise.reject(error)
      } else {
        return Promise.resolve()
      }
    })
  })

});