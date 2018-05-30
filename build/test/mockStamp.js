"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const stamp = express();
let server;
function launch() {
    stamp.post('/admission/bundles', (req, res) => {
        res.send({
            success: true,
            message: '/admission/bundles received POST operation',
            data: {
                successful: ['Testing'],
                errors: ['Testing'],
                deployments: {
                    errors: ['Testing'],
                    successful: [{
                            deploymentURN: 'Testing',
                            portMapping: [{
                                    iid: "iid",
                                    role: "role",
                                    endpoint: "endpoint",
                                    port: "9000"
                                }]
                        }]
                }
            }
        });
    });
    stamp.get('/admission/deployments', (req, res) => {
        // res.send('/admission/deployments received GET operation');
        res.send({
            success: true,
            message: '/admission/deployments received GET operation'
        });
    });
    stamp.delete('/admission/deployments', (req, res) => {
        res.send({
            success: true,
            message: '/admission/deployments received DELETE operation'
        });
    });
    stamp.get('/admission/registries', (req, res) => {
        res.send({
            success: true,
            message: '/admission/registries received GET operation'
        });
    });
    server = stamp.listen(3018);
}
exports.launch = launch;
function shutdown() {
    server.close();
}
exports.shutdown = shutdown;
//# sourceMappingURL=mockStamp.js.map