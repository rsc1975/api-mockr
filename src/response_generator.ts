// deno-lint-ignore-file no-explicit-any
import { pathname } from "./common/utils.ts";
import { StatusCode } from "./deps/hono.ts";
import { ParamValues } from "./param_values_generator.ts";

import { MockerConfig, HttpMethod, deepCopy, AllPathMatchers, PathMatcher, SingleResponseConfig, HttpMethodRoutesConfig } from './routes_config.ts';

type AnyObj = Record<string, unknown>;

/**
 * Error response
 */
type ErrorResponse = {
  payload: AnyObj;
  httpStatus: StatusCode;
}

/**
 * Reference to one variable in config routes to be generated
 */
class RefValue {
  readonly obj: AnyObj;
  readonly key: string;

  constructor(obj: AnyObj, key: string) {
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

  constructor(obj: AnyObj, key: string) {
    super(obj, key);
    this.pattern = this.get().trim();
    this.vars = this.pattern.match(ALL_PATH_VARIABLE_EXP)!.map(v => v.replace(/[\$\{\}]/g, ''));
    this.direct = this.vars.length === 1 && this.pattern === `\${${this.vars[0]}}`;
  }
}

/**
 * Reference to a variable in mocker config that is an array 
 */
class RefValueArray extends RefValue {
  static readonly DEFAULT_LENGHT: number = 2;
  private _length?: number;
  public async length() : Promise<number> {
    if (this._length === undefined) {
      const currentArray = this.get() as Array<any>;
      if (currentArray.length === 1) {
        const lengthExp = currentArray[0]['$length$'] || RefValueArray.DEFAULT_LENGHT;
        if (PATH_VARIABLE_EXP.test(lengthExp)) {
          const expValue = await ParamValues.get(lengthExp.replace(/[\$\{\} ]/g, ''));        
          this._length = Math.max(+(expValue || RefValueArray.DEFAULT_LENGHT), 1);
        } else {
          this._length = Math.max(+lengthExp || RefValueArray.DEFAULT_LENGHT, 1);
        }
        delete currentArray[0]['$length$'];
      } else {
        this._length = currentArray.length;
      }
    }
    return this._length;
  }
  readonly internalRefs: RefValue[];

  constructor(obj: AnyObj, key: string, internalRefs: RefValue[] = []) {
    super(obj, key);
    this.internalRefs = internalRefs;
    
  }

}



/**
 * RegExp to detect first variable in config. I.e: ${varname}
 */
const PATH_VARIABLE_EXP = /\$\{[\w\.\-]+\}/;

/**
 * RegExp to detect all variable in config. I.e: "${varname1} ${varname}"
 */
 const ALL_PATH_VARIABLE_EXP = new RegExp(PATH_VARIABLE_EXP.source, 'g');

/**
 * Generate a response for a given request and config
 */
export class ResponseGenerator {

  private readonly config: MockerConfig;
  private readonly apiPrefix: string;
  matchedPath?: string;
  pathVars: Record<string, string> = {};

  constructor(config: MockerConfig, apiPrefix: string) {
    this.preparePathMatchers(config);
    this.config = config;
    this.apiPrefix = apiPrefix;
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
        let pathContainsWildcard = false;
        paths.forEach(path => {
          if (!path.startsWith('/') && path !== '*') {
            // We should normalize all path, starting by '/
            const pathConfig = routeConfig![path];
            path = '/' + path;
            routeConfig![path] = pathConfig;
            delete routeConfig![path.substring(1)];
          }
          if (PATH_VARIABLE_EXP.test(path)) {
            const vars = (path.match(ALL_PATH_VARIABLE_EXP) as string[])!.map(v => v.replace(/[\$\{\}]/g, ''));
            const re = new RegExp("^" + path.replace(ALL_PATH_VARIABLE_EXP, '([^/]+)') + "$");

            pathMatchers.push({ re, vars, path });
          } else {
            if (path === '*') {              
              pathContainsWildcard = true;
            } else {              
              pathMatchers.push({ path });
            }            
          }
        });
        // This ensure that the '*' path is always the last one
        if (pathContainsWildcard) {
          pathMatchers.push({ path: '*' });
        }
        allPathMatchers[method as HttpMethod] = pathMatchers;
      }
      );
      conf._rePath = allPathMatchers;
    }
  }

  private async findMatchPath(request: Request): Promise<SingleResponseConfig> {
    if (request.query('_clonePayload')) {
      return await request.parseBody() as SingleResponseConfig;
    }
    let methodRouteConfig: HttpMethodRoutesConfig | undefined;
    const method = request.method.toLowerCase() as HttpMethod;
    if (this.config.routes) {
      methodRouteConfig = this.config.routes![method] || this.config.routes!['*'];
    }
    if (!methodRouteConfig) {
      return this.config.defaultResponse || {};
    }
    const path = pathname(request.url).substring(this.apiPrefix.length);

    const pathMatchers: PathMatcher[] = this.config._rePath![method] || this.config._rePath!['*']!;
    const matchedPath = pathMatchers.find(m => m.re?.test(path) || m.path === path || m.path === '*');
    
    if (!matchedPath) {
      return this.config.defaultResponse || {};
    } else {
      this.matchedPath = matchedPath.path;
      this.pathVars = matchedPath.re?.exec(path)!.slice(1).reduce((acc: Record<string, string>, v: string, i: number) => {
        acc[matchedPath.vars![i]] = v;
        return acc;
      }, {} as Record<string, string>) || {};

      return methodRouteConfig[matchedPath.path];
    }
  }

  private findGeneratedValue(obj: AnyObj, key: string, value: any): RefValue[] {
    if (typeof value === 'object') {
      return [...this.findAllGeneratedValues(value)];
    } else if ((typeof value === 'string') && PATH_VARIABLE_EXP.test(value)) {      
      return [new RefValueObject(obj, key)];
    }
    
    return [];
  }

  private findAllGeneratedValues(obj: any): RefValue[] {

    const values: RefValue[] = [];
    for (const key in obj) {
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
    return values;
  }

  private async generateValueObj(request: Request, rvo: RefValueObject): Promise<any> {
    if (rvo.direct) {
      const uniqueVar = rvo.vars[0];
      rvo.set(this.pathVars[uniqueVar] || await ParamValues.get(uniqueVar, request));
    } else {
      let value = rvo.pattern;
      await rvo.vars.forEach(async (v) => {
        const genVal = '' + (this.pathVars[v] || await ParamValues.get(v, request) || '');
        value = value.replace(`\${${v}}`, genVal);
      });
      rvo.set(value);
    }
  }


  private async generateValueArray(request: Request, rva: RefValueArray): Promise<void> {
    const currentArray = rva.get() as Array<any>;

    const setRefValues = async (refs: RefValue[]) => {
      for (const ref of refs.filter(ref => ref instanceof RefValueObject)) {
        await this.generateValueObj(request, ref as RefValueObject);
      }
      for (const ref of refs.filter(ref => ref instanceof RefValueArray)) {
        await this.generateValueArray(request, ref as RefValueArray);
      }
    }

    if (currentArray.length > 1) {
      await setRefValues(rva.internalRefs);
    } else {
      const arrayValues = [];
      for (let i = 0; i < await rva.length(); i++) {
        if (typeof currentArray[0] === 'object') {
          const rawObj = deepCopy(currentArray[0]);
          const arrayInternalRefs: RefValue[] = this.findAllGeneratedValues(rawObj);
          await setRefValues(arrayInternalRefs);
          arrayValues.push(rawObj);
        } else {
          if (PATH_VARIABLE_EXP.test(currentArray[0])) {
            const aux = { value: currentArray[0] };
            await setRefValues([new RefValueObject(aux, 'value')]);
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
  public async generate(request: Request): Promise<AnyObj | any[]> {
    const responseTemplate = deepCopy(await this.findMatchPath(request));
    if (Array.isArray(responseTemplate)) {
      let refValues : RefValue[] = [];
      if (responseTemplate.length > 1) {
        refValues = responseTemplate.map(v => this.findAllGeneratedValues(v)).reduce((accu, value) => accu.concat(value), []);        
      }
      const aux = { value: responseTemplate };
      const refMainArray = new RefValueArray(aux, 'value', refValues);
      await this.generateValueArray(request, refMainArray);
      return aux.value;
    } else {
      const refValues = this.findAllGeneratedValues(responseTemplate);
      for (const rv of refValues.filter(rv => rv instanceof RefValueObject)) {
        await await this.generateValueObj(request, rv as RefValueObject);
      }
      for (const rv of refValues.filter(rv => rv instanceof RefValueArray)) {
        await await this.generateValueArray(request, rv as RefValueArray);
      }      
      
      return responseTemplate;
    }
  }

  public async generateError(request: Request, errorMessage?: string, httpStatus?: number): Promise<ErrorResponse> {
    if (!errorMessage) {
      errorMessage = "Error in request to path: ${request.path}"
    }
    let errorTemplate = this.config.errorResponse || { success: false };
    
    const errorTemplateJson : string = JSON.stringify(errorTemplate);
    errorTemplate = JSON.parse(errorTemplateJson.replace(/\${error}/g, errorMessage));
    const refValues = this.findAllGeneratedValues(errorTemplate);    
    for (const rv of refValues.filter(rv => rv instanceof RefValueObject)) {
      await await this.generateValueObj(request, rv as RefValueObject);
    }
    
    httpStatus = httpStatus || +(<any>errorTemplate).$httpStatus$ || 500;
    if (httpStatus! < 200 || httpStatus! >= 600) {
      httpStatus = 500;
    }
    delete errorTemplate.$httpStatus$;
    return {payload: errorTemplate, httpStatus: httpStatus as StatusCode} ;
  }
}

