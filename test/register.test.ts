import * as assert from 'assert';
import * as fs from 'fs';
import * as cp from 'child_process';
import * as mockStamp from './mockStamp';
import * as utils from '../lib/utils';
import * as path from 'path';
import { workspace } from '../lib/index';

describe('Register command tests', () => {
  before(() => {
    mockStamp.launch();
    fs.writeFileSync('test.zip', '');
    utils.setupQuestionForTest();
    utils.writeEmptyConfigFile();
    let config = utils.readConfigFile();
    config.stamps[mockStamp.MOCK_STAMP] = {
      admission: mockStamp.MOCK_STAMP_ADMISSION
    }
    utils.overwriteConfigFile(config);
  });

  after(() => {
    mockStamp.shutdown();
    cp.execSync('rm test.zip');
    cp.execSync(`rm ${utils.configuration.configFileName}`)
  });

  beforeEach(() => {
    // utils.configuration.configFileName = MOCK_CONFIG_FILE
    let builtsDirectory = path.join('.', 'builts');
    if (!fs.existsSync(builtsDirectory)) {
      console.warn('"builts" directory does not exist, initializing...')
      utils.mkdir(builtsDirectory);
    }
  });

  afterEach(() => {
    cp.execSync('rm -rf builts');
  });

  it('Register command works with bundle zip', done => {
   workspace.register(['test.zip'], mockStamp.MOCK_STAMP)
      .then(result => {
        console.log("RESULT", JSON.stringify(result));
        assert.equal(result.successful.length, 1);
        assert.equal(result.errors.length, 2);
        assert.equal(result.deployments.length, 1);
        done();
      })
      .catch(err => {
        done(err);
      })
  });

  it('Register command must work fine by bundling first while receiving directory as parameter', done => {
    workspace.register(['builts'], mockStamp.MOCK_STAMP)
      .then(result => {
        assert.equal(fs.existsSync('builts/test.zip'), true);
        assert.equal(result.successful.length, 1);
        assert.equal(result.errors.length, 2);
        assert.equal(result.deployments.length, 1);
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it('While executing register command with multiple arguments, it should skip those not applicable', done => {
    workspace.register(['builts', 'notApplicable.rar', 'Manifest.json', 'test.zip'], mockStamp.MOCK_STAMP)
      .then(result => {
        assert.equal(result.successful.length, 2, "Number of registered elements invalid");
        assert.equal(result.errors.length, 4, "Number of failed elements invalid");
        assert.equal(result.deployments.length, 2, "Number of deployments invalid");
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it('When registering something aplicable to register command but with errorneous content, execution should fail', done => {
    workspace.register(['builts', 'failFlag.zip'], mockStamp.MOCK_STAMP)
      .then(result => {
        assert.equal(result.successful.length, 1);
        assert.equal(result.errors.length, 2);
        assert.equal(result.deployments.length, 1);
        done();
      })
      .catch(err => {
        done(err);
      });
  });
});
