import * as fs from 'fs';
import * as path from 'path';
import * as utils from './utils';
import { ncp } from 'ncp';

export async function initCommand(templatesPath?:string): Promise<boolean> {
  console.log('Initializing workspace following standard SaaSDK project hierarchy...');
  return new Promise<boolean>( (resolve, reject) => {
    try {
      const stdDirs: string[] = [
        'builts', 'components', 'dependencies', 'deployments', 'resources', 'runtimes', 'services', 'templates', 'tests'
      ];

      for (let dir of stdDirs) {
        utils.createPath(dir);
    }
      
      if (fs.existsSync('kazeConfig.json')) {
        console.log('"kazeConfig.json" already exists, skipping.')
      } else {
        console.log('Initializing "kazeConfig.json" for this workspace...');
        utils.writeEmptyConfigFile();
      }

      let destination = path.join(`${process.cwd()}`, 'templates');
      let source = (templatesPath ? templatesPath : path.join(__dirname,'../../templates'));

      let relative = path.relative(destination, source);
      if (relative && (relative.length > 0)) {
        ncp(source, destination, function (error) {
          if (error) {
            reject(error);
          } else {
            resolve(true);
          }
        });
      } else {
        resolve(true);
      }
    } catch(error) {
      reject(error);
    }
  });
}
