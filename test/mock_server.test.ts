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
        mockServer = new MockServer({responseConfig, apiPrefix: '/api'});
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
        expect(res.payload).to.be.equal(PING_MSG);
        expect(res.statusCode).to.be.equal(200);
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
        const localMockServer : MockServer = new MockServer({host:'localhost', port:33333, apiPrefix:'/testapi'});
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

        const localMockServer : MockServer = new MockServer();
        expect(localMockServer.apiPrefix).to.be.equal("/test");
        expect(localMockServer.host).to.be.equal("localhost");
        expect(localMockServer.port).to.be.equal(5555);

        process.env.MOCKER_PREFIX = '';
        
        expect(new MockServer().apiPrefix).to.be.equal("");

    });

    it('Log request data', async () => {
        const localMockServer : MockServer = new MockServer({apiPrefix:'/api', verbose:true});
        const logServer = Sinon.stub(localMockServer.server, 'log');
        const res = await localMockServer.server.inject({
            method: 'POST',
            url: '/api/whatever?hola=caracola&foo=bar',
            payload: {
                name: 'Rob',
            }
        });
        expect(res.statusCode).to.be.equal(200);
        expect(logServer.calledOnce).be.true();
        //console.log('LLAMADAS:', logConsole.calledOnce, logConsole.getCall(0).args);
        
        Sinon.assert.match(logServer.getCall(0).args[0], /POST.*api\/whatever.*hola.*caracola.*name.*Rob/);

        const res2 = await localMockServer.server.inject({
            method: 'GET',
            url: '/api/different'
        });
        expect(res.statusCode).to.be.equal(200);
        expect(logServer.calledTwice).be.true();
        Sinon.assert.match(logServer.getCall(1).args[0], /GET.*api\/different/);

    });
    
    
});
