import * as assert from 'assert';
import * as mockStamp from './mockStamp';
import { checkStamp } from '../src/utils';

describe('Register command tests', () => {
  before(() => {
    mockStamp.launch();
  });

  after(() => {
    mockStamp.shutdown();
  });

  it('Check correct stamp', async function() {
    let result = await checkStamp('http://localhost:3018', false)
    console.log("STATUS", result);
    assert.equal(result.successful, true);
    assert.equal(result.code, 200);
  });

  it('Check wrong stamp URL', async function() {
    let result = await checkStamp('http://fake.stamp', false)
    console.log("STATUS", result);
    assert.equal(result.successful, false);
    assert.equal(result.code, undefined);
  });

  it('Check correct stamp path', async function() {
    let result = await checkStamp('http://localhost:3018/wrongpath', false)
    console.log("STATUS", result);
    assert.equal(result.successful, false);
    assert.equal(result.code, 404);
  });
});
