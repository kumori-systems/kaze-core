import { writeEmptyConfigFile, readConfigFile } from '../src/utils';
import * as cp from 'child_process';
import * as path from 'path';
import * as should from 'should';
import { workspace } from '../src/index';

const defaultConfig = {
  "working-stamp": "",
  "stamps": {}
};

const readConfig = function () {
  return readConfigFile();
}

describe('Stamp command', () => {
  before(() => {
    writeEmptyConfigFile();
  });

  after(() => {
    cp.execSync('rm -f kumoriConfig.json');
  });

  describe('add subcommand', () => {
    it('should add a new stamp with <id> and <url> to kumoriConfig.json', () => {
      workspace.stamp.add('id1', 'url1', undefined, undefined, defaultConfig);
      should(readConfigFile()).have.property('stamps').with.properties({ 'id1': 'url1' });
    });

    it('should fail when adding a stamp with the same <id> of some current stamps if force flag is not set', () => {
      const configBeforeAdd = readConfigFile();
      workspace.stamp.add('id1', 'url1', undefined, undefined, configBeforeAdd);
      should(readConfigFile()).deepEqual(configBeforeAdd);
    });

    it('should success when adding a stamp with the same <id> of some current stamps if force flag is set', () => {
      workspace.stamp.add('id1', 'url11', undefined, true, readConfigFile());
      should(readConfigFile()).have.property('stamps').with.properties({ 'id1': 'url11' });
    });

    it('"kaze stamp add" with force flag set should modify working stamp if working stamp is the overwritten stamp', () => {
      workspace.stamp.switch('id1', readConfig());
      workspace.stamp.add('id1', 'url111', undefined, true, readConfigFile());

      const config = readConfigFile();
      should(config).have.property('working-stamp').equal('id1');
      should(config).have.property('stamps').with.properties({ 'id1': 'url111' });
    });

    it('"kaze stamp add" with default flag set should overwrite current working stamp', () => {
      workspace.stamp.add('id2', 'url2', true, undefined, readConfigFile());

      const config = readConfigFile();
      should(config).have.property('stamps').with.property('id2').equal('url2');
      should(config).have.property('working-stamp').equal('id2');
    });
  });

  describe('rm subcommand', () => {
    it('"kaze stamp rm" should fail when removing current working stamp', () => {
      const configBeforeRm = readConfigFile();

      workspace.stamp.remove('id2', configBeforeRm);
      should(readConfigFile()).deepEqual(configBeforeRm);
    });


    it('"kaze stamp rm" should fail if there is not a stamp with <id>', () => {
      const configBeforeRm = readConfigFile();

      workspace.stamp.remove('This id does not exist', configBeforeRm);
      should(readConfigFile()).deepEqual(configBeforeRm);
    });

    it('"kaze stamp rm" should remove the stamp with <id> if there is such stamp', () => {
      workspace.stamp.remove('id1', readConfig());
      should(readConfig()).have.property('stamps').with.properties({"id2":"url2"});
    });
  });

  describe('switch subcommand', () => {
    it('"kaze stamp switch" should switch working stamp to the stamp with <id>', () => {
      workspace.stamp.add('id3', 'url3', undefined, undefined, readConfigFile());

      workspace.stamp.switch('id3', readConfigFile());
      should(readConfigFile()).have.property('working-stamp').equal('id3');
    });

    it('"kaze stamp switch" should fail if there is not a stamp with <id>', () => {
      const configBeforeSwitch = readConfigFile();

      workspace.stamp.switch('This id does not exist', configBeforeSwitch);
      should(readConfigFile()).deepEqual(configBeforeSwitch);
    });
  });
});
