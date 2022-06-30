'use strict';

import { defaultResponseConfig, getConfig } from '../src/routes_config';

import Code from '@hapi/code';
import Lab from '@hapi/lab';

const { expect } = Code;
const { it, describe, before } = exports.lab = Lab.script();

describe('Testing routes config', () => {

    before(() => {
        process.env.NODE_ENV = 'test';
    });

    function evalDefaultConfig(conf: object) : void{
        expect(conf).to.be.an.object();
        expect(conf['$defaultRoute$']['success']).to.be.true;
        expect(conf['$error$']['success']).to.be.false;
        expect(conf['routes']['post']).to.be.an.object();
        expect(conf['routes']['post']['api/.*']).to.be.an.object();
        expect(conf['routes']['post']['api/.*']['success']).to.be.true;
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
                post: {
                    "api/.*": {
                        success: false,
                        data: [12, {ok: true}]
                    },
                    "/": {
                        success: true,
                        data: "New API"
                    }
                }
            }
        }
        const composedConfig = getConfig(newconfig);        
        expect(composedConfig['$defaultRoute$']['success']).to.be.true;
        expect(composedConfig['routes']['post']['api/.*']).to.be.an.object();
        expect(composedConfig['routes']['post']['api/.*']['success']).to.be.false;
        expect(composedConfig['routes']['post']['api/.*']['data']).to.be.array;
        expect(composedConfig['routes']['post']['/']['success']).to.be.true;
        expect(composedConfig['routes']['post']['/']['data']).to.be.equal('New API');
    });

});