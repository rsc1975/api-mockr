
import { defaultResponseConfig, getConfig, MockerConfig } from '../src/routes_config';

import Code from '@hapi/code';
import Lab from '@hapi/lab';
import { Request, ServerInjectOptions } from '@hapi/hapi';
import { MockServer } from'../src/mock_server';
import { ResponseGenerator } from'../src/response_generator';

const { expect } = Code;
const { it, describe, before } = exports.lab = Lab.script();

/*
$defaultResponse$:
  success: true
  request:
    path: ${request.path} 
    body: ${request.payload}
    params: ${request.params}
$error$:
  $httpStatus$: 500
  success: false
  error: "Error occurred for request: ${request.path}"
  request:
    body: ${request.payload}
    params: ${request.params}
routes:
  post: 
    ".*":
      success: true            
      request: 
        body: ${request.payload}
        params: ${request.params}
*/
const CONFIG : MockerConfig = {
    routes: {
        '*': {
            '*': {
                prueba: true,
                datetime: "${server.isoDatetime}"
            },
            'test': {
                test: true,
                date: "${server.isoDate}"
            },
            '/user/${username}/${id}': {
                success: true,
                id: "${id}",
                username: "${username}",
                fullname: "${random.personFullName}"
            }
        }
    }

}

describe('Testing response generators', () => {

    before(() => {
        process.env.NODE_ENV = 'test';
    });

    async function createRequest(url: string = '/api/test', 
                                    params: string = 'bar=baz&foo=fo0', 
                                    method: string = 'POST') : Promise<Request> {
        const request : ServerInjectOptions = {
            url: `${url}?${params}`,
            method: method,
            payload: {
              email: 'r@r.es',
              password: 'secred',
              firstname: 'John',
              lastname: 'Doe'
            },
            headers: {
                'X-CUSTOM-HEADER': 'Hola!'
            },
            app: {}
          };
        const server = new MockServer({apiPrefix: '/api'}).server;
        const response = await server.inject(request);

        return response.request; 
    }


    it('checks config pre-processor', async () => {
        const respGenerator : ResponseGenerator = new ResponseGenerator(await createRequest(), CONFIG, '/api');
        expect(CONFIG._rePath).to.be.an.object();
        expect(CONFIG._rePath!['*']).to.be.array().length(3);
        expect(CONFIG._rePath!['*']![0].path).to.startsWith('/')
        expect(CONFIG._rePath!['*']![2].path).to.be.equal('*');
    });

    it('checks response template is found', async () => {
        const respGenerator : ResponseGenerator = new ResponseGenerator(await createRequest(), CONFIG, '/api');
        const response : any = respGenerator.generate();

        expect(response).to.be.an.object();
        expect(response.prueba).to.be.undefined();
        expect(response.test).to.be.true();
        expect(response.date).to.be.string();        
    });

    it('checks response template with path vars', async () => {
        const respGenerator : ResponseGenerator = new ResponseGenerator(await createRequest('/api/user/rsanchez/34'), CONFIG, '/api');
        const response : any = respGenerator.generate();
        expect(response).to.be.an.object();
        expect(response.success).to.be.true();
        expect(response.username).to.be.equal('rsanchez');
        expect(+response.id).to.be.equal(34);
    });


    it('checks default response', async () => {
        const newConfig : MockerConfig = {
            $defaultResponse$: {
                success: true,
                request: {
                    path: '${request.path}',
                    params: '${request.params}'
                }
            }
        }
        const respGenerator : ResponseGenerator = new ResponseGenerator(await createRequest('/api/user', 'hola=caracola'), newConfig, '/api');
        const response : any = respGenerator.generate();
        expect(response).to.be.an.object();
        expect(response.success).to.be.true();
        expect(response.request).to.be.an.object();
        expect(response.request.path).to.be.equal('/api/user');
        expect(response.request.params).to.be.an.object();
        expect(response.request.params.hola).to.be.equal('caracola');
    });

});