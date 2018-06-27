"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admission_client_1 = require("@kumori/admission-client");
var admission_client_2 = require("@kumori/admission-client");
exports.FileStream = admission_client_2.FileStream;
exports.RegistrationResult = admission_client_2.RegistrationResult;
class StampStubImpl extends admission_client_1.AdmissionClient {
}
exports.StampStubImpl = StampStubImpl;
class StampStubFactoryImpl {
    getStub(basePath, accessToken) {
        return new StampStubImpl(basePath, accessToken);
    }
}
exports.StampStubFactoryImpl = StampStubFactoryImpl;
//# sourceMappingURL=index.js.map