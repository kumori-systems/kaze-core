import { writeEmptyConfigFile, readConfigFile, StampConfig } from '../lib/utils';
import * as cp from 'child_process';
import * as path from 'path';
import * as should from 'should';
import { workspace } from '../lib/index';

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
      let config:StampConfig = {
        admission: 'url1'
      }
      workspace.stamp.add('id1', config, false);
      should(readConfigFile()).have.property('stamps').with.properties({ 'id1': { admission: 'url1' } });
    });

    it('should fail when adding a stamp with the same <id> of some current stamps if force flag is not set', () => {
      const configBeforeAdd = readConfigFile();
      let config:StampConfig = {
        admission: 'url12'
      }
      workspace.stamp.add('id1', config, false);
      should(readConfigFile()).deepEqual(configBeforeAdd);
    });

    it('should success when updating an existing stamp', () => {
      let config:StampConfig = {
        admission: 'url11'
      }
      workspace.stamp.update('id1', config);
      should(readConfigFile()).have.property('stamps').with.properties({ 'id1': { admission: 'url11'} });
    });

    it('"kaze stamp add" with default flag set should overwrite current working stamp', () => {
      let config:StampConfig = {
        admission: 'url2'
      }
      workspace.stamp.add('id2', config, true);
      should(readConfigFile()).have.property('stamps').with.property('id2').with.property('admission').equal('url2');
      should(readConfigFile()).have.property('working-stamp').equal('id2');
    });
  });

  describe('rm subcommand', () => {
    it('"kaze stamp rm" should fail when removing current working stamp', () => {
      const configBeforeRm = readConfigFile();

      workspace.stamp.remove('id2');
      should(readConfigFile()).deepEqual(configBeforeRm);
    });


    it('"kaze stamp rm" should fail if there is not a stamp with <id>', () => {
      const configBeforeRm = readConfigFile();

      workspace.stamp.remove('wrongid');
      should(readConfigFile()).deepEqual(configBeforeRm);
    });
  });

  describe('switch subcommand', () => {
    it('"kaze stamp switch" should switch working stamp to the stamp with <id>', () => {
      let config:StampConfig = {
        admission: 'url3'
      }
      workspace.stamp.add('id3', config, false);
      workspace.stamp.use('id3');
      should(readConfigFile()).have.property('working-stamp').equal('id3');
    });

    it('"kaze stamp switch" should fail if there is not a stamp with <id>', () => {
      const configBeforeSwitch = readConfigFile();

      workspace.stamp.use('wrongid');
      should(readConfigFile()).deepEqual(configBeforeSwitch);
    });
  });
});
