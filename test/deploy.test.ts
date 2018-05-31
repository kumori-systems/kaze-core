import * as assert from 'assert';
import * as fs from 'fs';
import * as cp from 'child_process';
import * as mockStamp from './mockStamp';
import * as utils from '../lib/utils';
import { workspace } from '../lib/index';

describe('Deploy command tests', () => {
  before(() => {
    mockStamp.launch();
    fs.writeFileSync('test.zip', '');
    fs.writeFileSync('Manifest.json', '');
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
    cp.execSync('rm -rf builts')
    cp.execSync('rm test.zip Manifest.json')
    cp.execSync(`rm ${utils.configuration.configFileName}`)
  });


  it('Deploy command works with bundle zip', done => {
    workspace.deploy(['test.zip'], mockStamp.MOCK_STAMP )
      .then(result => {
        assert.equal(result.successful.length, 1);
        assert.equal(result.errors.length, 2);
        assert.equal(result.deployments.length, 1);
        done();
      })
      .catch(err => {
        done(err);
      })
  });

  it('Deploy command should work fine by bundling first while receiving Manifest.json as parameter', done => {
    workspace.deploy(['Manifest.json'], mockStamp.MOCK_STAMP )
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

  it('Deploy command should work fine by bundling first while receiving directory as parameter', done => {
    workspace.deploy(['builts'], mockStamp.MOCK_STAMP )
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

  it('While executing deploy command with multiple arguments, it should skip those not applicable', done => {
    workspace.deploy(['builts', 'notApplicable.rar', 'Manifest.json', 'skip.skip'], mockStamp.MOCK_STAMP )
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

  it('When deploying something aplicable to deploy command but with errorneous content, execution should fail', done => {
    workspace.deploy(['builts', 'failFlag.zip', 'Manifest.json'], mockStamp.MOCK_STAMP )
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
