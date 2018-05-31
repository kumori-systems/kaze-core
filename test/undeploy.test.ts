import * as mockStamp from './mockStamp';
import * as assert from 'assert';
import { workspace } from '../lib/index';
import * as cp from 'child_process';
import * as utils from '../lib/utils';

describe('Undeploy command tests', () => {
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

  it('Undeploy command should work fine given a uri ', done => {
    workspace.undeploy(['slap://sampleservicecalculator/deployments/20171023_171124/8344a6c2'], mockStamp.MOCK_STAMP )
      .then(result => {
        assert.equal(result.successful.length, 1);
        done();
      })
      .catch(err => {
        done(err.additionalInfo);
      })
  });
});
