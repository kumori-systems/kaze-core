"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const fs = require("fs");
const cp = require("child_process");
const mockStamp = require("./mockStamp");
const utils = require("../src/utils");
const index_1 = require("../src/index");
describe('Deploy command tests', () => {
    before(() => {
        mockStamp.launch();
        fs.writeFileSync('test.zip', '');
        fs.writeFileSync('Manifest.json', '');
        utils.setupQuestionForTest();
    });
    after(() => {
        mockStamp.shutdown();
        cp.execSync('rm -rf builts');
        cp.execSync('rm test.zip Manifest.json');
    });
    it('Deploy command works with bundle zip', done => {
        index_1.workspace.deploy(['test.zip'], 'http://localhost:3018')
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
    it('Deploy command should work fine by bundling first while receiving Manifest.json as parameter', done => {
        index_1.workspace.deploy(['Manifest.json'], 'http://localhost:3018')
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
    it('Deploy command should work fine by bundling first while receiving directory as parameter', done => {
        index_1.workspace.deploy(['builts'], 'http://localhost:3018')
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
    it('While executing deploy command with multiple arguments, it should skip those not applicable', done => {
        index_1.workspace.deploy(['builts', 'notApplicable.rar', 'Manifest.json', 'skip.skip'], 'http://localhost:3018')
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
    it('When deploying something aplicable to deploy command but with errorneous content, execution should fail', done => {
        index_1.workspace.deploy(['builts', 'failFlag.zip', 'Manifest.json'], 'http://localhost:3018')
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
//# sourceMappingURL=deploy.test.js.map