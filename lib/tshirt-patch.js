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
const TMP_FOLDER = '/tmp';
/*
{
  "spec": "http://eslap.cloud/manifest/deployment/1_0_0",
  "servicename": "eslap://eslap.cloud/services/http/inbound/1_0_0",
  "name": "inbound-deployment",
  "configuration": {
    "resources": {
      "server_cert": null,
      "vhost": null
    },
    "parameters": {
      "TLS":false,
      "clientcert":false
    }
  },
  "roles": {
    "sep": {
      "resources": {
        "__instances": 1,
        "__cpu": 1,
        "__memory": 1,
        "__ioperf": 1,
        "__iopsintensive": false,
        "__bandwidth": 100,
        "__resilience": 1
      }
    }
  }
}
*/
function createInboundManifest(name) {
    let manifest = {
        spec: "http://eslap.cloud/manifest/deployment/1_0_0",
        servicename: "eslap://eslap.cloud/services/http/inbound/1_0_0",
        name: name,
        configuration: {
            resources: {
                server_cert: null,
                vhost: null
            },
            parameters: {
                TLS: false,
                clientcert: false
            }
        },
        roles: {
            sep: {
                resources: {
                    __instances: 1,
                    __cpu: 1,
                    __memory: 1,
                    __ioperf: 1,
                    __iopsintensive: false,
                    __bandwidth: 10,
                    __resilience: 1
                }
            }
        }
    };
    return manifest;
}
exports.createInboundManifest = createInboundManifest;
/*
{
  "spec": "http://eslap.cloud/manifest/link/1_0_0",
  "endpoints": [
    {
      "deployment": "inbound-deployment",
      "channel": "frontend"
    },
    {
      "deployment": "webapp-deployment",
      "channel": "service"
    }
  ]
}
*/
function createLinkManifest(urn1, ch1, urn2, ch2) {
    let manifest = {
        spec: "http://eslap.cloud/manifest/link/1_0_0",
        endpoints: [
            { deployment: urn1, channel: ch1 },
            { deployment: urn2, channel: ch2 }
        ]
    };
    return manifest;
}
exports.createLinkManifest = createLinkManifest;
function saveManifestInTemporaryFolder(manifest) {
    return __awaiter(this, void 0, void 0, function* () {
        return "";
    });
}
exports.saveManifestInTemporaryFolder = saveManifestInTemporaryFolder;
//# sourceMappingURL=tshirt-patch.js.map