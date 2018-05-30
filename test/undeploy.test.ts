import * as mockStamp from './mockStamp';
import * as assert from 'assert';
import { workspace } from '../src/index';

describe('Undeploy command tests', () => {
  before(() => {
    mockStamp.launch();
  });

  after(() => {
    mockStamp.shutdown();
  });

  it('Undeploy command should work fine given a uri ', done => {
    workspace.undeploy(['slap://sampleservicecalculator/deployments/20171023_171124/8344a6c2'], 'http://localhost:3018')
      .then(result => {
        assert.equal(result.successful.length, 1);
        done();
      })
      .catch(err => {
        done(err.additionalInfo);
      })
  });
});
