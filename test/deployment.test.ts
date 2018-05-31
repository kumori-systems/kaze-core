import { writeEmptyConfigFile, getJSON } from '../lib/utils';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import * as assert from 'assert';
import { workspace } from '../lib/index';
import * as mkdirp from 'mkdirp';


// REMOVE
import * as cp from 'child_process';
import * as path from 'path';

process.env.NODE_ENV = 'test';

const KAZE_CONFIG = `${process.env.PWD}/kumoriConfig.json`;
const DEPLOYMENTS_DIR = `${process.env.PWD}/deployments`;
const SERVICES_DIR = `${process.env.PWD}/services`;
const COMPONENTS_DIR = `${process.env.PWD}/components`;

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

describe('Deployment command tests', () => {

  before(() => {
    writeEmptyConfigFile();
    createMockService();
    createMockComponent();
  });

  after((done) => {
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

  it('Create new deployment', (done) => {
    try {
      let config = {
        name: 'test',
        service: {
          domain: 'acme.com',
          name: 'test',
          version: '0_0_1'
        }
      }
      workspace.deployment.add('basic', config)
      .then( () => {
        let manifest = getJSON(`${DEPLOYMENTS_DIR}/${config.name}/Manifest.json`);
        assert.equal(manifest.servicename, `eslap://${config.service.domain}/services/${config.service.name}/0_0_1`);
        assert.equal(manifest.name, config.name);
        let roleResources = {
          "__instances": 1,
          "__maxinstances": 3,
          "__cpu": 1,
          "__memory": 1,
          "__ioperf": 1,
          "__iopsintensive": false,
          "__bandwidth": 1,
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
        let resources = {
          "aclientcert": "",
          "aservercert": "",
          "afaultgrout": "",
          "avhost": "",
          "apersistentvolume": "",
          "volatilevolume": ""
        }
        done()
      })
      .catch( error => done(error));
    } catch(error) {
     done(error);
    }
  });
});