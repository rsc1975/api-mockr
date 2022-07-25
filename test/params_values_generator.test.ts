
import { defaultResponseConfig, getConfig, MockerConfig } from '../src/routes_config';

import Code from '@hapi/code';
import Lab from '@hapi/lab';
import { Request, ServerInjectOptions } from '@hapi/hapi';
import { MockServer } from '../src/mock_server';
import { ParamValues } from "../src/param_values_generator";

const { expect } = Code;
const { it, describe, before } = exports.lab = Lab.script();

//const emailRegExp = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
const emailRegExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

describe('Testing params values generator', () => {

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

    it('checks ParamValues for unknown', async () => {
        
        expect(ParamValues.get('nothing_to_do')).to.be.null();
        expect(ParamValues.get('request.whatever')).to.be.null();
        expect(ParamValues.get('random.whatever')).to.be.null();
    });

    it('checks ParamValues for request.path', async () => {
        const req = await createRequest();
        const value = ParamValues.get('request.path', req);

        expect(value).to.equal(req.url.pathname).to.equal('/api/test');
    });

    it('checks ParamValues for request.params', async () => {
        const req = await createRequest();
        const value = ParamValues.get('request.params', req);

        expect(value).to.be.equal(req.query);
        expect((value as Record<string, unknown>)!.bar).to.be.equal(req.query.bar).to.be.equal('baz');
    });

    it('checks ParamValues for request.params.bar', async () => {
        const req = await createRequest();
        const value = ParamValues.get('request.params.bar', req);

        expect(value).to.be.equal(req.query.bar).to.be.equal('baz');
    });


    it('checks ParamValues for request.body', async () => {
        const req = await createRequest();
        const value = ParamValues.get('request.body', req) as object;
        
        expect(value).to.be.object();
        expect(value).to.be.equal(req.payload as object);
        expect(Object.keys(value)).to.contains('email').to.contains('firstname');
    });

    it('checks ParamValues for request.body.email', async () => {
        const req = await createRequest();
        const value = ParamValues.get('request.body.email', req);

        expect(value).to.be.string();
        expect(value).to.be.equal((req.payload as any).email).to.be.equal('r@r.es');
    });

    it('checks ParamValues for request.headers', async () => {
        const req = await createRequest();
        const value = ParamValues.get('request.headers', req) as object;

        expect(value).to.be.object();
        expect(value).to.be.equal(req.headers as object);        
    });

    it('checks ParamValues for request.headers.custom', async () => {
        const req = await createRequest();
        const value = ParamValues.get('request.headers.X-CUSTOM-HEADER', req);

        expect(value).to.be.string();
        expect(value).to.be.equal(req.headers['X-CUSTOM-HEADER'.toLowerCase()]).to.be.equal('Hola!');
    });


    // RANDOM VALUES

    it('checks ParamValues for random.integer', async () => {
        const value = ParamValues.get('random.integer') as number;

        expect(value).to.be.number();
        expect(value).to.be.greaterThan(-1);
        expect(value % 1).to.be.equal(0);
    });

    it('checks ParamValues for random.integer.10', async () => {
        const value = ParamValues.get('random.integer.10') as number;

        expect(value).to.be.number();
        expect(value).to.be.greaterThan(-1).to.be.lessThan(11);
    });

    it('checks ParamValues for random.float', async () => {
        const value = ParamValues.get('random.float') as number;

        expect(value).to.be.number();
        expect(value).to.be.greaterThan(0).to.be.lessThan(100);
        expect(value % 1).not.to.be.equal(0); // this is actually not probable
    });

    it('checks ParamValues for random.float.1', async () => {
        const value = ParamValues.get('random.float.1') as number;

        expect(value).to.be.number();
        expect(value).to.be.greaterThan(0).to.be.lessThan(1);
    });

    it('checks ParamValues for random.boolean', async () => {
        const value = ParamValues.get('random.boolean') as boolean;

        expect(value).to.be.boolean();
    });


    it('checks ParamValues for random.choose.foo.bar.hi', async () => {
        const value = ParamValues.get('random.choose.foo.bar.hi') as string;

        expect(value).to.be.string();
        expect('foo.bar.hi'.split('.')).to.contains(value);
    });

    it('checks ParamValues for random.choose null', async () => {
        const value = ParamValues.get('random.choose') as string;

        expect(value).to.be.null();
    });

    it('checks ParamValues for random.email', async () => {
        const value = ParamValues.get('random.email') as string;
        expect(value).to.match(emailRegExp);
    });

    it('checks ParamValues for random.email.dvlpr.tech', async () => {
        const value = ParamValues.get('random.email.dvlpr.tech') as string;

        expect(value).to.match(emailRegExp);
        expect(value).to.endsWith('@dvlpr.tech');
    });


    it('checks ParamValues for random.personFullName', async () => {
        const value = ParamValues.get('random.personFullName') as string;

        expect(value).to.be.string();
        expect(value.split(' ').length).to.be.greaterThan(1);

        const valueFemale = ParamValues.get('random.personFullName.female') as string;

        expect(valueFemale).to.be.string();
        expect(valueFemale.split(' ').length).to.be.greaterThan(1);
        
    });

    it('checks ParamValues for random.personFirstName', async () => {
        const value = ParamValues.get('random.personFirstName') as string;

        expect(value).to.be.string();
        expect(value.split(' ').length).to.be.equals(1);

        const valueMale = ParamValues.get('random.personFirstName.male') as string;

        expect(valueMale).to.be.string();
        expect(valueMale.split(' ').length).to.be.equals(1);        
    });
    it('checks ParamValues for random params', async () => {
        let value = ParamValues.get('random.url') as string;
        expect(value).to.startsWith('http');

        value = ParamValues.get('random.city') as string;
        expect(value).to.be.string().not.to.be.empty();
        value = ParamValues.get('random.phone') as string;
        expect(value).to.be.string().not.to.be.empty();
        value = ParamValues.get('random.country') as string;
        expect(value).to.be.string().not.to.be.empty();
        value = ParamValues.get('random.sport') as string;
        expect(value).to.be.string().not.to.be.empty();
        value = ParamValues.get('random.brand') as string;
        expect(value).to.be.string().not.to.be.empty();
        value = ParamValues.get('random.company') as string;
        expect(value).to.be.string().not.to.be.empty();
        value = ParamValues.get('random.username') as string;
        expect(value).to.be.string().not.to.be.empty();
        value = ParamValues.get('random.department') as string;
        expect(value).to.be.string().not.to.be.empty();
        value = ParamValues.get('random.jobTitle') as string;
        expect(value).to.be.string().not.to.be.empty();
        value = ParamValues.get('random.phrase') as string;
        expect(value).to.be.string().not.to.be.empty();
        value = ParamValues.get('random.countryCode') as string;
        expect(value).to.be.string().match(/^[\w]+$/);
        value = ParamValues.get('random.zipCode') as string;
        expect(value).to.be.string().match(/^[\d-]+$/)
        value = ParamValues.get('random.filePath') as string;
        expect(value).to.be.string().match(/^[\d-_\+.\/\\\w]+$/)
        value = ParamValues.get('random.emoji') as string;
        expect(value).to.be.string().match(/\p{Emoji}/u)
        value = ParamValues.get('random.ip') as string;
        expect(value).to.be.string().match(/^[\d]+\.[\d]+\.[\d]+\.[\d]+$/)
        value = ParamValues.get('random.uuid') as string;
        expect(value).to.be.string().match(/^[\w\d-]+$/)
       
        value = ParamValues.get('random.pastDate') as string;
        expect(value).to.be.string().match(/^[\d-]+$/);
        expect(new Date(value).getTime()).to.be.lessThan(new Date().getTime());

        value = ParamValues.get('random.futureDate') as string;
        expect(value).to.be.string().match(/^[\d-]+$/);
        expect(new Date(value).getTime()).to.be.greaterThan(new Date().getTime() - 24*60*60*1000);

        value = ParamValues.get('random.datetime') as string;
        expect(value).to.be.string().match(/^[\d-T:\.Z]+$/);
        expect(isNaN(new Date(value).getTime())).to.be.false();

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
        const value = ParamValues.get('server.isoDatetime') as string;

        expect(value).to.be.string();
        expect(new Date(value).getTime()).to.be.about(new Date().getTime(), 50);
    });




    it('checks ParamValues for server.timestamp', async () => {
        const value = ParamValues.get('server.timestamp') as number;

        expect(value).to.be.number();
        expect(value).to.be.about(new Date().getTime(), 50);
    });

    it('checks ParamValues for server.isoDate', async () => {
        const value = ParamValues.get('server.isoDate') as string;

        expect(value).to.be.string();
        expect(new Date().toISOString()).to.startsWith(value);
    });

    it('checks ParamValues for server.isoDatetime', async () => {
        const value = ParamValues.get('server.isoDatetime') as string;

        expect(value).to.be.string();
        expect(new Date(value).getTime()).to.be.about(new Date().getTime(), 50);
    });





});