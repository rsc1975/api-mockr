import { validateConfigSchema } from "../../src/model/schema_validator.ts";
import { afterEach, assertEquals, beforeAll, describe, it } from "../test_deps.ts";

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
  "defaultResponse2": {
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
  "defaultResponse": {
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

    beforeAll(() => {
        Deno.env.set('NODE_ENV', 'test');
    });

    afterEach(() => {

    });
    
    it('checks ok config', () => {
      const r = validateConfigSchema(okConfig);
      assertEquals(r.valid, true);
    });
    
    it('checks default params', () => {
      const r = validateConfigSchema(badConfig);
      assertEquals(r.valid, false);      
      assertEquals(r.errors.length, 1);
      assertEquals(r.errors[0].argument, "defaultResponse2");      
    });
    
    it('checks valid method name', () => {
      const r = validateConfigSchema(badConfig2);
      assertEquals(r.valid, false);      
      assertEquals(r.errors.length, 1);
      assertEquals(r.errors[0].argument, "wrong_method");       
    });
});


