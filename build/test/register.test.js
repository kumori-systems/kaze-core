"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const fs = require("fs");
const cp = require("child_process");
const mockStamp = require("./mockStamp");
const utils = require("../src/utils");
const path = require("path");
const index_1 = require("../src/index");
describe('Register command tests', () => {
    before(() => {
        mockStamp.launch();
        fs.writeFileSync('test.zip', '');
        utils.setupQuestionForTest();
    });
    after(() => {
        mockStamp.shutdown();
        cp.execSync('rm test.zip');
    });
    beforeEach(() => {
        let builtsDirectory = path.join('.', 'builts');
        if (!fs.existsSync(builtsDirectory)) {
            console.warn('"builts" directory does not exist, initializing...');
            utils.mkdir(builtsDirectory);
        }
    });
    afterEach(() => {
        cp.execSync('rm -rf builts');
    });
    it('Register command works with bundle zip', done => {
        index_1.workspace.register(['test.zip'], 'http://localhost:3018')
            .then(result => {
            console.log("RESULT", JSON.stringify(result));
            assert.equal(result.successful.length, 1);
            assert.equal(result.errors.length, 2);
            assert.equal(result.deployments.length, 1);
            done();
        })
            .catch(err => {
            done(err);
        });
    });
    it('Register command must work fine by bundling first while receiving directory as parameter', done => {
        index_1.workspace.register(['builts'], 'http://localhost:3018')
            .then(result => {
            assert.equal(fs.existsSync('builts/test.zip'), true);
            assert.equal(result.successful.length, 1);
            assert.equal(result.errors.length, 2);
            assert.equal(result.deployments.length, 1);
            done();
        })
            .catch(err => {
            done(err);
        });
    });
    it('While executing register command with multiple arguments, it should skip those not applicable', done => {
        index_1.workspace.register(['builts', 'notApplicable.rar', 'Manifest.json', 'test.zip'], 'http://localhost:3018')
            .then(result => {
            assert.equal(result.successful.length, 2, "Number of registered elements invalid");
            assert.equal(result.errors.length, 4, "Number of failed elements invalid");
            assert.equal(result.deployments.length, 2, "Number of deployments invalid");
            done();
        })
            .catch(err => {
            done(err);
        });
    });
    it('When registering something aplicable to register command but with errorneous content, execution should fail', done => {
        index_1.workspace.register(['builts', 'failFlag.zip'], 'http://localhost:3018')
            .then(result => {
            assert.equal(result.successful.length, 1);
            assert.equal(result.errors.length, 2);
            assert.equal(result.deployments.length, 1);
            done();
        })
            .catch(err => {
            done(err);
        });
    });
});
//# sourceMappingURL=register.test.js.map