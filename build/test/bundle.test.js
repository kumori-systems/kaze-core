"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { bundleCommand } from '../src/bundle';
const cp = require("child_process");
const assert = require("assert");
const fs = require("fs");
const utils = require("../src/utils");
const index_1 = require("../src/index");
process.env.NODE_ENV = 'test';
describe('Bundle command tests', () => {
    before(() => {
        fs.writeFileSync('Manifest.json', '');
        utils.setupQuestionForTest();
    });
    afterEach(() => {
        cp.execSync('rm -rf builts');
    });
    after(() => {
        cp.execSync('rm Manifest.json');
    });
    it('Bundle command creates "builts" if does not exist', done => {
        index_1.workspace.bundle(['Manifest.json'])
            .then(resultZip => {
            assert.equal(fs.existsSync('builts'), true);
            done();
        })
            .catch(err => {
            done(err);
        });
    });
    it('Bundle command creates and places correctly bundle', done => {
        index_1.workspace.bundle(['Manifest.json'])
            .then(resultZip => {
            assert.equal(fs.existsSync(resultZip), true);
            done();
        })
            .catch(err => {
            done(err);
        });
    });
    it('Bundle command should fail when receiving something pointing to null or not zippable', done => {
        index_1.workspace.bundle(['shoudFail/doesIt'])
            .then(resultZip => {
            assert.equal(fs.existsSync(resultZip), false);
            done();
        })
            .catch(err => {
            done(err);
        });
    });
});
//# sourceMappingURL=bundle.test.js.map