
import { deepMerge, defaultResponseConfig, getConfig, MockerConfig } from '../src/routes_config';

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
                fullname: "${random.personFirstName} ${random.personLastName}",
                posts: [{
                    $length$: "${random.integer.12}",
                    title: "Lorem ipsum ${random.integer}"
                }]
            },
            '/cities/${code}': [{
                $length$: "${random.integer.7}",
                country: "${code}",
                pois: [{
                    name: "${random.city}"
                }],
                squares: [{
                    $length$: 10,
                    name: "${random.personFirstName}"
                }],
                malls: [{
                    $length$: "${random.integer.12}",
                    name: "${random.personFirstName}"
                }],
                libraries: [{
                    $length$: "${wrong.param}",
                    name: "wrong"
                }],
                schools: [{
                    $length$: "Not a number",
                    name: "wrong"
                }],
                annualRanking: ["${random.integer.12}"],
                location: [222.22, 111.11],
                founders: ['Hola Caracola'],                
                majors: [{
                    firts: true,
                    name: "${random.personFullName}"
                },
                {
                    name: "${random.personFullName}"
                }],
                name: "${random.city} ${random.integer.10} ${code} ${wrong.param}",
                population: "${random.integer.10000000}"
            }]
        }
    }

}

describe('Testing response generators', () => {

    before(() => {
        process.env.NODE_ENV = 'test';
    });

    async function createRequest(url: string = '/api/test', 
                                    params: string = 'bar=baz&foo=fo0', 
                                    method: string = 'GET') : Promise<Request> {
        const request : ServerInjectOptions = {
            url: `${url}?${params}`,
            method: method,
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
        const totalPathRoutess = Object.keys(CONFIG.routes!['*']!).length;
        expect(CONFIG._rePath!['*']).to.be.array().length(totalPathRoutess);
        expect(CONFIG._rePath!['*']![0].path).to.startsWith('/')
        expect(CONFIG._rePath!['*']![totalPathRoutess - 1].path).to.be.equal('*');
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
        const response : any = new ResponseGenerator(await createRequest('/api/user/rsanchez/34'), CONFIG, '/api').generate();
        expect(response).to.be.an.object();
        expect(response.success).to.be.true();
        expect(response.username).to.be.equal('rsanchez');
        expect(+response.id).to.be.equal(34);
    });


    it('checks response as array path vars', async () => {
        const response : any = new ResponseGenerator(await createRequest('/api/cities/es'), CONFIG, '/api').generate();

        expect(response).to.be.an.array();
        expect(+response.length).to.be.lessThan(8).greaterThan(0);
        expect(response[0].country).to.be.equal('es');
        expect(response[0].name).to.be.string();
        expect(+response[0].population).to.be.lessThan(10000000);        
        expect(response[0].pois).to.be.array().length(2); // Default length is 2
        expect(response[0].majors).to.be.array().length(2);
        expect(response[0].squares).to.be.array();
        expect(+response[0].squares.length).to.be.lessThan(11);
        expect(response[0].libraries).to.be.array().length(2);
        expect(response[0].schools).to.be.array().length(2);
    });

    it('checks response as fixed array', async () => {
        const newConfig : MockerConfig = {
            $defaultResponse$: [{
                    num: '${random.integer.10}'
                },{
                    num: '${random.integer.10}',
                    name: '${random.personFirstName}'
                }]            
        }
        const response : any = new ResponseGenerator(await createRequest('/api/whatever'), newConfig, '/api').generate();

        expect(response).to.be.an.array().length(2);
        expect(+response[0].num).to.be.number().lessThan(11);
        expect(response[1].name).to.be.string();
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

        const newConfig2 : MockerConfig = {
            $defaultResponse$: {
                success: true
            }, routes: {
                'get': {
                    '/missing': {
                        success: true
                    }
                }
            }
        }
        const response2 : any = new ResponseGenerator(await createRequest('/api/user', 'hola=caracola'), newConfig2, '/api').generate();
        expect(response2).to.be.an.object();
        expect(response2.success).to.be.true();

    });

    it('checks no default response', async () => {
        const noDefaultConfig : MockerConfig = {
            routes: {
               'get': {
                   '/missingpath': {
                       success: true
                   }
               }
           }
        };

        const respGenerator : ResponseGenerator = new ResponseGenerator(await createRequest('/api/whatever'), noDefaultConfig, '/api');
        const response : any = respGenerator.generate();
        expect(response).to.be.an.object();
        expect(response).to.be.empty();

        const noDefaultConfig2 : MockerConfig = {
            routes: {
               'put': {
                   '/missingpath': {
                       success: true
                   }
               }
           }
        };
        
        const response2 : any = new ResponseGenerator(await createRequest('/api/whatever'), noDefaultConfig2, '/api').generate();
        expect(response2).to.be.an.object();
        expect(response2).to.be.empty();
    });
});