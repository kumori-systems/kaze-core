"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const fs = require("fs");
const cp = require("child_process");
const index_1 = require("../src/index");
process.env.NODE_ENV = 'test';
describe('Init command tests', () => {
    after(() => {
        cp.execSync('rmdir builts components dependencies deployments resources runtimes services tests');
        cp.execSync('rm -rf kazeConfig.json');
    });
    it('Init command creates properly all directories', done => {
        index_1.workspace.init()
            .then(success => {
            assert.equal(success, true);
            assert.equal(fs.existsSync('builts'), true);
            assert.equal(fs.existsSync('components'), true);
            assert.equal(fs.existsSync('dependencies'), true);
            assert.equal(fs.existsSync('deployments'), true);
            assert.equal(fs.existsSync('resources'), true);
            assert.equal(fs.existsSync('runtimes'), true);
            assert.equal(fs.existsSync('services'), true);
            assert.equal(fs.existsSync('tests'), true);
            done();
        })
            .catch(err => {
            done(err);
        });
    });
    it('Init command should work with partial initialized workspaces', done => {
        index_1.workspace.init()
            .then(success => {
            assert.equal(success, true);
            done();
        })
            .catch(err => {
            done(err);
        });
    });
});
//# sourceMappingURL=init.test.js.map