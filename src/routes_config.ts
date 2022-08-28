// deno-lint-ignore-file no-explicit-any
import { AnyObj } from "./common/utils.ts";
import { dirname, fromFileUrl, join } from "./deps/deno.ts";
import { yaml } from "./deps/schema.ts";
import { validateConfigSchema } from "./model/schema_validator.ts";


//import { validateConfigSchema } from './model/schema_validator';

export type HttpMethod = '*' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'trace';

export type SingleResponseConfig = {[key: string]: any};
export type ArrayResponseConfig = SingleResponseConfig[];

export type HttpMethodRoutesConfig = {[key: string]: SingleResponseConfig | ArrayResponseConfig};
export type AllRoutesConfig = Partial<Record<HttpMethod, HttpMethodRoutesConfig>>;
export type PathMatcher = {
    re?: RegExp;
    vars?: string[];
    path: string;
}
export type AllPathMatchers = Partial<Record<HttpMethod, PathMatcher[]>>;


/**
 * Config for the mocker. The configuration is loaded from a yaml file but can be overridden 
 * passing new a config file by CLI
 * @class MockerConfig
 */
export type MockerConfig = {
    /**
     * Default response to return when no route is matched
     */
    defaultResponse?: SingleResponseConfig | ArrayResponseConfig;
    /**
     * Default response on errors
     */
    errorResponse?: SingleResponseConfig;
    /**
     * All routes configured by http method
     */
    routes?: AllRoutesConfig;
    /**
     * Internal use only
     */
    _rePath?: AllPathMatchers;
 }


class Merger {

    private static isObject(item: any): boolean {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    private static cloneArray(item: any[]): any[] {
        return [...(item.map(e => Merger.isObject(e) ? { ...e } : e))];
    }

    private static merge1Level(target: any, o2: any): AnyObj {
        Object.keys(o2).forEach(key => {
            if (Merger.isObject(o2[key])) {
                if (!target[key]) {
                    target[key] = {};
                }
                Merger.merge1Level(target[key], o2[key]);
            } else {
                target[key] = Array.isArray(o2[key]) ? Merger.cloneArray(o2[key]) : o2[key];
            }
        });
        return target;
    }

    static deepMerge(...objects: AnyObj[]): AnyObj {
        const output = {};
        objects.forEach(obj => {
            if (obj) {
                Merger.merge1Level(output, obj);
            }
        });
        return output;
    }

    static deepCopy(obj: any): AnyObj | Array<unknown> {
        if (Array.isArray(obj)) {
            return Merger.cloneArray(obj);
        } else {
            return Merger.deepMerge({}, obj);
        }        
    }
}

export const deepMerge = Merger.deepMerge;
export const deepCopy = Merger.deepCopy;

function isYaml(file: string): boolean {
    return file.endsWith('.yaml') || file.endsWith('.yml');
}

export const loadConfigFile = (filePath: string): MockerConfig => {
    const configFileContent = new TextDecoder('utf8').decode(Deno.readFileSync(filePath));
    const config = isYaml(filePath) ? yaml.load(configFileContent) : JSON.parse(configFileContent);
    // TODO: validateConfigSchema(config);
    return config;
}

export const defaultResponseConfig: MockerConfig = loadConfigFile(join('.', 'config', 'response.yml'));

/**
 * Checks is config object is valid
 * @param conf Config file to load
 * @throws Error if the config object is not valid
 */
export function assertConfigIsValid(conf: AnyObj) : void {
    const r = validateConfigSchema(conf);
    if (r.errors.length > 0) {
        throw new Error("ERROR validating config:\n" +r.errors.join('\n'));
    }    
}

/**
 * Removes the config values for the first level element that shouldn't be merged ['defaultResponse', 'errorResponse']
 * Keeping only the last one.
 * @param extraConfig 
 */
 function prepareConfigMerge(configsToMerge: MockerConfig[]) {
    const notMergeableFields = ['defaultResponse', 'errorResponse'];
    function deletePreviousValues(key: string, reversedExtraConfig: MockerConfig[]) {
      const lastIndex = reversedExtraConfig.findIndex((c:any) => !!c[key]);
      if (lastIndex > -1) {
        for (let i = lastIndex+1; i < reversedExtraConfig.length; i++) {
            delete (<any>reversedExtraConfig[i])[key];
          }      
      }
    }
    if (configsToMerge.length > 1) {
        const reversedExtraConfig = configsToMerge.reverse();
        for (const key of notMergeableFields) {
            deletePreviousValues(key, reversedExtraConfig);
        }  
    }
  }

/**
 * Returns the current config for the server
 * 
 * @param otherConfig Additional config object to merge with the default config
 * @returns The merged config object
 */
export function getConfig(...otherConfigs: MockerConfig[]) : MockerConfig {
    const defaultConfigCopy = Merger.deepMerge({}, defaultResponseConfig) as MockerConfig;
    if (otherConfigs.length > 0) {
        prepareConfigMerge(otherConfigs);
        const newConfig = Merger.deepMerge(...otherConfigs) as MockerConfig;
        assertConfigIsValid(newConfig);
        const configsToMerge = [defaultConfigCopy, newConfig];
        prepareConfigMerge(configsToMerge);
        return Merger.deepMerge(...configsToMerge) as MockerConfig;
    }
    return defaultConfigCopy;
    
}



