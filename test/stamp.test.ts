import { writeEmptyConfigFile, readConfigFile, StampConfig } from '../lib/utils'
import * as should from 'should'
import { Stamp } from '../lib/stamp'
import { StampStubFactory, StampStub, FileStream, RegistrationResult } from '../lib/stamp-manager'
import * as fs from 'fs'
import * as path from 'path'

const MOCK_URN ='eslap://mock.urn/'

class MockAdmissionClient {
  findStorage(): Promise<string[]> {
    return Promise.resolve(['mockElement'])
  }
  sendBundle(bundlesZip?: FileStream, bundlesJson?: FileStream): Promise<RegistrationResult> {
    let result:RegistrationResult = {
      successful: [],
      errors: [],
      deployments: {
        successful: [],
        errors: []
      },
      links: {},
      tests: {},
      testToken: ''
    }
    return Promise.resolve(result)
  }

  getStorageManifest(urn: string): Promise<any> {
    return Promise.reject(new Error('Not implemented'))
  }

  removeStorage(urn: string): Promise<any> {
    if (urn && (urn.localeCompare(MOCK_URN) == 0)) {
      return Promise.resolve(true)
    } else {
      return Promise.reject(new Error(' Error code 23 - Rsync command'))
    }
  }
}

class MockStampStubFactory implements StampStubFactory {
  public getStub(basePath: string, accessToken?: string): StampStub {
    return new MockAdmissionClient()
  }
}

let stamp = new Stamp(new MockStampStubFactory())

describe('Stamp command', () => {
  before(() => {
    writeEmptyConfigFile();
  });

  after(() => {
    // cp.execSync('rm -f kumoriConfig.json');
  });

  describe('add', () => {
    it('success', () => {
      let config:StampConfig = {
        admission: 'url1'
      }
      stamp.add('id1', config, false);
      should(readConfigFile()).have.property('stamps').with.properties({ 'id1': { admission: 'url1' } });
    });

    it('success with default stamp', () => {
      let config:StampConfig = {
        admission: 'url2'
      }
      stamp.add('id2', config, true);
      should(readConfigFile()).have.property('stamps').with.property('id2').with.property('admission').equal('url2');
      should(readConfigFile()).have.property('working-stamp').equal('id2');
    });

    it('fails due to same id', () => {
      const configBeforeAdd = readConfigFile();
      try {
        let config:StampConfig = {
          admission: 'url12'
        }
        stamp.add('id1', config, false);
      } catch(error) {
        error.message.should.endWith('already has a stamp with id: id1')
        should(readConfigFile()).deepEqual(configBeforeAdd);
      }
    });
  })

  describe('update', () => {
    it('success', () => {
      let config:StampConfig = {
        admission: 'url11'
      }
      stamp.update('id1', config);
      should(readConfigFile()).have.property('stamps').with.properties({ 'id1': { admission: 'url11'} });
    });

    it('fails due to wrong id', () => {
      try {
        let config:StampConfig = {
          admission: 'url11'
        }
        stamp.update('wrong', config);
      } catch(error) {
        error.message.should.endWith('does not contain any stamp with id: wrong')
        should(readConfigFile()).have.property('stamps').with.properties({ 'id1': { admission: 'url11'} });
      }

    });
  });

  describe('get', () => {
    it('success', () => {
      let config = stamp.get('id1')
      config.should.deepEqual(readConfigFile().stamps['id1'])
    })

    it('fails due to wrong id', () => {
      try {
        stamp.get('wrong')
        throw new Error("Wrong stamp id used but get doesn't fails")
      } catch(error) {
        error.message.should.equal('Stamp not registered')
      }
    })
  })

  describe('isRegistered', () => {
    it('success and element found', () => {
      return stamp.isRegistered('id1','mockElement')
      .then((result) => {
        (result).should.be.true()
      })
    })

    it('success and element not found', () => {
      return stamp.isRegistered('id1','wrongElement')
      .then((result) => {
        (result).should.be.false()
      })
    })

    it('fails due to wrong id', () => {
      return stamp.isRegistered('wrong','mockElement')
      .then(() => {
        throw new Error('isRegistered with wrong id unexpectedly resolved')
      })
      .catch((error) => {
        error.message.should.startWith('Stamp wrong not registered in the workspace')
      })
    })
  })

  describe('register', () => {

    it('success', () => {
      let tmpFile = path.resolve('./','mockBundle.zip')
      fs.writeFileSync(tmpFile, 'tmpContent')
      return stamp.register('id1', tmpFile)
      .then(() => {
        fs.unlinkSync(tmpFile)
      })
      .catch((error) => {
        try {
          fs.unlinkSync(tmpFile)
        } catch(error) {}
        return Promise.reject(error)
      })
    })

    it('fails due to wrong id', () => {
      let tmpFile = path.resolve('./','mockBundle.zip')
      return stamp.register('wrong', tmpFile)
      .then(() => {
        return Promise.reject("Incorrectly succeed with wrong id")
      })
      .catch((error) => {
        error.message.should.startWith('Stamp wrong not registered in the workspace')
      })
    })

    it('fails due to wrong bundle path', () => {
      let tmpFile = path.resolve('./','mockBundle.zip')
      return stamp.register('id1', tmpFile)
      .then(() => {
        return Promise.reject("Incorrectly succeed with wrong id")
      })
      .catch((error) => {
        error.message.should.endWith(`Bundle ${tmpFile} not available in the workspace`)
      })
    })

  })

  describe('unregister', () => {

    it('success with existing urn', () => {
      return stamp.unregister('id1', MOCK_URN)
      .then((result) => {
        (result).should.be.true()
      })
    })

    it('fails due to wrong urn', () => {
      return stamp.unregister('id1', 'wrongUrn')
      .then(() => {
        return Promise.reject("Incorrectly succeed with wrong urn")
      })
      .catch((error) => {
        error.message.should.startWith('Element wrongUrn is not registered in stamp id1')
      })
    })

    it('fails due to wrong id', () => {
      return stamp.unregister('wrong', MOCK_URN)
      .then(() => {
        return Promise.reject("Incorrectly succeed with wrong id")
      })
      .catch((error) => {
        error.message.should.startWith('Stamp wrong not registered in the workspace')
      })
    })

   })

  describe('rm', () => {
    it('success', () => {
      stamp.remove('id1');
      should(readConfigFile().stamps).should.not.have.property('id1');
    });

    it('fails deleting the current working stamp', () => {
      const configBeforeRm = readConfigFile();

      stamp.remove('id2');
      should(readConfigFile()).deepEqual(configBeforeRm);
    });


    it('fails due to wrong id', () => {
      const configBeforeRm = readConfigFile();

      stamp.remove('wrongid');
      should(readConfigFile()).deepEqual(configBeforeRm);
    });
  });

  describe('use', () => {
    it('success', () => {
      let config:StampConfig = {
        admission: 'url3'
      }
      stamp.add('id3', config, false);
      stamp.use('id3');
      should(readConfigFile()).have.property('working-stamp').equal('id3');
    });

    it('fails due to wrong id', () => {
      const configBeforeSwitch = readConfigFile();

      stamp.use('wrongid');
      should(readConfigFile()).deepEqual(configBeforeSwitch);
    });
  });

  describe('isDefault', () => {
    it('true using the default stamp id', () => {
      (stamp.isDefault('id3')).should.be.true()
    })

    it('false not using the default stamp id', () => {
      (stamp.isDefault('id2')).should.be.false()
    })

    it('false with wrong id', () => {
      (stamp.isDefault('wrong')).should.be.false()
    })

  })
});
