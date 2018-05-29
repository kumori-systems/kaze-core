"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const mockStamp = require("./mockStamp");
const index_1 = require("../src/index");
describe('Info command tests', () => {
    before(() => {
        mockStamp.launch();
    });
    after(() => {
        mockStamp.shutdown();
    });
    it('Info command should be able to retrieve information about deploymenets', done => {
        index_1.workspace.info('deployments', 'http://localhost:3018')
            .then(success => {
            assert.equal(success, true);
            done();
        })
            .catch(err => {
            console.log(`Error: ${JSON.stringify(err)}`);
            done(err);
        });
    });
    it('Info command should fail when requesting to retrieve unsupported information', done => {
        index_1.workspace.info('fail', 'http://localhost:3018')
            .then(success => {
            done('Info operation succeeded when expected it to fail');
        })
            .catch(err => {
            done();
        });
    });
    it('Info command should be able to retrieve information about registries', done => {
        index_1.workspace.info('registries', 'http://localhost:3018')
            .then(success => {
            assert.equal(success, true);
            done();
        })
            .catch(err => {
            done(err);
        });
    });
});
//# sourceMappingURL=info.test.js.map