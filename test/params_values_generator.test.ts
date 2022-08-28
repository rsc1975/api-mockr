
import { AnyObj, pathname } from '../src/common/utils.ts';
import { ParamValues } from '../src/param_values_generator.ts';
import { assert, assertArrayIncludes, assertEquals, assertExists, assertFalse, assertMatch, assertNotEquals, assertStrictEquals, beforeAll, describe, extendRequestPrototype, it } from './test_deps.ts';

//const emailRegExp = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
const emailRegExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

describe('Testing params values generator', () => {
    
    beforeAll(() => {
        Deno.env.set('NODE_ENV', 'test');
    });

    function createRequest() : Request {
        const params = new URLSearchParams({
            bar: 'baz',
            foo: 'fo0'
        });
        const request = new Request(`http://localhost:3003/api/test?${params}`, {
            method: 'POST',
            body: JSON.stringify({
              email: 'r@r.es',
              password: 'secred',
              firstname: 'John',
              lastname: 'Doe'
            }),
            headers: {
                'content-type': 'application/json',
                'X-CUSTOM-HEADER': 'Hola!'
            }
          });
        extendRequestPrototype();
        return request; 
    }

    it('checks ParamValues for unknown', async () => {
        assertEquals(await ParamValues.get('nothing_to_do'), undefined);
        assertEquals(await ParamValues.get('request.whatever'), undefined);
        assertEquals(await ParamValues.get('random.whatever'), undefined);
    });

    it('checks ParamValues for request.path', async () => {
        const req = createRequest();
        const value = await ParamValues.get('request.path', req);

        assertEquals(value, pathname(req.url));
        assertEquals(value, '/api/test');
    });

    it('checks ParamValues for request.params', async () => {
        const req = createRequest();
        const value = await ParamValues.get('request.params', req);

        assertEquals(value, req.query());
        assertEquals((value as AnyObj).bar, 'baz');
        assertEquals((value as AnyObj).bar, req.query('bar'));

    });

    it('checks ParamValues for request.params.bar', async () => {
        const req = createRequest();
        const value = await ParamValues.get('request.params.bar', req);

        assertEquals(value, 'baz');
        assertEquals(value, req.query('bar'));        

    });


    it('checks ParamValues for request.payload', async () => {
        const req = createRequest();
        const value = await ParamValues.get('request.payload', req);
        assertExists(value);
        assertArrayIncludes<string>(Object.keys(value), ['email', 'firstname', 'lastname', 'password']);
        
    });

    it('checks ParamValues for request.payload.email', async () => {
        const req = createRequest();
        const value = await ParamValues.get('request.payload.email', req);

        assertStrictEquals(typeof value, 'string');
        const body = await req.parsedBody as AnyObj;
         
        assertEquals(value, body.email);
        assertEquals(value, 'r@r.es');

        const value2 = await ParamValues.get('request.payload.email_missing', req);
        assertEquals(value2, undefined);
        
        const req2 = new Request('http://localhost:3003/api/');
        console.log(await req2.parseBody());
        const value3 = await ParamValues.get('request.payload.whatever', req2);

        assertEquals(value3, undefined);
        
    });

    it('checks ParamValues for request.headers', async () => {
        const req = createRequest();
        const value = await ParamValues.get('request.headers', req) as AnyObj;

        assertExists(value);
        assertEquals(value, req.header());
    });

    it('checks ParamValues for request.headers.custom', async () => {
        const req = createRequest();
        const value = await ParamValues.get('request.headers.X-CUSTOM-HEADER', req);

        assertExists(value);
        assertEquals(value, req.headers.get('X-CUSTOM-HEADER'));
        assertEquals(value, 'Hola!');
    });


//     // RANDOM VALUES

    it('checks ParamValues for random.integer', async () => {
        const value = await ParamValues.get('random.integer') as number;

        assertEquals(typeof value, 'number');
        assert(value > -1, 'value is greater than -1');
        assertEquals(value % 1, 0, 'value is an integer');
    });

    it('checks ParamValues for random.integer.10', async () => {
        const value = await ParamValues.get('random.integer.10') as number;

        assertEquals(typeof value, 'number');
        assert(value >= 0 && value <= 10, 'value is between 0 and 10');
    });

    it('checks ParamValues for random.float', async () => {
        const value = await ParamValues.get('random.float') as number;

        assertEquals(typeof value, 'number');
        assert(value >= 0 && value <= 100, 'value is between 0 and 100');
        assertNotEquals(value % 1, 0, 'value is not integer'); // this is actually not probable
    });

    it('checks ParamValues for random.float.1', async () => {
        const value = await ParamValues.get('random.float.1') as number;

        assertEquals(typeof value, 'number');
        assert(value >= 0 && value <= 1, 'value is between 0 and 1');

    });

    it('checks ParamValues for random.boolean', async () => {
        const value = await ParamValues.get('random.boolean') as boolean;

        assertEquals(typeof value, 'boolean');
    });

    it('checks ParamValues for random.choose.foo.bar.hi', async () => {
        const value = await ParamValues.get('random.choose.foo.bar.hi') as string;

        assertEquals(typeof value, 'string');
        assertArrayIncludes('foo.bar.hi'.split('.'), [value]);
    });

    it('checks ParamValues for random.choose null', async () => {
        const value = await ParamValues.get('random.choose') as string;

        assert(value == null, 'value is null');
    });

    it('checks ParamValues for random.email', async () => {
        const value = await ParamValues.get('random.email') as string;
        assertMatch(value, emailRegExp);
    });

    it('checks ParamValues for random.email.dvlpr.tech', async () => {
        const value = await ParamValues.get('random.email.dvlpr.tech') as string;

        assertMatch(value, emailRegExp);
        assertMatch(value, /@dvlpr.tech$/);
    });

    it('checks ParamValues for random.personFullName', async () => {
        const value = await ParamValues.get('random.personFullName') as string;

        assertEquals(typeof value, 'string');
        assert(value.split(' ').length > 1, 'value has at least two words');

        const valueFemale = await ParamValues.get('random.personFullName.female') as string;

        assertEquals(typeof valueFemale, 'string');
        assert(valueFemale.split(' ').length > 1, 'value has at least two words');
        
    });

    it('checks ParamValues for random.personFirstName', async () => {
        const value = await ParamValues.get('random.personFirstName') as string;

        assertEquals(typeof value, 'string');
        assert(value.split(' ').length === 1, 'value has only one word');

        const valueMale = await ParamValues.get('random.personFirstName.male') as string;

        assertEquals(typeof valueMale, 'string');
        
        assert(valueMale.split(' ').length === 1, 'value has only one word');
    });

    it('checks ParamValues for random params', async () => {
        let value = await ParamValues.get('random.url') as string;
        assert(value.startsWith('http'));

        value = await ParamValues.get('random.city') as string;
        assertEquals(typeof value, 'string');
        assert(value.length > 1, 'string value is not empty');
        value = await ParamValues.get('random.personLastName') as string;
        assertEquals(typeof value, 'string');
        assert(value.length > 1, 'string value is not empty');        
        value = await ParamValues.get('random.phone') as string;
        assertEquals(typeof value, 'string');
        
        assert(value.length > 1, 'string value is not empty');
        value = await ParamValues.get('random.country') as string;
        assertEquals(typeof value, 'string');
        assert(value.length > 1, 'string value is not empty');
        value = await ParamValues.get('random.sport') as string;
        assertEquals(typeof value, 'string');
        assert(value.length > 1, 'string value is not empty');
        value = await ParamValues.get('random.brand') as string;
        assertEquals(typeof value, 'string');
        assert(value.length > 1, 'string value is not empty');
        value = await ParamValues.get('random.company') as string;
        assertEquals(typeof value, 'string');
        assert(value.length > 1, 'string value is not empty');
        value = await ParamValues.get('random.username') as string;
        assertEquals(typeof value, 'string');
        assert(value.length > 1, 'string value is not empty');
        value = await ParamValues.get('random.department') as string;
        assertEquals(typeof value, 'string');
        assert(value.length > 1, 'string value is not empty');
        value = await ParamValues.get('random.jobTitle') as string;
        assertEquals(typeof value, 'string');
        assert(value.length > 1, 'string value is not empty');
        value = await ParamValues.get('random.phrase') as string;
        assertEquals(typeof value, 'string');
        assert(value.length > 1, 'string value is not empty');
        value = await ParamValues.get('random.countryCode') as string;
        assertEquals(typeof value, 'string');
        assertMatch(value, /^[\w]+$/, 'value is a country code');
        value = await ParamValues.get('random.hexColor') as string;
        assertEquals(typeof value, 'string');
        assertMatch(value, /^#[0-aa-f]+$/, 'value is html color');
        value = await ParamValues.get('random.zipCode') as string;
        assertEquals(typeof value, 'string');
        assertMatch(value, /^[\d-]+$/, 'value is a zip code');
        value = await ParamValues.get('random.filePath') as string;
        assertEquals(typeof value, 'string');
        assertMatch(value, /^[\d-_\+.\/\\\w]+$/, 'value is a valid file path');
        
        value = await ParamValues.get('random.emoji') as string;
        assertEquals(typeof value, 'string');
        assertMatch(value, /\p{Emoji}/u, 'value is an emoji');
        
        value = await ParamValues.get('random.ip') as string;
        assertEquals(typeof value, 'string');
        assertMatch(value, /^[\d]+\.[\d]+\.[\d]+\.[\d]+$/, 'value is an IP');
        value = await ParamValues.get('random.uuid') as string;
        assertEquals(typeof value, 'string');
        assertMatch(value, /^[\w\d-]+$/, 'value is an UUID');
       
        value = await ParamValues.get('random.pastDate') as string;
        assertEquals(typeof value, 'string');
        assertMatch(value, /^[\d-]+$/, 'value is an ISO Date');
        assert(new Date(value).getTime() < Date.now(), 'date is past');

        value = await ParamValues.get('random.futureDate') as string;
        assertEquals(typeof value, 'string');
        assertMatch(value, /^[\d-]+$/, 'value is an ISO Date');
        assert(new Date(value).getTime() > (Date.now() - 24*60*60*1000), 'date is past');
        
        value = await ParamValues.get('random.datetime') as string;
        assertEquals(typeof value, 'string');
        assertMatch(value, /^[\d-T:\.Z]+$/, 'value is an ISO Datetime');        
        assertFalse(isNaN(new Date(value).getTime()));

    });

    /*      username: () => randUserName(),
      ip: () => randIp(),
      uuid: () => randUuid(),
      : () => randJobArea(),
      : () => randJobTitle(),
      : () => randPastDate({ years: 5 }).toISOString().substring(0, 10),
      futureDate: () => randFutureDate({ years: 5 }).toISOString().substring(0, 10),
      datetime: () => randPastDate({ years: 5 }).toISOString(),
      : () => randPhrase(),
 */


    it('checks ParamValues for server.isoDatetime', async () => {
        const value = await ParamValues.get('server.isoDatetime') as string;

        assertEquals(typeof value, 'string');
        assert(Math.abs(new Date(value).getTime() - Date.now()) < 50, 'generated date is now');
    });

    it('checks ParamValues for server.timestamp', async () => {
        const value = await ParamValues.get('server.timestamp') as number;

        assertEquals(typeof value, 'number');
        assert(Math.abs(value - Date.now()) < 50, 'generated date is now');        
    });

    it('checks ParamValues for server.isoDate', async () => {
        const value = await ParamValues.get('server.isoDate') as string;

        assertEquals(typeof value, 'string');
        assert(new Date().toISOString().startsWith(value));
    });





});