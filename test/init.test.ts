import * as assert from 'assert';
import * as fs from 'fs';
import * as cp from 'child_process';
import { workspace } from '../lib/index';

process.env.NODE_ENV = 'test';

describe('Init command tests', function () {
  after(() => {
    cp.execSync('rm -rf builts components dependencies deployments resources runtimes services tests');
    cp.execSync('rm -rf kumoriConfig.json');
  })

  it('Init command creates properly all directories', function (done) {
    this.timeout(5000)
    workspace.init('@kumori/workspace')
      .then(success => {
        assert.equal(success, true);
        assert.equal(fs.existsSync('builts'), true);
        assert.equal(fs.existsSync('components'), true);
        assert.equal(fs.existsSync('dependencies'), true);
        assert.equal(fs.existsSync('deployments'), true);
        assert.equal(fs.existsSync('resources'), true);
        assert.equal(fs.existsSync('runtimes'), true);
        assert.equal(fs.existsSync('services'), true);
        assert.equal(fs.existsSync('tests'), true);
        done();
      })
      .catch(err => {
        done(err);
      })
  });

  it('Init command should work with partial initialized workspaces', function (done) {
    this.timeout(5000)
    workspace.init('@kumori/workspace')
      .then(success => {
        assert.equal(success, true);
        done();
      })
      .catch(err => {
        done(err);
      });
  });
})