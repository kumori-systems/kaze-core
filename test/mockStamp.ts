import * as express from 'express';
import * as http from 'http';

const stamp = express();
let server;

export const MOCK_STAMP = 'mockstamp'
export const MOCK_STAMP_ADMISSION = 'http://localhost:3018'

export function launch() {
  stamp.post('/admission/bundles', (req, res) => {
    res.send(
      {
        success: true,
        message: '/admission/bundles received POST operation',
        data: {
          successful: ['Testing'],
          errors: ['Testing'],
          deployments: {
            errors: ['Testing'],
            successful: [{
              deploymentURN: 'Testing',
              topology: {
                serviceURN: 'Testing',
              },
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
    res.send(
      {
        success: true,
        message: '/admission/deployments received GET operation'
      }
    );
  });

  stamp.delete('/admission/deployments', (req, res) => {
    res.send(
      {
        success: true,
        message: '/admission/deployments received DELETE operation'
      }
    );
  });

  stamp.get('/admission/registries', (req, res) => {
    res.send(
      {
        success: true,
        message: '/admission/registries received GET operation'
      }
    );
  });

  server = stamp.listen(3018);
}

export function shutdown() {
  server.close();
}
