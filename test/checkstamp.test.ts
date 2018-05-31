import * as assert from 'assert';
import * as mockStamp from './mockStamp';
import * as utils from '../lib/utils';
import * as cp from 'child_process';

const MOCK_STAMP = 'mockstamp'
const MOCK_STAMP_ADMISSION = 'http://localhost:3018'

describe('Check stamp tests', () => {
  before(() => {
    mockStamp.launch();
    utils.writeEmptyConfigFile();
    let config = utils.readConfigFile();
    config.stamps[MOCK_STAMP] = {
      admission: MOCK_STAMP_ADMISSION
    }
    utils.overwriteConfigFile(config);
  });

  after(() => {
    mockStamp.shutdown();
    cp.execSync(`rm ${utils.configuration.configFileName}`)
  });

  it('Check correct stamp', async function() {
    let result = await utils.checkStamp(MOCK_STAMP, false)
    console.log("STATUS", result);
    assert.equal(result.successful, true);
    assert.equal(result.code, 200);
  });

  it('Check wrong stamp URL', async function() {
    let result = await utils.checkStamp('FAKE_STAMP', false)
    console.log("STATUS", result);
    assert.equal(result.successful, false);
    assert.equal(result.code, undefined);
  });

});
