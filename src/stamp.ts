import * as path from 'path';
import * as utils from './utils';
import { AdmissionClient, FileStream, RegistrationResult } from 'admission-client';
import { createReadStream, access, constants } from 'fs';

export class Stamp {
  
    public add(id: string, url: string, setAsWorking: boolean, force: boolean, config: any) {
      if (!force && config['stamps'][id]) {
        console.error(`kazeConfig.json already has a stamp with id: ${id}`);
        return;
      }
      if (setAsWorking || (force && config['working-stamp'] == config['stamps'][id])) {
        config['working-stamp'] = id;
      }
    
      config['stamps'][id] = url;
    
      utils.overwriteConfigFile(config);
    }
  
    public remove(id: string, config: any) {
      if (!config['stamps'][id]) {
        console.error(`kazeConfig.json does not contain any stamp with id: ${id}`);
        return;
      }
    
      if (config['working-stamp'] == id) {
        console.error('Cannot remove working stamp, please run first kaze switch <stamp-id>');
        return;
      }
    
      delete config['stamps'][id];
      utils.overwriteConfigFile(config);
    }
  
    public switch(id: string, config: any) {
      if (!config['stamps'][id]) {
        console.error(`kazeConfig.json does not contain any stamp with id: ${id}`);
        return;
      }
      config['working-stamp'] = id;
      utils.overwriteConfigFile(config);
    }

    // Checks if a given element is registered in a given stamp.
    // TODO: to be implemented. Right now always returns `false`.
    //
    // Parameters:
    // * `stamp`: the stamp id as introduced in kazeConfig.json.
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
        let stampUrl = utils.getStampUrl(stamp);
        if (!stampUrl) {
          return Promise.reject(new Error(`Stamp ${stamp} not registered in the workspace`));
        }

        let admission = new AdmissionClient(`${stampUrl}/admission`);
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

    // Registers a bundle in a stamp using AdmissionClient.
    //
    // Parameters:
    // * `stamp`: the stamp id as rgistered in kazeConfig.json.
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
        let stampUrl = utils.getStampUrl(stamp);
        if (!stampUrl) {
          return Promise.reject(new Error(`Stamp ${stamp} not registered in the workspace`));
        }

        return utils.access(bundle, constants.R_OK)
        .then(() => {
          let admission = new AdmissionClient(`${stampUrl}/admission`);
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

  }
