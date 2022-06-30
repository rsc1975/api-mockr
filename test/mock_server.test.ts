'use strict';

import Code from '@hapi/code';
import Lab from '@hapi/lab';
import { Server } from '@hapi/hapi';
import { MockServer } from'../src/mock_server';

const { expect } = Code;
const { it, describe, before } = exports.lab = Lab.script();

describe('Testing server management', () => {
    let mockServer : MockServer;

    before(() => {
        mockServer = new MockServer();
        process.env.NODE_ENV = 'test';
    });



    it('Server creation', () => {
        
        expect(mockServer.server instanceof Server).to.be.true;
    });
    
    it('Server ping', async () => {
        
        const res = await mockServer.server.inject({
            method: 'get',
            url: '/'
        });
        expect(res.payload).to.be.equal('API Mocker');
        expect(res.statusCode).to.be.equal(200);
    });

    it('Server forced error', async () => {
        
        let res = await mockServer.server.inject({
            method: 'get',
            url: '/api/whatever',
            headers: {
                'x-mocker-force-error': '400',
            }
        });
        expect(res.payload).to.be.equals('FORCED ERROR: 400');
        expect(res.statusCode).to.be.equals(400);

        res = await mockServer.server.inject({
            method: 'get',
            url: '/api/whatever',
            headers: {
                'x-mocker-force-error': '1045',
                'x-mocker-error-msg': 'Custom error msg',

            }
        });
        expect(res.payload).to.be.equal('Custom error msg');
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

    it('Start/stop server', async () => {
        const localMockServer : MockServer = new MockServer('localhost', 33333, '/testapi');
        expect(localMockServer.apiPrefix).to.be.equal("/testapi");
        expect(localMockServer.host).to.be.equal("localhost");
        expect(localMockServer.port).to.be.equal(33333);

        setTimeout(async () => {
            await localMockServer.dispose();
        }, 10);

        await localMockServer.start();
    });

    
    it('Server env params', async () => {
        process.env.MOCKER_PREFIX = '/test';
        process.env.MOCKER_BINDING = 'localhost';
        process.env.MOCKER_PORT = '5555';

        const localMockServer : MockServer = new MockServer();
        expect(localMockServer.apiPrefix).to.be.equal("/test");
        expect(localMockServer.host).to.be.equal("localhost");
        expect(localMockServer.port).to.be.equal(5555);
        
    });

    
    
});
