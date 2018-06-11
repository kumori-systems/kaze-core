const TMP_FOLDER = '/tmp'

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
export function createInboundManifest(name: string): any {
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
            TLS:false,
            clientcert:false
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
    }
    return manifest
}

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
export function createLinkManifest(urn1: string, ch1: string, urn2: string, ch2: string): any {
    let manifest = {
        spec: "http://eslap.cloud/manifest/link/1_0_0",
        endpoints: [
            { deployment: urn1, channel: ch1 },
            { deployment: urn2, channel: ch2 }
        ]
    }
    return manifest
}

export async function saveManifestInTemporaryFolder(manifest: any): Promise<string> {
    return ""
}