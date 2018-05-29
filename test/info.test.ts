import * as assert from 'assert';
import * as mockStamp from './mockStamp';
import { workspace } from '../src/index';

describe('Info command tests', () => {
  before(() => {
    mockStamp.launch();
  });

  after(() => {
    mockStamp.shutdown();
  });

  it('Info command should be able to retrieve information about deploymenets', done => {
    workspace.info('deployments', 'http://localhost:3018')
      .then(success => {
        assert.equal(success, true);
        done();
      })
      .catch(err => {
        console.log(`Error: ${ JSON.stringify(err) }`)
        done(err);
      })
  });

  it('Info command should fail when requesting to retrieve unsupported information', done => {
    workspace.info('fail', 'http://localhost:3018')
      .then(success => {
        done('Info operation succeeded when expected it to fail')
      })
      .catch(err => {
        done();
      });
  });

  it('Info command should be able to retrieve information about registries', done => {
    workspace.info('registries', 'http://localhost:3018')
      .then(success => {
        assert.equal(success, true);
        done();
      })
      .catch(err => {
        done(err);
      })
  });
});
