
import { getCallerIP, getVersion, isEmpty, pathname } from "../../src/common/utils.ts";
import { assert, assertEquals, assertFalse, Context, extendRequestPrototype, HonoContext, it, restore, stub } from "../test_deps.ts";
import { afterEach } from "../test_deps.ts";
import { beforeAll } from "../test_deps.ts";
import { describe } from "../test_deps.ts";


describe('Testing Config model validator', () => {

    beforeAll(() => {
        Deno.env.set('NODE_ENV', 'test');
    });

    afterEach(() => {

    });

    it('checks isEmpty', () => {
        assertFalse(isEmpty({ hola: 23 }), 'Obj is NOT empty');
        assert(isEmpty({}), 'Obj is empty');
    });
    it('checks pathname', () => {
        assertEquals(pathname('https://localhost/'), '/');
        assertEquals(pathname('http://localhost/api'), '/api');
        assertEquals(pathname('https://localhost/api/whatever?foo=bar'), '/api/whatever');
        assertEquals(pathname('http://localhost'), '/');
        assertEquals(pathname(''), '');
    });

    function createContext(headers: Record<string, string>, ctxIp?: string): Context {

        const request = new Request('http://localhost:3003/', {
            method: 'GET',            
            headers: headers
        });
        extendRequestPrototype();
        const env = {
            remoteAddr: { hostname: ctxIp }
        }
        return new HonoContext(request, env);
    }

    it('checks getCallerIp', () => {
        let ctx = createContext({'x-forwarded-for': '1.1.1.1'});
        let ip = getCallerIP(ctx);
        assertEquals(ip, '1.1.1.1');

        ctx = createContext({'x-real-ip': '1.1.1.2'});
        ip = getCallerIP(ctx);
        assertEquals(ip, '1.1.1.2');

        ctx = createContext({'cf-connecting-ip': '1.1.1.3'});
        ip = getCallerIP(ctx);
        assertEquals(ip, '1.1.1.3');

        ctx = createContext({}, '1.1.1.4');
        ip = getCallerIP(ctx);
        assertEquals(ip, '1.1.1.4');

        ctx = createContext({});
        ip = getCallerIP(ctx);
        assertEquals(ip, 'unknown');
    });

    it('checks getVersion', async () => {

        stub(Deno, 'readFile', () => {            
            return Promise.resolve(new TextEncoder().encode('0.0.0'));
        });            
        
        let v = await getVersion();
        assertEquals(v, '0.0.0');

        Deno.env.set('MOCKR_VERSION', '0.0.1');

        v = await getVersion();
        assertEquals(v, '0.0.1');
        restore();
        Deno.env.delete('MOCKR_VERSION');

        stub(Deno, 'readFile', () => {
            throw Error('File not found');
        });            
        v = await getVersion();
        assertEquals(v, 'Unknown');

    });
});