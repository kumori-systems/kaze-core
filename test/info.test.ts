import * as assert from 'assert';
import * as mockStamp from './mockStamp';
import { workspace } from '../lib/index';
import * as utils from '../lib/utils';
import * as cp from 'child_process';

describe('Info command tests', () => {
  before(() => {
    mockStamp.launch();
    utils.writeEmptyConfigFile();
    let config = utils.readConfigFile();
    config.stamps[mockStamp.MOCK_STAMP] = {
      admission: mockStamp.MOCK_STAMP_ADMISSION
    }
    utils.overwriteConfigFile(config);
  });

  after(() => {
    mockStamp.shutdown();
    cp.execSync(`rm ${utils.configuration.configFileName}`)
  });

  it('Info command should be able to retrieve information about deploymenets', done => {
    workspace.info('deployments', mockStamp.MOCK_STAMP )
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
    workspace.info('fail', mockStamp.MOCK_STAMP )
      .then(success => {
        done('Info operation succeeded when expected it to fail')
      })
      .catch(err => {
        done();
      });
  });

  it('Info command should be able to retrieve information about registries', done => {
    workspace.info('registries', mockStamp.MOCK_STAMP )
      .then(success => {
        assert.equal(success, true);
        done();
      })
      .catch(err => {
        done(err);
      })
  });
});
