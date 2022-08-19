import { parse } from "./deps/deno.ts";


//{ name: 'silent', alias: 's', type: Boolean, defaultValue: false },
//{ name: 'verbose', alias: 'v', type: Boolean, defaultValue: false },
//{ name: 'config', alias: 'c', multiple: true, type: String },
//{ name: 'apiPrefix', alias: 'a', type: String, defaultValue: '' },
//{ name: 'port', alias: 'p', type: Number, defaultValue: 3003 },
//{ name: 'host', alias: 'h', type: String, defaultValue: '0.0.0.0' }
//
const parseConfig = {
    alias: {
        s: 'silent',
        v: 'verbose',
        c: 'config',
        a: 'apiPrefix',
        p: 'port',
        h: 'host'
    },
    boolean: ['silent', 'verbose'],
    default: {
        silent: false,
        verbose: false,
        apiPrefix: '',
        port: 3003,
        host: '0.0.0.0'
    },    
    string: ['apiPrefix', 'host', 'config'],
    collect: ['config'],
}



console.log(parse(Deno.args, parseConfig)); 

