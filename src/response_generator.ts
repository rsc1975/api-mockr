import { Request } from "@hapi/hapi";

import { MockerConfig, HttpMethod, deepCopy, AllPathMatchers, PathMatcher, SingleResponseConfig, HttpMethodRoutesConfig } from './routes_config';

type RequestVarValue = (req: Request) => any;

export class ParamValues {
  static readonly generators: any = {
    request: {
      path: (req: Request) => req.url.pathname,
      params: (req: Request) => req.query,
      body: (req: Request) => req.payload,
      headers: (req: Request) => req.headers,
    },
    random: {
      integer: (max: number = Number.MAX_SAFE_INTEGER) => Math.floor(Math.random() * (max + 1)),
      float: (max: number = 100.0) => Math.random() * (max + 1),
      boolean: () => Math.random() > 0.5,
      choose: (...values: string[]) => values[Math.floor(Math.random() * values.length)] || null,
    }
  }

  public static get(req: Request, paramName: string): number | string | boolean | null {
    const [category, command, ...params] = paramName.split('.');
    const generator = ParamValues.generators[category];
    if (!generator) {
      return null;
    }
    const commandFn = generator[command];
    if (!commandFn) {
      return null;
    }
    const commandParams = (generator === 'request') ? [req, ...params] : params;
    return commandFn(...commandParams);
  }
}

class RefValue {
  readonly obj: any;
  readonly key: string;
  readonly vars: string[];
  readonly pattern: string;
  readonly direct: boolean;;
  
  constructor(obj: object, key: string) {
    this.obj = obj;
    this.key = key;
    this.pattern = this.get().trim();
    this.vars = this.pattern.match(PATH_VARIABLE_EXP)!.map(v => v.replace(/[\$\{\}]/g, ''));
    this.direct = this.vars.length === 1 && this.pattern === `\${${this.vars[0]}}`;
  }

  get() : any {
    return this.obj[this.key];
  }

  set(value: any) : void {
    this.obj[this.key] = value;
  }

}

function preparePathMatchers(conf: MockerConfig) {
  if (!conf._rePath) {
    const allPathMatchers: AllPathMatchers = {};
    const routes = conf.routes || {};
    Object.keys(routes).forEach(method => {
        const routeConfig = routes[method as HttpMethod];
        const paths = Object.keys(routeConfig!);
        const pathMatchers : PathMatcher[] = [];
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


const PATH_VARIABLE_EXP = /\${[\w\.\-]+}/g;

export class ResponseGenerator {

  private readonly request: Request;
  private readonly config: MockerConfig
  matchedPath?: string;
  pathVars: Record<string, string> = {};

  constructor(request: Request, config: MockerConfig) {
    preparePathMatchers(config);
    this.request = request;
    this.config = config;
  }

  private findMatchPath(): SingleResponseConfig {
    let methodRouteConfig : HttpMethodRoutesConfig | undefined;
    const method = this.request.method.toLowerCase() as HttpMethod;
    if (!!this.config.routes) {
      methodRouteConfig = this.config.routes![method] || this.config.routes!['*'];
    }
    if (!methodRouteConfig) {
      return this.config.$defaultResponse$ || {};
    }
    const path = this.request.url.pathname;
    const pathMatchers : PathMatcher[] = this.config._rePath![method]!;
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

  private findAllGeneratedValues(obj: any): RefValue[] {
    
    const values: RefValue[] = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === 'object') {
          values.push(...this.findAllGeneratedValues(value));
        } else if (typeof value === 'string' && PATH_VARIABLE_EXP.test(value)) {
          values.push(new RefValue(obj, key));
        }
      }
    }
    return values;
  }
  

  public generate(): object {        
    const responseTemplate = deepCopy(this.findMatchPath());
    const refValues = this.findAllGeneratedValues(responseTemplate);
    refValues.forEach(rv => {
      if (rv.direct) {
        rv.set(this.pathVars[rv.vars[0]] || ParamValues.get(this.request, rv.vars[0]));
      } else {
        let value = rv.pattern;
        rv.vars.forEach((v) => {
          const genVal = '' + (this.pathVars[v] || ParamValues.get(this.request, v) || '');
          value = value.replace(`\${${v}}`, genVal);          
        });
        rv.set(value);
      }
    });

    return responseTemplate;
  }
}

