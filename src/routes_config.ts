import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import path from 'path';


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

    static mergeDeep(...objects: object[]): object {
        let output = {};
        objects.forEach(obj => {
            Merger.merge1Level(output, obj);
        });
        return output;
    }
}

export const defaultResponseConfig: object = yaml.load(readFileSync(path.join(__dirname, 'config', 'response.yml'), 'utf8')) as object;

console.log(yaml.dump(defaultResponseConfig, { indent: 2 }));

export function getConfig(otherConfig?: object) : object {
    return Merger.mergeDeep(defaultResponseConfig, otherConfig || {});
}


