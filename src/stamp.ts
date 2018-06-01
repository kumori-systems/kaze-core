import * as path from 'path';
import * as utils from './utils';
import { AdmissionClient, FileStream, RegistrationResult } from '@kumori/admission-client';
import { createReadStream, access, constants } from 'fs';

export class Stamp {

    public add(id: string, stampConfig: utils.StampConfig, defaultStamp: boolean) {
      let workspaceConfig = utils.readConfigFile();
      if (workspaceConfig['stamps'][id]) {
        console.error(`${utils.configuration.configFileName} already has a stamp with id: ${id}`);
        return;
      }
      if (defaultStamp || (workspaceConfig['working-stamp'] == workspaceConfig['stamps'][id])) {
        workspaceConfig['working-stamp'] = id;
      }

      let configCopy:utils.StampConfig = Object.assign({}, stampConfig);
      workspaceConfig['stamps'][id] = configCopy;

      utils.overwriteConfigFile(workspaceConfig);
    }

    public update(id: string, stampConfig: utils.StampConfig) {
      let workspaceConfig = utils.readConfigFile();
      if (!workspaceConfig['stamps'][id]) {
        console.error(`${utils.configuration.configFileName} does not contain any stamp with id: ${id}`);
        return;
      }

      let configCopy:utils.StampConfig = Object.assign({}, stampConfig);
      workspaceConfig['stamps'][id] = configCopy;

      utils.overwriteConfigFile(workspaceConfig);
    }

    public remove(id: string) {
      let workspaceConfig = utils.readConfigFile();
      if (!workspaceConfig['stamps'][id]) {
        console.error(`${utils.configuration.configFileName} does not contain any stamp with id: ${id}`);
        return;
      }

      if (workspaceConfig['working-stamp'] == id) {
        console.error('Cannot remove working stamp, please run first kaze switch <stamp-id>');
        return;
      }

      delete workspaceConfig['stamps'][id];
      utils.overwriteConfigFile(workspaceConfig);
    }

    public use(id: string) {
      let workspaceConfig = utils.readConfigFile();
      if (!workspaceConfig['stamps'][id]) {
        console.error(`${utils.configuration.configFileName} does not contain any stamp with id: ${id}`);
        return;
      }
      workspaceConfig['working-stamp'] = id;
      utils.overwriteConfigFile(workspaceConfig);
    }

    // Checks if a given element is registered in a given stamp.
    // TODO: to be implemented. Right now always returns `false`.
    //
    // Parameters:
    // * `stamp`: the stamp id as introduced in configuration file.
    // * `name`: the URN of the element to be checked.
    //
    // Returns: `true` if the element is registered in the stamp, `false`
    //  otherwise.
    public isRegistered(stamp: string, name: string): Promise<boolean> {
      try {
        if (!stamp) {
          return Promise.reject(new Error('Stamp name parameter is missing'));
        }
        if (!name) {
          return Promise.reject(new Error('Element name parameter is missing'));
        }
        let workspaceConfig = utils.readConfigFile();
        let stampConfig:utils.StampConfig = workspaceConfig.stamps && workspaceConfig.stamps[stamp]
        if (!stampConfig) {
          return Promise.reject(new Error(`Stamp ${stamp} not registered in the workspace`));
        }
        let admissionUrl = stampConfig.admission
        let token = stampConfig.token
        let admission = new AdmissionClient(`${admissionUrl}/admission`, token);
        return admission.findStorage()
        .then((result) => {
          for (let element of result) {
            if (element === name) {
              return true;
            }
          }
          return false;
        })
        .catch((error) => {
          let message = ((error && error.message) ? error.message : error.toString());
          return Promise.reject(`Error searching for ${name} in ${stamp}: ${message}`);
        })
      } catch(error) {
        let message = ((error && error.message) ? error.message : error.toString());
        return Promise.reject(`Error searching for ${name} in ${stamp}: ${message}`);
      }
      // return Promise.resolve(false);
    }

    public get(stamp: string): utils.StampConfig {
      let workspaceConfig = utils.readConfigFile();
      if ((!stamp) || (!workspaceConfig.stamps[stamp])) {
        throw new Error("Stamp not registered");
      }
      return workspaceConfig.stamps[stamp]
    }

    public isDefault(name: string): boolean {
      if ((!name) || (name.length == 0)) {
        return false
      } else {
        let workspaceConfig = utils.readConfigFile();
        return (name.localeCompare(workspaceConfig["working-stamp"]) == 0)
      }
    }

    // Registers a bundle in a stamp using AdmissionClient.
    //
    // Parameters:
    // * `stamp`: the stamp id as rgistered in configurationFile.
    // * `bundle`: the path to the bundle file.
    //
    // Returns: a RegistrationResult with the results.
    public register(stamp: string, bundle: string): Promise<RegistrationResult> {
      try {
        if (!stamp) {
          return Promise.reject(new Error('Stamp name parameter is missing'));
        }
        if (!bundle) {
          return Promise.reject(new Error('The path to the bundle parameter is missing'));
        }
        let workspaceConfig = utils.readConfigFile();
        let stampConfig:utils.StampConfig = workspaceConfig.stamps && workspaceConfig.stamps[stamp]
        if (!stampConfig) {
          return Promise.reject(new Error(`Stamp ${stamp} not registered in the workspace`));
        }

        return utils.access(bundle, constants.R_OK)
        .then(() => {
          let admissionUrl = stampConfig.admission
          let token = stampConfig.token
          let admission = new AdmissionClient(`${admissionUrl}/admission`, token);
          let stream = createReadStream(bundle);
          let fileStream = new FileStream(stream);
          return admission.sendBundle(fileStream);
        }, (error) => {
          return Promise.reject(`Bundle ${bundle} not available in the workspace`);
        })
        .catch((error) => {
          let message = ((error && error.message) ? error.message : error.toString());
          return Promise.reject(`Error registering ${bundle} in ${stamp}: ${message}`);
        })
      } catch(error) {
        let message = ((error && error.message) ? error.message : error.toString());
        return Promise.reject(`Error registering ${bundle} in ${stamp}: ${message}`);
      }

    }

    public async unregister(stamp: string, urn: string): Promise<boolean> {
      try {
        if (!stamp) {
          throw new Error('Stamp name parameter is missing');
        }
        if (!urn) {
          throw new Error('The element URN is missing');
        }
        let workspaceConfig = utils.readConfigFile();
        let stampConfig:utils.StampConfig = workspaceConfig.stamps && workspaceConfig.stamps[stamp]
        if (!stampConfig) {
          throw new Error(`Stamp ${stamp} not registered in the workspace`);
        }

        let admissionUrl = stampConfig.admission
        let token = stampConfig.token
        let admission = new AdmissionClient(`${admissionUrl}/admission`, token);
        let manifest = await admission.getStorageManifest(urn)
        await admission.removeStorage(urn)
        return true
      } catch(error) {
        let message = ((error && error.message) ? error.message : error.toString());
        if (message.indexOf(" Error code 23 - Rsync command") != -1) {
          message = `Element ${urn} is not registered in stamp ${stamp}`
        } else {
          message = `Element ${urn} unregistration process failed in stamp ${stamp}`
        }
        throw new Error(message);
      }
    }

  }
