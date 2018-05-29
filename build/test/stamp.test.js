"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../src/utils");
const cp = require("child_process");
const should = require("should");
const index_1 = require("../src/index");
const defaultConfig = {
    "working-stamp": "",
    "stamps": {}
};
const readConfig = function () {
    return utils_1.readConfigFile();
};
describe('Stamp command', () => {
    before(() => {
        utils_1.writeEmptyConfigFile();
    });
    after(() => {
        cp.execSync('rm -f kazeConfig.json');
    });
    describe('add subcommand', () => {
        it('should add a new stamp with <id> and <url> to kazeConfig.json', () => {
            index_1.workspace.stamp.add('id1', 'url1', undefined, undefined, defaultConfig);
            should(utils_1.readConfigFile()).have.property('stamps').with.properties({ 'id1': 'url1' });
        });
        it('should fail when adding a stamp with the same <id> of some current stamps if force flag is not set', () => {
            const configBeforeAdd = utils_1.readConfigFile();
            index_1.workspace.stamp.add('id1', 'url1', undefined, undefined, configBeforeAdd);
            should(utils_1.readConfigFile()).deepEqual(configBeforeAdd);
        });
        it('should success when adding a stamp with the same <id> of some current stamps if force flag is set', () => {
            index_1.workspace.stamp.add('id1', 'url11', undefined, true, utils_1.readConfigFile());
            should(utils_1.readConfigFile()).have.property('stamps').with.properties({ 'id1': 'url11' });
        });
        it('"kaze stamp add" with force flag set should modify working stamp if working stamp is the overwritten stamp', () => {
            index_1.workspace.stamp.switch('id1', readConfig());
            index_1.workspace.stamp.add('id1', 'url111', undefined, true, utils_1.readConfigFile());
            const config = utils_1.readConfigFile();
            should(config).have.property('working-stamp').equal('id1');
            should(config).have.property('stamps').with.properties({ 'id1': 'url111' });
        });
        it('"kaze stamp add" with default flag set should overwrite current working stamp', () => {
            index_1.workspace.stamp.add('id2', 'url2', true, undefined, utils_1.readConfigFile());
            const config = utils_1.readConfigFile();
            should(config).have.property('stamps').with.property('id2').equal('url2');
            should(config).have.property('working-stamp').equal('id2');
        });
    });
    describe('rm subcommand', () => {
        it('"kaze stamp rm" should fail when removing current working stamp', () => {
            const configBeforeRm = utils_1.readConfigFile();
            index_1.workspace.stamp.remove('id2', configBeforeRm);
            should(utils_1.readConfigFile()).deepEqual(configBeforeRm);
        });
        it('"kaze stamp rm" should fail if there is not a stamp with <id>', () => {
            const configBeforeRm = utils_1.readConfigFile();
            index_1.workspace.stamp.remove('This id does not exist', configBeforeRm);
            should(utils_1.readConfigFile()).deepEqual(configBeforeRm);
        });
        it('"kaze stamp rm" should remove the stamp with <id> if there is such stamp', () => {
            index_1.workspace.stamp.remove('id1', readConfig());
            should(readConfig()).have.property('stamps').with.properties({ "id2": "url2" });
        });
    });
    describe('switch subcommand', () => {
        it('"kaze stamp switch" should switch working stamp to the stamp with <id>', () => {
            index_1.workspace.stamp.add('id3', 'url3', undefined, undefined, utils_1.readConfigFile());
            index_1.workspace.stamp.switch('id3', utils_1.readConfigFile());
            should(utils_1.readConfigFile()).have.property('working-stamp').equal('id3');
        });
        it('"kaze stamp switch" should fail if there is not a stamp with <id>', () => {
            const configBeforeSwitch = utils_1.readConfigFile();
            index_1.workspace.stamp.switch('This id does not exist', configBeforeSwitch);
            should(utils_1.readConfigFile()).deepEqual(configBeforeSwitch);
        });
    });
});
//# sourceMappingURL=stamp.test.js.map