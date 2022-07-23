'use strict';

import * as Code from '@hapi/code';
import * as Lab from '@hapi/lab';

import { validateConfigSchema } from '../../src/model/schema_validator';
// create sum function

const { expect } = Code;
const { it, describe, before, afterEach } = exports.lab = Lab.script();

const okConfig = {
  "routes": {
    "*": {
      "*": {
        "success": true
      }
    }
  }
}

const badConfig = {
  "$defaultResponse$2": {
  },
  "routes": {
    "*": {
      "*": {
        "success": true
      }
    }
  }
}

const badConfig2 = {
  "$defaultResponse$": {
  },
  "routes": {
    "wrong_method": {
      "*": {
        "success": true,
      }
    }
  }
}


describe('Testing Config model validator', () => {

    before(() => {
        process.env.NODE_ENV = 'test';
    });

    afterEach(() => {

    });
    
    it('checks ok config', () => {
      const r = validateConfigSchema(okConfig);
      expect(r.valid).to.be.true();
    });
    
    it('checks default params', () => {
      const r = validateConfigSchema(badConfig);
      expect(r.valid).to.be.false();      
      expect(r.errors.length).to.equal(1);
      expect(r.errors[0].argument).to.be.equal("$defaultResponse$2");      
    });
    
    it('checks valid method name', () => {
      const r = validateConfigSchema(badConfig2);
      expect(r.valid).to.be.false();      
      expect(r.errors.length).to.equal(1);
      expect(r.errors[0].argument).to.be.equal("wrong_method");       
    });
});


