"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const component_1 = require("./component");
const deployment_1 = require("./deployment");
const service_1 = require("./service");
const localstamp_1 = require("./localstamp");
const runtime_1 = require("./runtime");
var interface_1 = require("./interface");
exports.IError = interface_1.IError;
const workspace_1 = require("./workspace");
const stamp_1 = require("./stamp");
exports.workspace = new workspace_1.Workspace(new component_1.Component(), new deployment_1.Deployment(), new localstamp_1.LocalStamp(), new runtime_1.Runtime(), new service_1.Service(), new stamp_1.Stamp());
//# sourceMappingURL=index.js.map