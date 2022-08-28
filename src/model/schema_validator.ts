import { AnyObj } from "../common/utils.ts";

import { Validator, ValidatorResult } from "../deps/schema.ts";

// Address, to be embedded on Person
const responsePayloadSchema = {
    "id": "/Payload",
    "type": ["object", "array"],
    "properties": {
      "$httpStatus$": {"type": "number", minimum: 200, maximum: 599},
    },
    "additionalProperties": true,
    "required": []
  };
  
const routeSchema = {
    "id": "/Route",
    "type": "object",    
    "patternProperties": {
        "^.*$": {"$ref": "/Payload"}
    },
    "required": []
  };
  
  
const configSchema = {
    "id": "/RoutesConfig",
    "type": "object",
    "properties": {
      "_rePath": { type: "array" },
      "defaultResponse": {"$ref": "/Payload"},
      "errorResponse": {"$ref": "/Payload"},
      "routes": {
        "type": "object",
        "patternProperties": {
          "\\*": {"$ref": "/Route"},
          "^(get|put|post|patch|delete|options|head)$": {"$ref": "/Route"}
        },
        "additionalProperties": false
      }
    },
    "additionalProperties": false
  };

 export const validator = new Validator();
 validator.addSchema(responsePayloadSchema, "/Payload");
 validator.addSchema(routeSchema, "/Route");
 validator.addSchema(configSchema, "/RoutesConfig");

 export const validateConfigSchema = (config: AnyObj) : ValidatorResult => {
     return validator.validate(config, configSchema);
 }

