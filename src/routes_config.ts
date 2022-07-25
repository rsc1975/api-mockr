import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import path from 'path';
import { validateConfigSchema } from './model/schema_validator';

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
     $defaultResponse$?: SingleResponseConfig | ArrayResponseConfig;
    /**
     * Default response on errors
     */
     $error$?: SingleResponseConfig;
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

    private static merge1Level(target: any, o2: any): object {
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

    static deepMerge(...objects: object[]): object {
        let output = {};
        objects.forEach(obj => {
            if (obj) {
                Merger.merge1Level(output, obj);
            }
        });
        return output;
    }

    static deepCopy(obj: any): object {
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
    const configFileContent = readFileSync(filePath, 'utf8');
    const config = isYaml(filePath) ? yaml.load(configFileContent) : JSON.parse(configFileContent);
    validateConfigSchema(config);
    return config;
}


export const defaultResponseConfig: MockerConfig = loadConfigFile(path.join(__dirname, 'config', 'response.yml'));


/**
 * Checks is config object is valid
 * @param conf Config file to load
 * @throws Error if the config object is not valid
 */
export function assertConfigIsValid(conf: any) : void {
    const r = validateConfigSchema(conf);
    if (r.errors.length > 0) {
        throw new Error("ERROR validating config:\n" +r.errors.join('\n'));
    }    
}

/**
 * Returns the current config for the server
 * 
 * @param otherConfig Additional config object to merge with the default config
 * @returns The merged config object
 */
export function getConfig(otherConfig?: MockerConfig) : MockerConfig {
    if (otherConfig) {
        assertConfigIsValid(otherConfig);
    }
    return Merger.deepMerge({}, defaultResponseConfig, otherConfig || {}) as MockerConfig;
}


