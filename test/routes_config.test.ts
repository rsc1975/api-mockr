
import { deepCopy, defaultResponseConfig, getConfig, MockerConfig } from '../src/routes_config';

import Code, { fail } from '@hapi/code';
import Lab from '@hapi/lab';

const { expect } = Code;
const { it, describe, before } = exports.lab = Lab.script();

describe('Testing routes config', () => {

    before(() => {
        process.env.NODE_ENV = 'test';
    });

    function evalDefaultConfig(conf: MockerConfig) : void{
        expect(conf).to.be.an.object();
        expect(conf['$defaultResponse$']!['success']).to.be.true;
        expect(conf['$error$']!['success']).to.be.false;
        expect(conf['routes']!['*']).to.be.an.object();
        expect(conf['routes']!['*']!['*']).to.be.an.object();
        expect(conf['routes']!['*']!['*']['success']).to.be.true;
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
        const composedConfig = getConfig(newconfig as MockerConfig);
        expect(composedConfig.$defaultResponse$!['success']).to.be.true;
        expect(composedConfig.routes!['*']!["/${id}"]).to.be.an.object();
        expect(composedConfig.routes!['*']!["/${id}"]['success']).to.be.false;
        expect(composedConfig.routes!['*']!["/${id}"]['data']).to.be.array;
        expect(composedConfig.routes!['*']!['/']['success']).to.be.true;
        expect(composedConfig.routes!['*']!['/']['data']).to.be.equal('New API');

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
        } catch(err: any) {
            expect(err.message).to.contain('ERROR validating config').to.contain('routes_missing');
        }
        
    });

    it('checks deepCopy', () => {
        const obj = {
            foo: 123,
            bar: {
                internal: 'Hi'
            }
        };
        const objCopy = deepCopy(obj) as Record<string, any>;
        expect(objCopy).to.be.an.object();
        expect(objCopy.foo).to.be.equal(123);
        expect(objCopy.bar.internal).to.be.equal('Hi');
        objCopy.bar.internal = 'Bye';
        expect(obj.bar.internal).to.be.equal('Hi');
    });

    it('checks deepCopy on null or undefined', () => {
        const obj = undefined;
        const objCopy = deepCopy(obj!);
        expect(objCopy).to.be.an.object();
        expect(objCopy).to.be.empty();
    });


});