"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child = require("child_process");
class LocalStamp {
    constructor() {
        this.saasdk = undefined;
    }
    start() {
        this._runInSaasdk('start');
    }
    stop() {
        this._runInSaasdk('stop');
    }
    restart() {
        this._runInSaasdk('restart');
    }
    ssh() {
        this._runInSaasdk('ssh');
    }
    status() {
        this._runInSaasdk('status');
    }
    _runInSaasdk(action, params) {
        if (this.saasdk != undefined) {
            console.log("LocalStamp is busy");
        }
        else {
            let args = [action];
            if ((params != undefined) && (params.length > 0)) {
                for (let param of params) {
                    args.push(param);
                }
            }
            this.saasdk = child.spawn('saasdk', args, {
                stdio: 'inherit'
            });
        }
    }
}
exports.LocalStamp = LocalStamp;
//# sourceMappingURL=localstamp.js.map