import * as utils from '../lib/utils';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import * as assert from 'assert';
import { Service } from '../lib/service';
import { Project } from '../lib/project';
import * as path from 'path';

process.env.NODE_ENV = 'test';

const KAZE_CONFIG = `${process.env.PWD}/kumoriConfig.json`;
const SERVICES_DIR = `${process.env.PWD}/services`;
const COMPONENTS_DIR = `${process.env.PWD}/components`;
const CONFIG1= {
    name: 'test1',
    domain: 'acme.com'
}
const CONFIG2= {
    name: 'test2',
    domain: 'acme.com'
}

const service = new Service()
const project = new Project()


describe('Service command tests', function () {

    before(function () {
        utils.writeEmptyConfigFile();
    });

    after(function (done) {
        let error:Error = undefined;
        let folders = [ COMPONENTS_DIR, SERVICES_DIR ];

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

    it('add', function () {
        this.timeout(5000)
        return service.add('kumori-service-basic', CONFIG1)
        .then( () => {
            let data = fs.readFileSync(`${SERVICES_DIR}/${CONFIG1.domain}/${CONFIG1.name}/Manifest.json`,'utf8');
            assert.equal(data.includes(`eslap://${CONFIG1.domain}/services/${CONFIG1.name}/0_0_1`), true);
        })
    });

    it('getRootPath', function () {
        assert.equal(service.getRootPath(), './services')
    })

    it('getRoles', function() {
        this.timeout(5000)
        return project.add('kumori-project-hello-world', CONFIG2)
        .then(function () {
            let roles = service.getRoles(CONFIG2)
            assert.equal(roles.length, 1)
            assert.equal(roles[0].name, 'test2-fe')
            assert.equal(roles[0].component, 'eslap://acme.com/components/test2/0_0_1')
        })
    })

    it('getProvidedChannels', function() {
        let channels = service.getProvidedChannels(CONFIG2)
        assert.equal(channels.length, 1)
        assert.equal(channels[0].name, 'service')
        assert.equal(channels[0].type, 'eslap://eslap.cloud/channel/reply/1_0_0')
        assert.equal(channels[0].protocol, 'eslap://eslap.cloud/protocol/message/http/1_0_0')
    })

    it('getRequiredChannels', function() {
        let manifestPath = path.resolve(SERVICES_DIR, CONFIG2.domain, CONFIG2.name, 'Manifest.json');
        let manifest = service.getManifest(CONFIG2)
        manifest.channels.requires.push({
            name: "required1",
            type: "eslap://eslap.cloud/channel/request/1_0_0",
            protocol: "eslap://eslap.cloud/protocol/message/http/1_0_0"
        })
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
        let channels = service.getRequiredChannels(CONFIG2)
        assert.equal(channels.length, 1)
        assert.equal(channels[0].name, 'required1')
        assert.equal(channels[0].type, 'eslap://eslap.cloud/channel/request/1_0_0')
        assert.equal(channels[0].protocol, 'eslap://eslap.cloud/protocol/message/http/1_0_0')
    })

    it('getParameters', function() {
        let params = service.getParameters(CONFIG2)
        assert.equal(params.length, 1)
        assert.equal(params[0].name, 'test2-fe')
        assert.equal(params[0].type, utils.ParameterType.JSON)
    })

    it('getResources', function() {
        let manifestPath = path.resolve(SERVICES_DIR, CONFIG2.domain, CONFIG2.name, 'Manifest.json');
        let manifest = service.getManifest(CONFIG2)
        manifest.configuration.resources.push({
            name: "mockDisk",
            type: "eslap://eslap.cloud/resource/volume/persistent/1_0_0"
        })
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
        let resources = service.getResources(CONFIG2)
        assert.equal(resources.length, 1)
        assert.equal(resources[0].name, 'mockDisk')
        assert.equal(resources[0].type, utils.ResourceType.VOLUME_PERSITENT)
    })

    it('getComponents', function() {
        let components = service.getComponents(CONFIG2)
        assert.equal(components.length, 1)
        assert.equal(components[0], 'eslap://acme.com/components/test2/0_0_1')
    })

    it('getDistributableFile', function(done) {
        let config = {
           name: CONFIG2.name,
           domain: CONFIG2.domain,
           version: '0_0_1'
        }
        let manifestPath = path.resolve(SERVICES_DIR, CONFIG2.domain, CONFIG2.name, 'Manifest.json');
        service.getDistributableFile(config)
        .then(function (distPath) {
            let relative = path.relative(distPath, manifestPath);
            assert.equal(relative, '')
            config.version = '0_0_2'
            return service.getDistributableFile(config)
        })
        .then(function (result) {
            done(new Error('Version is not properly checked'))
        })
        .catch(function  (error) {
            assert.equal(error.message, `Version "${config.version}" of service "${config.domain}/${config.name}" not found in the workspace`)
            done()
        })
    })

    it('checkVersion', function() {
        let config = {
            name: CONFIG2.name,
            domain: CONFIG2.domain,
            version: '0_0_1'
        }
        service.checkVersion(config)
        .then(function (checked) {
            assert.ok(checked)
            config.version = '0_0_2'
            return service.checkVersion(config)
        })
        .then(function (checked) {
            assert.ok(!checked)
        })
    })

    it('getCurrentVersion', function() {
        return service.getCurrentVersion(CONFIG2)
        .then(function(version) {
            assert.equal(version, '0_0_1')
        })
    })
});