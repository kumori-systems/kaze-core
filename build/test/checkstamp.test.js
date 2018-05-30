"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const mockStamp = require("./mockStamp");
const utils_1 = require("../src/utils");
describe('Register command tests', () => {
    before(() => {
        mockStamp.launch();
    });
    after(() => {
        mockStamp.shutdown();
    });
    it('Check correct stamp', function () {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield utils_1.checkStamp('http://localhost:3018', false);
            console.log("STATUS", result);
            assert.equal(result.successful, true);
            assert.equal(result.code, 200);
        });
    });
    it('Check wrong stamp URL', function () {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield utils_1.checkStamp('http://fake.stamp', false);
            console.log("STATUS", result);
            assert.equal(result.successful, false);
            assert.equal(result.code, undefined);
        });
    });
    it('Check correct stamp path', function () {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield utils_1.checkStamp('http://localhost:3018/wrongpath', false);
            console.log("STATUS", result);
            assert.equal(result.successful, false);
            assert.equal(result.code, 404);
        });
    });
});
//# sourceMappingURL=checkstamp.test.js.map