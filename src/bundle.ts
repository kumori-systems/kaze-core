import * as fs from 'fs';
import * as path from 'path';
import * as child from 'child_process';
import * as utils from './utils';

export async function bundleCommand(paths: string[]): Promise<any> {
  try {
    let builtsDirectory = path.join('.', 'builts');
    if (!fs.existsSync(builtsDirectory)) {
      console.warn('"builts" directory does not exist, initializing...')
      utils.mkdir(builtsDirectory);
    }

    let validPaths = [];

    for (let path of paths) {
      if (!fs.existsSync(path)) {
        console.log(`Warning. Path ${path} does not exist. Skipping`);
      } else {
        validPaths.push(path);
      }
    }

    if (validPaths.length == 0) {
      console.log('No valid paths found.');
    } else {
      let zipName = await utils.question({ prompt: 'Output zip =', default: Date.now().toString() });
      let zipPath = path.join(builtsDirectory, zipName);
      let cmd = `zip -r ${zipPath} `.concat(validPaths.join(" "));
      console.log(`Bundling ${validPaths} into ${zipPath}.zip.`)
      // Execute zip command with a maximum buffer of 256MB
      child.execSync(cmd, { maxBuffer: (1024 ** 2) * 256 });
      return Promise.resolve(`${zipPath}.zip`);
    }
  } catch(e) {
    return Promise.reject({err: `Failed zipping ${paths}`, additionalInfo: e});
  }
}
