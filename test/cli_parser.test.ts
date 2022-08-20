'use strict';

import { assertStringIncludes } from 'https://deno.land/std@0.85.0/testing/asserts.ts';
import { getParams } from '../src/cli_parser.ts';
import { assertEquals, afterEach, assert, assertFalse, assertInstanceOf, beforeAll, describe, it, restore, stub, assertIsError, assertSpyCallArg, assertSpyCallArgs, assertSpyCalls } from './test_deps.ts';


describe('Testing CLI parser', () => {

    beforeAll(() => {
        Deno.env.set('NODE_ENV', 'test');
    });

    afterEach(() => {
        restore();
    });
    
    it('checks default params', () => {
        const params = getParams();
        assert(typeof params === 'object');
        assertFalse(params.silent);
        assertFalse(params.verbose);
        assertEquals(params.config, []);
        assertEquals(params.port, 3003);
        assertEquals(params.host, '0.0.0.0');
    });

    it('checks config param', () => {

        const cliParams = ['--config', 'fichero1.yml', '--config', 'fichero2.yml', '--port', '8080'];
        Object.defineProperty(Deno, 'args', { value: cliParams });
        
        const validResp = "defaultResponse:\n    success: true\n";
        stub(Deno, 'readFileSync', () => new TextEncoder().encode(validResp));

        const params = getParams();
        assert(typeof params === 'object');
        assertFalse(params.silent);
        assertFalse(params.verbose);
        assertEquals(params.config, ['fichero1.yml', 'fichero2.yml']);
        assertEquals(params.port, 8080);
        assertEquals(params.host, '0.0.0.0');
        
    });

    it('checks missing config file', () => {
        Object.defineProperty(Deno, 'args', { value: ['-c', 'fichero1.yml'] });
        stub(Deno, 'readFileSync', () => {throw new Error("Missing file");});
        const exitStub = stub(Deno, 'exit', () => { 
            throw new Error('Exit'); 
        } );
        
        try {
            getParams();
        } catch(e: unknown) {
            assertIsError(e);
            assertStringIncludes(e.toString(), 'Exit');
        }
        assertSpyCalls(exitStub, 1);
        assertSpyCallArgs(exitStub, 0, [-1]);
    });

});