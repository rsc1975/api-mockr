
import { assertStringIncludes } from 'https://deno.land/std@0.85.0/testing/asserts.ts';
import { deepCopy, defaultResponseConfig, getConfig, loadConfigFile, MockerConfig, SingleResponseConfig } from '../src/routes_config.ts';
import { afterEach, assertEquals, assertExists, assertNotEquals, beforeAll, describe, fail, it, restore, stub, toAny } from './test_deps.ts';


describe('Testing routes config', () => {

    beforeAll(() => {
        Deno.env.set('NODE_ENV', 'test');
    });

    afterEach(() => {
        restore();
    });

    // deno-lint-ignore no-explicit-any
    function evalDefaultConfig(conf: any) : void{
        assertExists(conf);
        assertEquals(conf['defaultResponse']!['success'], true);
        assertEquals(conf['errorResponse']!['success'], false);
        assertEquals(typeof conf['routes']!['get'], 'object');
        assertEquals(typeof conf['routes']!['get']!['say-whatever'], 'object');
        assertEquals(conf['routes']!['get']!['say-whatever']['success'], true);
    }

    it('checks default config', () => {
        evalDefaultConfig(defaultResponseConfig);        
    });

    it('checks default config indirect', () => {
        evalDefaultConfig(getConfig());        
    });

    it('overrides default config', () => {
        const newconfig = {
            routes: {
                "*": {
                    "/${id}": {
                        success: false,
                        data: [12, {ok: true}]
                    },
                    "/": {
                        success: true,
                        data: "New API"
                    }
                }
            }
        };
        const composedConfig = toAny(getConfig(newconfig as MockerConfig));
        assertEquals(composedConfig.defaultResponse!['success'], true);
        assertEquals(typeof composedConfig.routes!['*']!["/${id}"], 'object');
        assertEquals(composedConfig.routes!['*']!["/${id}"]['success'], false);
        assertEquals(Array.isArray(composedConfig.routes!['*']!["/${id}"]['data']), true);
        assertEquals(composedConfig.routes!['*']!['/']['success'], true);
        assertEquals(composedConfig.routes!['*']!['/']['data'], 'New API');

    });

    it('checks wrong config', () => {
        const wrongConfig = {
            routes_missing: {
                post: {
                }
            }
        };
        try {
            getConfig(wrongConfig as MockerConfig);
            fail('Should have thrown an error with an invalid config');
        } catch(err: unknown) {
            assertStringIncludes(toAny(err).message, 'ERROR validating config')
            assertStringIncludes(toAny(err).message, 'routes_missing');
        }
        
    });

    it('checks deepCopy', () => {
        const data = {
            foo: 123,
            bar: {
                internal: 'Hi'
            }
        };
        const objCopy = toAny(deepCopy(data));
        assertEquals(typeof objCopy, 'object');
        assertEquals(objCopy.foo, 123);
        assertEquals(objCopy.bar.internal, 'Hi');
        objCopy.bar.internal = 'Bye';
        assertNotEquals(data.bar.internal, 'Bye');
    });

    it('checks deepCopy on null or undefined', () => {
        const obj = undefined;
        const objCopy = deepCopy(obj!);
        assertEquals(typeof objCopy, 'object');
        assertEquals(objCopy, {});
    });

    it('checks loadConfigFile JSON file', async () => {
        stub(Deno, 'readFile', () => {
            return Promise.resolve(new TextEncoder().encode('{ "defaultResponse": { "result": true} }'));
        });            
        
        const conf = await loadConfigFile('fichero3.json');
        assertExists(conf);
        assertEquals(typeof conf.defaultResponse, 'object');
        assertEquals((<SingleResponseConfig>conf.defaultResponse)!.result, true);
    });

    it('checks loadConfigFile YAML file', async () => {

        stub(Deno, 'readFile', (f: string | URL) => {
            if (f === 'fichero1.yml') {
                return Promise.resolve(new TextEncoder().encode('defaultResponse:\n    result: true\n'));
            } else {
                return Promise.resolve(new TextEncoder().encode('defaultResponse:\n    success: true\n'));
            }
        });            
        
        let conf = await loadConfigFile('fichero1.yml');
        assertExists(conf);
        assertEquals(typeof conf.defaultResponse, 'object');
        assertEquals((<SingleResponseConfig>conf.defaultResponse)!.result, true);
        conf = await loadConfigFile('fichero2.yaml');
        assertExists(conf);
        assertEquals(typeof conf.defaultResponse, 'object');
        assertEquals((<SingleResponseConfig>conf.defaultResponse)!.success, true);
        assertEquals((<SingleResponseConfig>conf.defaultResponse)!.result, undefined);
        
    });


});