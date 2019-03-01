import * as utils from './utils';
import { createReadStream, constants } from 'fs';
import { Deployment, StampStubFactory, FileStream, RegistrationResult } from './stamp-manager';

export class Stamp {

    private stampStubFactory: StampStubFactory

    constructor(stampStubFactory: StampStubFactory) {
      this.stampStubFactory = stampStubFactory
    }

    public add(id: string, stampConfig: utils.StampConfig, defaultStamp: boolean): void {
      let workspaceConfig = utils.readConfigFile();
      if (workspaceConfig['stamps'][id]) {
        throw new Error(`${utils.configuration.configFileName} already has a stamp with id: ${id}`)
      }
      if (defaultStamp || (workspaceConfig['working-stamp'] == workspaceConfig['stamps'][id])) {
        workspaceConfig['working-stamp'] = id;
      }

      let configCopy:utils.StampConfig = Object.assign({}, stampConfig);
      workspaceConfig['stamps'][id] = configCopy;

      utils.overwriteConfigFile(workspaceConfig);
    }

    public update(id: string, stampConfig: utils.StampConfig): void {
      let workspaceConfig = utils.readConfigFile();
      if (!workspaceConfig['stamps'][id]) {
        throw new Error(`${utils.configuration.configFileName} does not contain any stamp with id: ${id}`)
      }

      let configCopy:utils.StampConfig = Object.assign({}, stampConfig);
      workspaceConfig['stamps'][id] = configCopy;

      utils.overwriteConfigFile(workspaceConfig);
    }

    public remove(id: string): void {
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

    public use(id: string): void {
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
        let stampConfig = this._getStampConfig(stamp)
        if (!name) {
          return Promise.reject(new Error('Element name parameter is missing'));
        }
        let admissionUrl = stampConfig.admission
        let token = stampConfig.token
        let admission = this.stampStubFactory.getStub(`${admissionUrl}/admission`, token)
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
        return Promise.reject(new Error(`Error searching for ${name} in ${stamp}: ${message}`));
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

    /**
     * Registers a bundle in a target stamp.
     *
     * @param stamp The stamp id as registered in the configuration file
     * @param bundle The path to the bundle to be registred
     * @returns The result returned by the stamp.
     */
    public register(stamp: string, bundle: string): Promise<RegistrationResult> {
      try {
        let stampConfig = this._getStampConfig(stamp)
        if (!bundle) {
          return Promise.reject(new Error('The path to the bundle parameter is missing'));
        }

        return utils.access(bundle, constants.R_OK)
        .then(() => {
          let admissionUrl = stampConfig.admission
          let token = stampConfig.token
          let admission = this.stampStubFactory.getStub(`${admissionUrl}/admission`, token)
          let stream = createReadStream(bundle);
          let fileStream = new FileStream(stream);
          return admission.sendBundle(fileStream);
        }, () => {
          return Promise.reject(new Error(`Bundle ${bundle} not available in the workspace`));
        })
        .catch((error) => {
          try {
            // Some times, admission.sendBundle returns a correct response from Admission stringified
            // as an error message. In that case, we pic up that result and send it back to the caller.
            let data = JSON.parse(error.message)
            if (data && !data.success && data.data) {
              return Promise.resolve(data.data)
            } else if (data && data.errors) {
              return Promise.resolve(data)
            }
            throw error
          } catch(err2) {
            let message = ((error && error.message) ? error.message : error.toString());
            return Promise.reject(new Error(`Error registering ${bundle} in ${stamp}: ${message}`));
          }
        })
      } catch(error) {
        let message = ((error && error.message) ? error.message : error.toString());
        return Promise.reject(new Error(`Error registering ${bundle} in ${stamp}: ${message}`));
      }

    }

    public async unregister(stamp: string, urn: string): Promise<boolean> {
      try {
        let stampConfig = this._getStampConfig(stamp)
        if (!urn) {
          throw new Error('The element URN is missing');
        }
        let admissionUrl = stampConfig.admission
        let token = stampConfig.token
        let admission = this.stampStubFactory.getStub(`${admissionUrl}/admission`, token)
        await admission.removeStorage(urn)
        return true
      } catch(error) {
        let message = ((error && error.message) ? error.message : error.toString());
        if (message.indexOf(" Error code 23 - Rsync command") != -1) {
          message = `Element ${urn} is not registered in stamp ${stamp}`
        } else if (message.indexOf('not registered in the workspace') == -1) {
          message = `Element ${urn} unregistration process failed in stamp ${stamp}`
        }
        throw new Error(message);
      }
    }

    public async findDeployments (stamp: string, urn?: string, owner?: string): Promise<{[key: string]:Deployment}> {
      let stampConfig = this._getStampConfig(stamp)
      let admissionUrl = stampConfig.admission
      let token = stampConfig.token
      let admission = this.stampStubFactory.getStub(`${admissionUrl}/admission`, token)
      return await admission.findDeployments(urn, owner)
    }

    private _getStampConfig(stamp: string): utils.StampConfig {
      if (!stamp) {
        throw new Error('Stamp name parameter is missing');
      }
      let workspaceConfig = utils.readConfigFile();
      let stampConfig:utils.StampConfig = workspaceConfig.stamps && workspaceConfig.stamps[stamp]
      if (!stampConfig) {
        throw new Error(`Stamp ${stamp} not registered in the workspace`);
      }
      return stampConfig
    }

  }
