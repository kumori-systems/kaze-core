// import { bundleCommand } from '../src/bundle';
import * as cp from 'child_process';
import * as assert from 'assert';
import * as fs from 'fs';
import * as utils from '../src/utils';
import { workspace } from '../src/index';

process.env.NODE_ENV = 'test';

describe('Bundle command tests', () => {
  before(() => {
    fs.writeFileSync('Manifest.json', '');
    utils.setupQuestionForTest();
  });

  afterEach(() => {
    cp.execSync('rm -rf builts');
  });

  after(() => {
    cp.execSync('rm Manifest.json');
  });

  it('Bundle command creates "builts" if does not exist', done => {
    workspace.bundle(['Manifest.json'])
      .then(resultZip => {
        assert.equal(fs.existsSync('builts'), true);
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it('Bundle command creates and places correctly bundle', done => {
    workspace.bundle(['Manifest.json'])
      .then(resultZip => {
        assert.equal(fs.existsSync(resultZip), true);
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it('Bundle command should fail when receiving something pointing to null or not zippable', done => {
    workspace.bundle(['shoudFail/doesIt'])
      .then(resultZip => {
        assert.equal(fs.existsSync(resultZip), false);
        done();
      })
      .catch(err => {
        done(err);
      });
  });
})
