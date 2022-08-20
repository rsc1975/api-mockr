
import { assertEquals, assertExists } from 'https://deno.land/std@0.85.0/testing/asserts.ts';
import { AnyObj } from '../src/common/utils.ts';
import { ResponseGenerator } from '../src/response_generator.ts';
import { MockerConfig } from '../src/routes_config.ts';
import { assert, beforeAll, describe, extendRequestPrototype, it } from './test_deps.ts';


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

    beforeAll(() => {
        Deno.env.set('NODE_ENV', 'test');
    });


    function createRequest(url = '/api/test', 
                            params: Record<string, string> = {bar: 'baz', foo: 'fo0'}, 
                            method = 'GET') : Request {
        const searchParams = new URLSearchParams(params);
        const body = (['POST', 'PUT'].includes(method)) ? JSON.stringify({
            email: 'r@r.es',
            password: 'secred',
            firstname: 'John',
            lastname: 'Doe'
          }) : undefined;

        const request = new Request(`http://localhost:3003${url}?${searchParams}`, {
            method: method,
            body: body,
            headers: {
                'content-type': 'application/json',
                'X-CUSTOM-HEADER': 'Hola!'
            }
          });
        extendRequestPrototype();
        return request; 
    }


    it('checks config pre-processor', () => {
        //const req : Request = createRequest();
        new ResponseGenerator(CONFIG, '/api');
        assertExists(CONFIG._rePath);
        const totalPathRoutess = Object.keys(CONFIG.routes!['*']!).length;
        const rePath = CONFIG._rePath!['*'];
        assert(Array.isArray(rePath), '_rePath["*"] is an array');
        assertEquals(rePath.length,  totalPathRoutess);
        assert(rePath![0].path.startsWith('/'));
        assertEquals(rePath![totalPathRoutess - 1].path, '*');
    });

    it('checks response template is found', async () => {
        const req : Request = createRequest();
        const respGenerator : ResponseGenerator = new ResponseGenerator(CONFIG, '/api');
        const response = await respGenerator.generate(req) as AnyObj;

        assertExists(response);
        assertEquals(response.prueba, undefined);
        assertEquals(response.test, true);
        assertEquals(typeof response.date, 'string');        
    });

    it('checks response template with path vars', async () => {
        const req : Request = createRequest('/api/user/rsanchez/34');
        const response = await new ResponseGenerator(CONFIG, '/api').generate(req) as AnyObj;
        assertExists(response);
        assertEquals(response.success, true);
        assertEquals(response.username, 'rsanchez');
        assertEquals(+(response.id as string), 34);
    });


    it('checks response as array path vars', async () => {
        const req : Request = createRequest('/api/cities/es');
        const response = await new ResponseGenerator(CONFIG, '/api').generate(req) as AnyObj;

        assert(Array.isArray(response), 'response is an array');
        assert(+response.length > 0 && +response.length < 8);
        assertEquals(response[0].country, 'es');
        assertEquals(typeof response[0].name, 'string');
        assert(+response[0].population < 10000000);        
        assertEquals(response[0].pois.length, 2); // Default length is 2
        assertEquals(response[0].majors.length, 2);
        assert(Array.isArray(response[0].squares));
        assert(+response[0].squares.length < 11);
        assertEquals(response[0].libraries.length, 2);
        assertEquals(response[0].schools.length, 2);
    });

    it('checks response as fixed array', async () => {
        const newConfig : MockerConfig = {
            defaultResponse: [{
                    num: '${random.integer.10}'
                },{
                    num: '${random.integer.10}',
                    name: '${random.personFirstName}'
                }]            
        }
        const req : Request = createRequest('/api/whatever');
        const response = await new ResponseGenerator(newConfig, '/api').generate(req) as AnyObj;

        assert(Array.isArray(response));
        assertEquals(response.length, 2);
        assert(+(response[0].num) < 11);
        assertEquals(typeof response[1].name, 'string');
    });

    it('checks default response', async () => {
        const newConfig : MockerConfig = {
            defaultResponse: {
                success: true,
                request: {
                    path: '${request.path}',
                    params: '${request.params}'
                }
            }
        }
        const req : Request = createRequest('/api/user', {hola: 'caracola'});
        const respGenerator : ResponseGenerator = new ResponseGenerator(newConfig, '/api');
        // deno-lint-ignore no-explicit-any
        const response  = await respGenerator.generate(req) as any;
        assertExists(response);
        assertEquals(response.success, true);
        assertExists(response.request);
        assertEquals(response.request.path, '/api/user');
        assertEquals(typeof response.request.params, 'object');
        assertEquals(response.request.params.hola, 'caracola');

        const newConfig2 : MockerConfig = {
            defaultResponse: {
                success: true
            }, routes: {
                'get': {
                    '/missing': {
                        success: true
                    }
                }
            }
        }
        const response2 = await new ResponseGenerator(newConfig2, '/api').generate(req) as AnyObj;
        assertExists(response2);
        assertEquals(response2.success, true);

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

        const req = createRequest('/api/whatever');
        const respGenerator : ResponseGenerator = new ResponseGenerator( noDefaultConfig, '/api');
        const response = await respGenerator.generate(req);
        assertExists(response);
        assertEquals(response, {});

        const noDefaultConfig2 : MockerConfig = {
            routes: {
               'put': {
                   '/missingpath': {
                       success: true
                   }
               }
           }
        };
        
        const response2 = await new ResponseGenerator(noDefaultConfig2, '/api').generate(req);
        assertExists(response2);
        assertEquals(response, {});
    });


    it('checks error configured response', () => {
        const newConfig : MockerConfig = {
            errorResponse: {
                success: false,
                error: '${error}'
            }
        }
        const req = createRequest('/api/user');
        const respGenerator : ResponseGenerator = new ResponseGenerator(newConfig, '/api');
        let response : any = respGenerator.generateError(req, "Prueba", 404);
        
        assertEquals(response.payload.success, false);
        assertEquals(response.payload.error, "Prueba");
        assertEquals(response.httpStatus, 404);

        response = respGenerator.generateError(req, undefined, 700);
        assertEquals(response.payload.success, false);
        assertEquals(response.payload.error, "Error in request to path: /api/user");
        assertEquals(response.httpStatus, 500);
        
        response = respGenerator.generateError(req, undefined, 100);
        assertEquals(response.httpStatus, 500);
        response = respGenerator.generateError(req);
        assertEquals(response.httpStatus, 500);

        const newConfig2 : MockerConfig = {
            errorResponse: {
                $httpStatus$: 418,
                success: false
            }
        }
        const respGenerator2 : ResponseGenerator = new ResponseGenerator(newConfig2, '/api');
        response = respGenerator2.generateError(req);
        assertEquals(response.httpStatus, 418);


    });

    it('checks error non configured response', () => {
        const req = createRequest('/api/user');
        const respGenerator : ResponseGenerator = new ResponseGenerator({}, '/api');
        const response = respGenerator.generateError(req);
        assertEquals(response.httpStatus, 500);
        assertEquals(response.payload.success, false);
    });

    it('checks _clonePayload param', async () => {
        //const req : unknown = {payload: {a: 1, b: 2}, query: {_clonePayload: true}};
        const req = createRequest('/api/user', {_clonePayload: 'true'}, 'POST');
        const body = await req.parseBody();
        const respGenerator : ResponseGenerator = new ResponseGenerator({}, '/api');
        const response = await respGenerator.generate(req) as AnyObj;
        assertExists(response);
        assertEquals(response, body);
    });


});