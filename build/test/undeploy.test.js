"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mockStamp = require("./mockStamp");
const assert = require("assert");
const index_1 = require("../src/index");
describe('Undeploy command tests', () => {
    before(() => {
        mockStamp.launch();
    });
    after(() => {
        mockStamp.shutdown();
    });
    it('Undeploy command should work fine given a uri ', done => {
        index_1.workspace.undeploy(['slap://sampleservicecalculator/deployments/20171023_171124/8344a6c2'], 'http://localhost:3018')
            .then(result => {
            assert.equal(result.successful.length, 1);
            done();
        })
            .catch(err => {
            done(err.additionalInfo);
        });
    });
});
//# sourceMappingURL=undeploy.test.js.map