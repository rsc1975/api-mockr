import { assertFalse } from "https://deno.land/std@0.152.0/testing/asserts.ts";
import { assertExists } from "https://deno.land/std@0.85.0/testing/asserts.ts";
import { PING_MSG, RESPONSE_TIME_HEADER } from "../src/common/http.ts";
import { MockServer } from "../src/mock_server.ts";
import { afterEach, assertStringIncludes, assert, assertEquals, assertInstanceOf, beforeAll, describe, Hono, it, restore } from "./test_deps.ts";


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
        const req = new Request(`${baseUrl}/`, {
            method: 'GET',
        });
        const res = await mockServer.server.request(req);
        assert((await res.text()).startsWith(PING_MSG));        
        assertEquals(res.status, 200);

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

    // it('Start/stop server', async () => {
    //     const localMockServer : MockServer = new MockServer({host:'localhost', port:33333, apiPrefix:'/testapi', silent: true});
    //     expect(localMockServer.apiPrefix).to.be.equal("/testapi");
    //     expect(localMockServer.host).to.be.equal("localhost");
    //     expect(localMockServer.port).to.be.equal(33333);

    //     setTimeout(async () => {
    //         await localMockServer.dispose();
    //     }, 100);

    //     await localMockServer.start();
    // });

    
    // it('Server env params', async () => {
    //     process.env.MOCKER_PREFIX = 'test';
    //     process.env.MOCKER_BINDING = 'localhost';
    //     process.env.MOCKER_PORT = '5555';

    //     const localMockServer : MockServer = new MockServer({silent: true});
    //     expect(localMockServer.apiPrefix).to.be.equal("/test");
    //     expect(localMockServer.host).to.be.equal("localhost");
    //     expect(localMockServer.port).to.be.equal(5555);

    //     process.env.MOCKER_PREFIX = '';
        
    //     expect(new MockServer().apiPrefix).to.be.equal("");

    // });

    // it('Log request data verbose', async () => {
    //     const localMockServer : MockServer = new MockServer({apiPrefix:'/api', verbose:true});
    //     const logServer = Sinon.stub(localMockServer.server, 'log');
    //     const res = await localMockServer.server.inject({
    //         method: 'POST',
    //         url: '/api/whatever?hola=caracola&foo=bar',
    //         payload: "{ name: 'Rob' }",
    //         headers: {
    //             'content-type': 'text/plain',
    //         }
    //     });
    //     expect(res.statusCode).to.be.equal(200);
    //     expect(logServer.calledTwice).be.true();
        
    //     Sinon.assert.match(logServer.getCall(0).args[1], /DEBUG.*POST.*api\/whatever.*hola.*caracola.*name.*Rob/);
    //     Sinon.assert.match(logServer.getCall(1).args[1], /INFO.*POST.*api\/whatever.*200.*json/);

    //     const res2 = await localMockServer.server.inject({
    //         method: 'POST',
    //         url: '/api/whatever',
    //         payload: { name: 'Rob' },
    //     });
    //     expect(res.statusCode).to.be.equal(200);
    //     expect(logServer.callCount).be.equal(4);
        
    //     Sinon.assert.match(logServer.getCall(0).args[1], /DEBUG.*POST.*api\/whatever.*name.*Rob/);
    //     Sinon.assert.match(logServer.getCall(1).args[1], /INFO.*POST.*api\/whatever.*200.*json/);


    //     const res3 = await localMockServer.server.inject({
    //         method: 'GET',
    //         url: '/api/whatever'
    //     });
    //     expect(res3.statusCode).to.be.equal(200);
    //     expect(logServer.callCount).be.equal(6);
    // });

    
    // it('Log request data NO verbose', async () => {
    //     const localMockServer : MockServer = new MockServer({apiPrefix:'/api', silent: true});
    //     const logServer = Sinon.stub(localMockServer.server, 'log');
    //     const res = await localMockServer.server.inject({
    //         method: 'GET',
    //         url: '/api/getting_things?hola=caracola&foo=bar',
    //         payload: {
    //             name: 'Rob',
    //         }
    //     });
    //     expect(res.statusCode).to.be.equal(200);
    //     expect(logServer.calledOnce).be.true();
        
    //     Sinon.assert.match(logServer.getCall(0).args[1], /INFO.*GET.*api\/getting_things.*200.*json/);

    // });

    // it('Log event with silent/no-silent', async () => {
    //     const localMockServer : MockServer = new MockServer({apiPrefix:'/api', silent:true});
    //     const logConsole = Sinon.stub(console, 'info');

    //     await localMockServer.server.events.emit({name: 'log', tags: {'info':true}}, {data:'test-silent'});
    //     expect(logConsole.called).be.false();
    //     localMockServer.silent = false;
    //     await localMockServer.server.events.emit({name: 'log', tags: {'info':true}}, {data:'test-NO-silent'});
    //     expect(logConsole.calledOnce).be.true();
    //     expect(logConsole.getCall(0).args[0]).to.be.equal('test-NO-silent');

    // });


    // it('Log event with verbose', async () => {
    //     const localMockServer : MockServer = new MockServer({apiPrefix:'/api', verbose:true, silent: true});
    //     const logConsole = Sinon.stub(console, 'info');
    //     await localMockServer.server.events.emit({name: 'log', tags: {'verbose':true}}, {data:'test-verbose'});
    //     expect(localMockServer.verbose).be.false();
    //     expect(logConsole.called).be.false();
    //     localMockServer.verbose = true;
    //     localMockServer.silent = false;

    //     await localMockServer.server.events.emit({name: 'log', tags: {'verbose':false}}, {data:'test-verbose'});
    //     expect(logConsole.called).be.false();
        
    //     await localMockServer.server.events.emit({name: 'log', tags: {'verbose':true}}, {data:'test-verbose'});
    //     expect(logConsole.calledOnce).be.true();
    //     expect(logConsole.getCall(0).args[0]).to.be.equal('test-verbose');

    // });



});
