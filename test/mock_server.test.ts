'use strict';

import Code from '@hapi/code';
import Lab from '@hapi/lab';
import { Server } from '@hapi/hapi';
import { MockServer, PING_MSG } from'../src/mock_server';
import Sinon from 'sinon';

const { expect } = Code;
const { it, describe, before, afterEach } = exports.lab = Lab.script();

describe('Testing server management', () => {
    let mockServer : MockServer;

    before(() => {
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
        process.env.NODE_ENV = 'test';
    });
    afterEach(() => {
        Sinon.restore();
    });

    it('Server creation', () => {
        
        expect(mockServer.server instanceof Server).to.be.true;
    });
    
    it('Server ping', async () => {
        
        const res = await mockServer.server.inject({
            method: 'get',
            url: '/'
        });
        expect(res.payload).to.startWith(PING_MSG);
        expect(res.statusCode).to.be.equal(200);
        const res2 = await mockServer.server.inject({
            method: 'get',
            url: '/?_pretty=1'
        });
        expect(res2.payload).to.startWith(PING_MSG);
    });

    it('Server delay', async () => {
        const t0 = Date.now();
        const delay = 100;
        const res = await mockServer.server.inject({
            method: 'get',
            url: `/?_delay=${delay}`
        });
        const t1 = Date.now();
        expect(t1 - t0).to.be.greaterThan(delay - 1); // Could be equal
    });

    it('Server forced error', async () => {
        
        let res = await mockServer.server.inject({
            method: 'get',
            url: '/api/whatever',
            headers: {
                'x-mocker-force-error': '400',
            }
        });
        let payload = JSON.parse(res.payload);
        expect(payload.success).to.be.false();
        expect(res.statusCode).to.be.equals(400);

        res = await mockServer.server.inject({
            method: 'get',
            url: '/api/whatever',
            headers: {
                'x-mocker-force-error': '1045',
                'x-mocker-error-msg': 'Custom error msg',
            }
        });
        payload = JSON.parse(res.payload);
        expect(payload.success).to.be.false();
        expect(payload.error).to.be.equal('Custom error msg');
        expect(res.statusCode).to.be.equal(500);

        res = await mockServer.server.inject({
            method: 'get',
            url: '/api/whatever?_forceError=true',
            
        });
        payload = JSON.parse(res.payload);
        expect(payload.success).to.be.false();
        expect(res.statusCode).to.be.equal(500);
    });

    it('Server no api call error', async () => {
        
        const res = await mockServer.server.inject({
            method: 'get',
            url: '/whatever'            
        });
        expect(res.payload).to.startsWith('Missing route, try:');
        expect(res.statusCode).to.be.equals(404);
    });

    it('Server basic api call', async () => {
        
        const res = await mockServer.server.inject({
            method: 'get',
            url: '/api/whatever'            
        });
        expect(res.statusCode).to.be.equal(200);
    });

    it('Server basic api call pretty', async () => {
        
        const res = await mockServer.server.inject({
            method: 'get',
            url: '/api/whatever?_pretty=1'
        });
        expect(res.statusCode).to.be.equal(200);
        expect(res.payload).to.contains('\n');
    });

    it('Start/stop server', async () => {
        const localMockServer : MockServer = new MockServer({host:'localhost', port:33333, apiPrefix:'/testapi', silent: true});
        expect(localMockServer.apiPrefix).to.be.equal("/testapi");
        expect(localMockServer.host).to.be.equal("localhost");
        expect(localMockServer.port).to.be.equal(33333);

        setTimeout(async () => {
            await localMockServer.dispose();
        }, 100);

        await localMockServer.start();
    });

    
    it('Server env params', async () => {
        process.env.MOCKER_PREFIX = 'test';
        process.env.MOCKER_BINDING = 'localhost';
        process.env.MOCKER_PORT = '5555';

        const localMockServer : MockServer = new MockServer({silent: true});
        expect(localMockServer.apiPrefix).to.be.equal("/test");
        expect(localMockServer.host).to.be.equal("localhost");
        expect(localMockServer.port).to.be.equal(5555);

        process.env.MOCKER_PREFIX = '';
        
        expect(new MockServer().apiPrefix).to.be.equal("");

    });

    it('Log request data verbose', async () => {
        const localMockServer : MockServer = new MockServer({apiPrefix:'/api', verbose:true});
        const logServer = Sinon.stub(localMockServer.server, 'log');
        const res = await localMockServer.server.inject({
            method: 'POST',
            url: '/api/whatever?hola=caracola&foo=bar',
            payload: "{ name: 'Rob' }",
            headers: {
                'content-type': 'text/plain',
            }
        });
        expect(res.statusCode).to.be.equal(200);
        expect(logServer.calledTwice).be.true();
        
        Sinon.assert.match(logServer.getCall(0).args[1], /DEBUG.*POST.*api\/whatever.*hola.*caracola.*name.*Rob/);
        Sinon.assert.match(logServer.getCall(1).args[1], /INFO.*POST.*api\/whatever.*200.*json/);

        const res2 = await localMockServer.server.inject({
            method: 'POST',
            url: '/api/whatever',
            payload: { name: 'Rob' },
        });
        expect(res.statusCode).to.be.equal(200);
        expect(logServer.callCount).be.equal(4);
        
        Sinon.assert.match(logServer.getCall(0).args[1], /DEBUG.*POST.*api\/whatever.*name.*Rob/);
        Sinon.assert.match(logServer.getCall(1).args[1], /INFO.*POST.*api\/whatever.*200.*json/);


        const res3 = await localMockServer.server.inject({
            method: 'GET',
            url: '/api/whatever'
        });
        expect(res3.statusCode).to.be.equal(200);
        expect(logServer.callCount).be.equal(6);
    });

    
    it('Log request data NO verbose', async () => {
        const localMockServer : MockServer = new MockServer({apiPrefix:'/api', silent: true});
        const logServer = Sinon.stub(localMockServer.server, 'log');
        const res = await localMockServer.server.inject({
            method: 'GET',
            url: '/api/getting_things?hola=caracola&foo=bar',
            payload: {
                name: 'Rob',
            }
        });
        expect(res.statusCode).to.be.equal(200);
        expect(logServer.calledOnce).be.true();
        
        Sinon.assert.match(logServer.getCall(0).args[1], /INFO.*GET.*api\/getting_things.*200.*json/);

    });

    it('Log event with silent/no-silent', async () => {
        const localMockServer : MockServer = new MockServer({apiPrefix:'/api', silent:true});
        const logConsole = Sinon.stub(console, 'info');

        await localMockServer.server.events.emit({name: 'log', tags: {'info':true}}, {data:'test-silent'});
        expect(logConsole.called).be.false();
        localMockServer.silent = false;
        await localMockServer.server.events.emit({name: 'log', tags: {'info':true}}, {data:'test-NO-silent'});
        expect(logConsole.calledOnce).be.true();
        expect(logConsole.getCall(0).args[0]).to.be.equal('test-NO-silent');

    });


    it('Log event with verbose', async () => {
        const localMockServer : MockServer = new MockServer({apiPrefix:'/api', verbose:true, silent: true});
        const logConsole = Sinon.stub(console, 'info');
        await localMockServer.server.events.emit({name: 'log', tags: {'verbose':true}}, {data:'test-verbose'});
        expect(localMockServer.verbose).be.false();
        expect(logConsole.called).be.false();
        localMockServer.verbose = true;
        localMockServer.silent = false;

        await localMockServer.server.events.emit({name: 'log', tags: {'verbose':false}}, {data:'test-verbose'});
        expect(logConsole.called).be.false();
        
        await localMockServer.server.events.emit({name: 'log', tags: {'verbose':true}}, {data:'test-verbose'});
        expect(logConsole.calledOnce).be.true();
        expect(logConsole.getCall(0).args[0]).to.be.equal('test-verbose');

    });



});
