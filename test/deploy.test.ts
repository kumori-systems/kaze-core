import * as assert from 'assert';
import * as fs from 'fs';
import * as cp from 'child_process';
import * as mockStamp from './mockStamp';
import * as utils from '../src/utils';
import { workspace } from '../src/index';

describe('Deploy command tests', () => {
  before(() => {
    mockStamp.launch();
    fs.writeFileSync('test.zip', '');
    fs.writeFileSync('Manifest.json', '');
    utils.setupQuestionForTest();
  });

  after(() => {
    mockStamp.shutdown();
    cp.execSync('rm -rf builts')
    cp.execSync('rm test.zip Manifest.json')
  });


  it('Deploy command works with bundle zip', done => {
    workspace.deploy(['test.zip'], 'http://localhost:3018')
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
    workspace.deploy(['Manifest.json'], 'http://localhost:3018')
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
    workspace.deploy(['builts'], 'http://localhost:3018')
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
    workspace.deploy(['builts', 'notApplicable.rar', 'Manifest.json', 'skip.skip'], 'http://localhost:3018')
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
    workspace.deploy(['builts', 'failFlag.zip', 'Manifest.json'], 'http://localhost:3018')
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
