import { Validator, ValidatorResult } from "jsonschema";

// Address, to be embedded on Person
const responsePayloadSchema = {
    "id": "/Payload",
    "type": "object",
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
      "$defaultResponse$": {"$ref": "/Payload"},
      "$error$": {"$ref": "/Payload"},
      "routes": {
        "type": "object",
        "properties": {
            "$any$": {"$ref": "/Route"},
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

export const validateConfig = (config: object) : ValidatorResult => {
    return validator.validate(config, configSchema);
}

