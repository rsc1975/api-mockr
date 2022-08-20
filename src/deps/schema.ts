//export { Validator, ValidatorResult } from "https://cdn.jsdelivr.net/npm/jsonschema@1.4.1/lib/index.min.js";
//export { Validator, ValidatorResult } from "https://raw.githubusercontent.com/tdegrunt/jsonschema/master/lib/index.d.ts";
// "https://esm.sh/v91/jsonschema@1.4.1/lib/index.d.ts";

export * as yaml from "https://deno.land/x/js_yaml_port@3.14.0/js-yaml.js"

// @deno-types=https://esm.sh/jsonschema@1.4.1/lib/index.d.ts
import jsonschema from "https://esm.sh/jsonschema@1.4.1";

export { type ValidatorResult } from 'https://esm.sh/jsonschema@1.4.1/lib/index.d.ts';
export const { Validator } = jsonschema;


