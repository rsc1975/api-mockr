import { Request } from "@hapi/hapi";
import { ParamValues } from "./param_values_generator";

import { MockerConfig, HttpMethod, deepCopy, AllPathMatchers, PathMatcher, SingleResponseConfig, HttpMethodRoutesConfig } from './routes_config';


/**
 * Reference to one variable in config routes to be generated
 */
class RefValue {
  readonly obj: any;
  readonly key: string;

  constructor(obj: object, key: string) {
    this.obj = obj;
    this.key = key;
  }

  get(): any {
    return this.obj[this.key];
  }

  set(value: any): void {
    this.obj[this.key] = value;
  }
}

/**
 * Reference to a variable in mocker config that is an object or primitive value (not an array)
 */
class RefValueObject extends RefValue {

  readonly vars: string[];
  readonly pattern: string;
  readonly direct: boolean;

  constructor(obj: object, key: string) {
    super(obj, key);
    this.pattern = this.get().trim();
    this.vars = this.pattern.match(PATH_VARIABLE_EXP)!.map(v => v.replace(/[\$\{\}]/g, ''));
    this.direct = this.vars.length === 1 && this.pattern === `\${${this.vars[0]}}`;
  }
}

/**
 * Reference to a variable in mocker config that is an array 
 */
class RefValueArray extends RefValue {

  readonly length: number;
  readonly internalRefs: RefValue[];

  constructor(obj: object, key: string, internalRefs: RefValue[] = []) {
    super(obj, key);
    this.internalRefs = internalRefs;
    const currentArray = this.get() as Array<any>;
    if (currentArray.length === 1) {
      const lengthExp = currentArray[0]['$length$'] || 1;
      if (PATH_VARIABLE_EXP.test(lengthExp)) {
        this.length = Math.max(+(ParamValues.get(lengthExp) || 1), 1);
      } else {
        this.length = Math.max(+lengthExp || 1, 1);
      }
      delete currentArray[0]['$length$'];
    } else {
      this.length = currentArray.length;
    }
  }

}



/**
 * RegExp to detect variables in config. I.e: ${varname}
 */
const PATH_VARIABLE_EXP = /\${[\w\.\-]+}/g;

/**
 * Generate a response for a given request and config
 */
export class ResponseGenerator {

  private readonly request: Request;
  private readonly config: MockerConfig
  matchedPath?: string;
  pathVars: Record<string, string> = {};

  constructor(request: Request, config: MockerConfig) {
    this.preparePathMatchers(config);
    this.request = request;
    this.config = config;
  }

  /**
   * Prepare a regular expression to match a route path.
   * The resulting RegExp is stored in internal property: _rePath
   * 
   * @param conf The Mocker config to analize
   */
  private preparePathMatchers(conf: MockerConfig) {
    if (!conf._rePath) {
      const allPathMatchers: AllPathMatchers = {};
      const routes = conf.routes || {};
      Object.keys(routes).forEach(method => {
        const routeConfig = routes[method as HttpMethod];
        const paths = Object.keys(routeConfig!);
        const pathMatchers: PathMatcher[] = [];
        paths.forEach(path => {
          if (PATH_VARIABLE_EXP.test(path)) {
            const vars = (path.match(PATH_VARIABLE_EXP) as string[])!.map(v => v.replace(/[\$\{\}]/g, ''));
            const re = new RegExp("^" + path.replace(PATH_VARIABLE_EXP, '([^/]+)') + "$");

            pathMatchers.push({ re, vars, path });
          } else {
            pathMatchers.push({ path });
          }
        });
        allPathMatchers[method as HttpMethod] = pathMatchers;
      }
      );
      conf._rePath = allPathMatchers;
    }
  }

  private findMatchPath(): SingleResponseConfig {
    let methodRouteConfig: HttpMethodRoutesConfig | undefined;
    const method = this.request.method.toLowerCase() as HttpMethod;
    if (!!this.config.routes) {
      methodRouteConfig = this.config.routes![method] || this.config.routes!['*'];
    }
    if (!methodRouteConfig) {
      return this.config.$defaultResponse$ || {};
    }
    const path = this.request.url.pathname;
    const pathMatchers: PathMatcher[] = this.config._rePath![method]!;
    const matchedPath = pathMatchers.find(m => m.re?.test(path) || m.path === path);
    if (!matchedPath) {
      return this.config.$defaultResponse$ || {};
    } else {
      this.matchedPath = matchedPath.path;
      this.pathVars = matchedPath.re?.exec(path)!.slice(1).reduce((acc, v, i) => {
        acc[matchedPath.vars![i]] = v;
        return acc;
      }, {} as Record<string, string>)!;
      return methodRouteConfig[matchedPath.path];
    }

  }

  private findGeneratedValue(obj: object, key: string, value: any): RefValue[] {
    if (typeof value === 'object') {
      return [...this.findAllGeneratedValues(value)];
    } else if (typeof value === 'string' && PATH_VARIABLE_EXP.test(value)) {
      return [new RefValueObject(obj, key)];
    }
    return [];
  }

  private findAllGeneratedValues(obj: any): RefValue[] {

    const values: RefValue[] = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (Array.isArray(value)) {
          const insideRefs: RefValue[] = [];
          if (value.length > 1) {
            for (const item of value) {
              insideRefs.push(...this.findGeneratedValue(obj, key, item));
            }
          }
          values.push(new RefValueArray(obj, key, insideRefs));
        } else {
          values.push(...this.findGeneratedValue(obj, key, value));
        }
      }
    }
    return values;
  }

  private generateValueObj(rvo: RefValueObject): any {
    if (rvo.direct) {
      rvo.set(this.pathVars[rvo.vars[0]] || ParamValues.get(rvo.vars[0], this.request));
    } else {
      let value = rvo.pattern;
      rvo.vars.forEach((v) => {
        const genVal = '' + (this.pathVars[v] || ParamValues.get(v, this.request) || '');
        value = value.replace(`\${${v}}`, genVal);
      });
      rvo.set(value);
    }
  }


  private generateValueArray(rva: RefValueArray): any {
    const currentArray = rva.get() as Array<any>;

    const setRefValues = (refs: RefValue[]) => {
      for (let ref of refs.filter(ref => ref instanceof RefValueObject)) {
        this.generateValueObj(ref as RefValueObject);
      }
      for (let ref of refs.filter(ref => ref instanceof RefValueArray)) {
        this.generateValueArray(ref as RefValueArray);
      }
    }

    if (currentArray.length > 1) {
      setRefValues(rva.internalRefs);
    } else {
      const arrayValues = [];
      for (let i = 0; i < rva.length; i++) {
        if (currentArray[0] === 'object') {
          const rawObj = deepCopy(currentArray[0]);
          const arrayInternalRefs: RefValue[] = this.findAllGeneratedValues(rawObj);
          setRefValues(arrayInternalRefs);
          arrayValues.push(rawObj);
        } else {
          if (PATH_VARIABLE_EXP.test(currentArray[0])) {
            const aux = { value: currentArray[0] };
            setRefValues([new RefValueObject(aux, 'value')]);
            arrayValues.push(aux.value);
          } else {
            arrayValues.push(currentArray[0]);
          }

        }
      }
      rva.set(arrayValues);
    }

  }

  /**
   * Generates a JS object based on the request and config
   * 
   * @returns {any} An object or array with the generated response
   */
  public generate(): object | object[] {
    const responseTemplate = deepCopy(this.findMatchPath());
    const refValues = this.findAllGeneratedValues(responseTemplate);
    refValues.filter(rv => rv instanceof RefValueObject).forEach(rv => this.generateValueObj(rv as RefValueObject));
    refValues.filter(rv => rv instanceof RefValueArray).forEach(rv => this.generateValueArray(rv as RefValueArray));

    return responseTemplate;
  }
}

