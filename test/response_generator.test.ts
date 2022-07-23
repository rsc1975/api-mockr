
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
    
    $defaultResponse$: {
        success: true,
        request: {
            path: '${request.path}',
            params: '${request.params}'
        }
    },
    routes: {
        '*': {
            '*': {
                prueba: true,
                datetime: "${server.isoDatetime}"
            }
        }
    }

}

describe('Testing response generators', () => {

    before(() => {
        process.env.NODE_ENV = 'test';
    });

    async function createRequest() : Promise<Request> {
        const request : ServerInjectOptions = {
            url: '/api/test?bar=baz&foo=fo0',
            method: 'POST',
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
        const respGenerator : ResponseGenerator = new ResponseGenerator(await createRequest(), CONFIG);
        console.log(CONFIG._rePath);
    });

    it('checks ParamValues for random', () => {
        
    });


});