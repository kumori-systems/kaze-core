import * as utils from '../lib/utils';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import * as assert from 'assert';
import { Resource } from '../lib/resource';
import * as path from 'path';

process.env.NODE_ENV = 'test';

const KAZE_CONFIG = `${process.env.PWD}/kumoriConfig.json`;
const RESOURCES_DIR = `${process.env.PWD}/resources`;
const CONFIG = {
    name: 'test1',
    domain: 'acme.com'
}

const resource = new Resource()


describe('Resource command tests', function () {

    before(function () {
        utils.writeEmptyConfigFile();
    });

    after(function (done) {
        let error:Error = undefined;
        let folders = [ RESOURCES_DIR ];

        for (let folder of folders) {
          try {
            let stats = fs.statSync(folder);
            if (stats.isDirectory()) {
              rimraf.sync(folder);
            } else {
              error = new Error(`${folder} is not a folder`);
            }
          } catch(err) {
            error = err;
          }
        }
        try {
            let stats = fs.statSync(KAZE_CONFIG)
            if (stats.isFile()) {
                rimraf.sync(KAZE_CONFIG)
            } else {
                error = new Error(`${KAZE_CONFIG} is not a file`)
            }
        } catch(err) {
            error = err;
        }
        if (error) {
            done(error);
        } else {
            done();
        }
    });

    it('add and getManifest', function () {
        this.timeout(5000)
        return resource.add('@kumori/workspace:resource-vhost', CONFIG)
        .then( () => {
            let data = resource.getManifest(CONFIG);
            assert.equal(data.name, `eslap://${CONFIG.domain}/resources/vhost/${CONFIG.name}`);
        })
    });

    it('getRootPath', function () {
        assert.equal(path.relative(resource.getRootPath(), RESOURCES_DIR), '')
    })

    it('getDistributableFile', function() {
        let manifestPath = path.resolve(RESOURCES_DIR, CONFIG.domain, CONFIG.name, 'Manifest.json');
        return resource.getDistributableFile(CONFIG)
        .then(function (distPath) {
            let relative = path.relative(distPath, manifestPath);
            assert.equal(relative, '')
        })
    })
});