import { assertFalse } from "https://deno.land/std@0.152.0/testing/asserts.ts";
import { assertExists } from "https://deno.land/std@0.85.0/testing/asserts.ts";
import { PING_MSG, RESPONSE_TIME_HEADER } from "../src/common/http.ts";
import { MockServer } from "../src/mock_server.ts";
import { stub, assertMatch, afterEach, assertStringIncludes, assert, assertEquals, assertInstanceOf, beforeAll, describe, Hono, it, restore, spy, assertSpyCalls, assertSpyCallArg } from "./test_deps.ts";


describe('Testing server management', () => {
    let mockServer : MockServer;
    let baseUrl : string;
    beforeAll(() => {
        const responseConfig = {
            defaultResponse: {
                success: true
            },
            errorResponse: {
                success: false,
                error: "${error}"
            }
        }
        mockServer = new MockServer({responseConfig, apiPrefix: '/api', silent: true, version: 'test-version'});
        baseUrl = `http://${mockServer.host}:${mockServer.port}`;
        Deno.env.set('NODE_ENV', 'test');
    });
    afterEach(() => {
        restore();
    });

    it('Server creation', () => {
        
        assertInstanceOf(mockServer.server, Hono);
    });
    
    it('Server ping', async () => {
        const req = new Request(`${baseUrl}/`);
        const localMockServer : MockServer = new MockServer({silent: true});
        const res = await localMockServer.server.request(req);
        assert((await res.text()).startsWith(PING_MSG));        
        assertEquals(res.status, 200);
    });

    
    it('Server elapsed time', async () => {
        const req = new Request(`${baseUrl}/`);
        stub(Deno.permissions, 'query', () => {            
            return Promise.resolve({state: "granted" as Deno.PermissionState, onchange: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => true});
        });
        await mockServer.checkHRTime();
        const res = await mockServer.server.request(req);
        assertEquals(res.status, 200);
        assertExists(res.headers.get(RESPONSE_TIME_HEADER));
        assertMatch(res.headers.get(RESPONSE_TIME_HEADER)!, /\d+ us/);        

        restore();
        stub(Deno.permissions, 'query', () => {            
            return Promise.resolve({state: "denied" as Deno.PermissionState, onchange: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => true});
        });
        await mockServer.checkHRTime();
        const res2 = await mockServer.server.request(req);        
        assertEquals(res2.status, 200);
        assertMatch(res2.headers.get(RESPONSE_TIME_HEADER)!, /\d+ ms/);        
    });
    

    it('Server delay', async () => {
        const t0 = Date.now();
        const delay = 100;
        await mockServer.server.request(new Request(`${baseUrl}/?_delay=${delay}`));
        const t1 = Date.now();
        assert((t1 - t0) > (delay - 1)); // Could be equal
    });

    it('Server forced error', async () => {
        const req = new Request(`${baseUrl}/api/whatever`, {
            headers: {
                'x-mockr-force-error': '400',
            }
        });
        let res = await mockServer.server.request(req);
        let payload = await res.json();
        assertFalse(payload.success);
        assertEquals(res.status, 400);

        res = await mockServer.server.request(
            new Request(`${baseUrl}/api/whatever`, {
                headers: {
                    'x-mockr-force-error': '1045',
                    'x-mockr-error-msg': 'Custom error msg',
                    }
            })
        );
        payload = await res.json();
        assertFalse(payload.success);
        assertEquals(payload.error, 'Custom error msg');
        assertEquals(res.status, 500);

        res = await mockServer.server.request(
            new Request(`${baseUrl}/api/whatever?_forceError=true` ));
        payload = await res.json();
        assertFalse(payload.success);
        assertEquals(res.status, 500);
    });

    it('Server no api call error', async () => {
        const req = new Request(`${baseUrl}/whatever`);
        const res = await mockServer.server.request(req);
        const payload = await res.text();
        console.log(payload)
        assert(payload.startsWith('Missing route, try:'));
        assertEquals(res.status, 404);
    });

    it('Server basic api call', async () => {
        const req = new Request(`${baseUrl}/api/whatever`);
        const res = await mockServer.server.request(req);
        assertExists(res.headers.get(RESPONSE_TIME_HEADER));
        assertEquals(res.status, 200);
    });

    it('Server basic api call pretty', async () => {
        const req = new Request(`${baseUrl}/api/whatever?_pretty=1`);
        
        const res = await mockServer.server.request(req);
        assertEquals(res.status, 200);
        const textPayload = await res.text();
        assertStringIncludes(textPayload, '\n');
    });

    it('Start/stop server', async () => {
        const localMockServer : MockServer = new MockServer({host:'localhost', port:33333, apiPrefix:'/testapi', silent: true});
        
        assertEquals(localMockServer.apiPrefix, "/testapi");
        assertEquals(localMockServer.host, "localhost");
        assertEquals(localMockServer.port, 33333);

        setTimeout(async () => {
            await localMockServer.stop();
        }, 100);

        await localMockServer.start();
    });

    
    it('Server env params', () => {
        Deno.env.set('MOCKR_PREFIX', 'test');
        Deno.env.set('MOCKR_BINDING', 'localhost');
        Deno.env.set('MOCKR_PORT', '5555');

        const localMockServer : MockServer = new MockServer({silent: true});
        assertEquals(localMockServer.apiPrefix, "/test");
        assertEquals(localMockServer.host, "0.0.0.0");
        assertEquals(localMockServer.port, 5555);

        Deno.env.set('MOCKR_PREFIX', '');
        
        assertEquals(new MockServer().apiPrefix, "");        

    });

    it('Log request data verbose', async () => {
        const localMockServer : MockServer = new MockServer({apiPrefix:'/api', verbose:true});
        const logServer = spy(localMockServer, 'log');
        const res = await localMockServer.server.request(new Request('http://localhost/api/whatever?hola=caracola&foo=bar', {
            method: 'POST',            
            body: "{ name: 'Rob' }",
            headers: {
                'content-type': 'text/plain',
            }
        }));
        assertEquals(res.status, 200);
        assertSpyCalls(logServer, 2);
        
        assertSpyCallArg(logServer, 0, 0, 'verbose');
        assertMatch(logServer.calls.at(0)?.args[1]!, /DEBUG.*POST.*api\/whatever.*hola.*caracola.*name.*Rob/);
        
        //assertSpyCallArg(logServer, 1, [/INFO.*POST.*api\/whatever.*200.*json/]);

        const res2 = await localMockServer.server.request(new Request('http://localhost/api/whatever', {
            method: 'POST',            
            body: '{ "name": "Rob" }',
            headers: {
                'content-type': 'application/json',
            }
        }));
        assertEquals(res2.status, 200);
        assertSpyCalls(logServer, 4);
        
        assertSpyCallArg(logServer, 2, 0, 'verbose');
        assertMatch(logServer.calls.at(2)?.args[1]!, /DEBUG.*POST.*api\/whatever.*name.*Rob/);
        assertMatch(logServer.calls.at(3)?.args[0]!, /INFO.*POST.*api\/whatever.*200.*json/);


        const res3 = await localMockServer.server.request(new Request('http://loclahost/api/whatever'));
        assertEquals(res3.status, 200);
        assertSpyCalls(logServer, 6);
        assertSpyCallArg(logServer, 4, 0, 'verbose');
        assertMatch(logServer.calls.at(4)?.args[1]!, /DEBUG.*GET.*api\/whatever/);
        assertMatch(logServer.calls.at(5)?.args[0]!, /INFO.*GET.*api\/whatever.*200/);
    });

    
    it('Log request data NO verbose', async () => {
        const localMockServer : MockServer = new MockServer({apiPrefix:'/api', silent: true});
        const logServer = spy(localMockServer, 'log');
        const logConsole = spy(console, 'info');
        const res = await localMockServer.server.request(new Request('http://localhost/api/getting_things?hola=caracola&foo=bar'));
        assertEquals(res.status, 200);
        assertSpyCalls(logServer, 1);
        assertSpyCalls(logConsole, 0);        

    });

    // it('Log event with silent/no-silent', async () => {
    //     const localMockServer : MockServer = new MockServer({apiPrefix:'/api', silent:true});
    //     const logConsole = Sinon.stub(console, 'info');

    //     await localMockServer.server.events.emit({name: 'log', tags: {'info':true}}, {data:'test-silent'});
    //     assert(logConsole.called).be.false();
    //     localMockServer.silent = false;
    //     await localMockServer.server.events.emit({name: 'log', tags: {'info':true}}, {data:'test-NO-silent'});
    //     assert(logConsole.calledOnce).be.true();
    //     assert(logConsole.getCall(0).args[0]).to.be.equal('test-NO-silent');

    // });


    // it('Log event with verbose', async () => {
    //     const localMockServer : MockServer = new MockServer({apiPrefix:'/api', verbose:true, silent: true});
    //     const logConsole = Sinon.stub(console, 'info');
    //     await localMockServer.server.events.emit({name: 'log', tags: {'verbose':true}}, {data:'test-verbose'});
    //     assert(localMockServer.verbose).be.false();
    //     assert(logConsole.called).be.false();
    //     localMockServer.verbose = true;
    //     localMockServer.silent = false;

    //     await localMockServer.server.events.emit({name: 'log', tags: {'verbose':false}}, {data:'test-verbose'});
    //     assert(logConsole.called).be.false();
        
    //     await localMockServer.server.events.emit({name: 'log', tags: {'verbose':true}}, {data:'test-verbose'});
    //     assert(logConsole.calledOnce).be.true();
    //     assert(logConsole.getCall(0).args[0]).to.be.equal('test-verbose');

    // });



});
