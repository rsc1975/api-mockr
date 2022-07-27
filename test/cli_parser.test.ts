'use strict';

import { getParams } from '../src/cli_parser';

import Code from '@hapi/code';
import Lab from '@hapi/lab';
import Sinon from 'sinon';
import fs from 'fs';

const { expect } = Code;
const { it, describe, before, afterEach } = exports.lab = Lab.script();

describe('Testing CLI parser', () => {

    before(() => {
        process.env.NODE_ENV = 'test';
    });

    afterEach(() => {
        Sinon.restore();
    });
    
    it('checks default params', () => {
        const params = getParams();
        expect(params).to.be.an.object();
        expect(params.logRequestData).to.be.false;
        expect(params.debug).to.be.false;
        expect(params.config).to.be.undefined;
        expect(params.port).to.be.equal(3003);
        expect(params.host).to.be.equal('0.0.0.0');
    });

    it('checks config param', () => {

        const cliParams = process.argv.concat(['--config', 'fichero1.yml', '--config', 'fichero2.yml']);
        Sinon.stub(process, 'argv').get(() => cliParams);
        
        Sinon.stub(fs, 'existsSync').withArgs('fichero1.yml').returns(true)
                    .withArgs('fichero2.yml').returns(true);
        Sinon.stub(fs, 'readFileSync').returns("defaultResponse:\n    success: true\n");

        const params = getParams();
        expect(params).to.be.an.object();
        expect(params.logRequestData).to.be.false;
        expect(params.debug).to.be.false;
        expect(params.config).to.be.array;
        expect(params.config).to.be.length(2);        
        expect(params.port).to.be.equal(3003);
        expect(params.host).to.be.equal('0.0.0.0');
        
    });

    it('checks missing config file', () => {
        const cliParams = process.argv.concat(['-c', 'fichero1.yml']);
        Sinon.stub(process, 'argv').get(() => cliParams);
        
        const exitStub = Sinon.stub(process, 'exit').withArgs(-1).throws({error: 'Exit'});
        Sinon.stub(fs, 'existsSync').withArgs('fichero1.yml').returns(false);
        
        try {
            getParams();
        } catch(e:any) {
            expect(e).to.be.an.object();
            expect(e.error).to.be.equal('Exit');
        }
        expect(exitStub.calledOnce).to.be.true();
        expect(exitStub.calledWith(-1)).to.be.true();
        
    });

});