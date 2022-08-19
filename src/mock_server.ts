//import { LogEvent, Request, ResponseToolkit, server as hapiServer, Server } from '@hapi/hapi';
import { isEmpty, pathname } from './common/utils.ts';
import { env, serve } from './deps/deno.ts';
import { Context, cors, Hono, Next } from './deps/hono.ts';
import { ResponseGenerator } from './response_generator.ts';
import { MockerConfig } from './routes_config.ts';

const usemicros = (await Deno.permissions.query({ name: "hrtime"})).state === "granted";

interface MockServerInputParams {
    version?: string;
    port?: number;
    host?: string;
    verbose?: boolean;
    silent?: boolean;
    responseConfig?: MockerConfig;   
    apiPrefix?: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const PING_MSG = 'API Mockr';
const PRETTY_PARAM = '_pretty';
const DELAY_PARAM = '_delay';
const FORCE_ERROR_PARAM = '_forceError';
const FORCE_ERROR_HEADER = 'x-mocker-force-error';
const FORCE_ERROR_MSG_HEADER = 'x-mocker-error-msg';
const RESPONSE_TIME_HEADER = 'x-mocker-response-time';
export class MockServer {
    public server: Hono;
    public version: string;
    public host: string;
    public port: number;
    public apiPrefix: string;
    public verbose: boolean;
    public silent: boolean;
    public responseConfig: MockerConfig;
    private abortController = new AbortController();


    constructor({host, port, apiPrefix, verbose, silent, responseConfig, version} : MockServerInputParams = {}) {
        this.apiPrefix = apiPrefix || env.get('MOCKER_PREFIX') || '';
        if (!this.apiPrefix.startsWith("/") && !!this.apiPrefix) {
            this.apiPrefix = "/" + this.apiPrefix;
          }
        this.version = version || 'unknown';
        this.host = host || env.get('MOCKER_BINDING') || '0.0.0.0';
        this.port = port || +(env.get('MOCKER_PORT') || 3003);
        this.silent = !!silent;
        this.verbose = !this.silent && !!verbose;
        this.responseConfig = responseConfig || {};
        this.server = this.create();
        if (this.verbose) {
            this.printConfig(this.responseConfig);
        }
    }

    private create() : Hono {
        this.server = this._createHonoServer();
        return this.server;
    }


    start() : Promise<void> {       
        
        const listeningTxt = () => console.log(`[🟢 api-mockr v${this.version}] Server running at: http://${this.host}:${this.port}${this.apiPrefix}`);
        this.abortController = new AbortController();
        this.abortController.signal.addEventListener('abort', () => {
            console.log("❌ ➡️ Server stopped!");
            console.log(`⏱️ ➡️ Server was running for: ${(performance.now()/1000).toFixed(1)}s`);
        });

        return serve(this.server.fetch, { 
            port: this.port, 
            hostname: this.host, 
            signal: this.abortController.signal,            
            onListen: listeningTxt });
        
    }

    stop() {        
        this.abortController.abort();        
    }

    printConfig(config: MockerConfig) {
        console.info("[INFO] API Mockr is using the following configuration:");
        console.info(JSON.stringify(config, null, 2)+"\n");        
    }

    private _createHonoServer() {
        const srv = new Hono();
    
        srv.use('*', async (c: Context, next: Next) => {
            const start = performance.now();
            await next();
            const elapsed = performance.now() - start;
            const elapsedTxt = usemicros ? `${(elapsed*1000).toFixed(0)} us` : `${elapsed.toFixed(2)} ms`;
            c.res.headers.set(RESPONSE_TIME_HEADER, elapsedTxt);
          //          const { req, res} = c;
          //  console.info(`[INFO] [➡️] ${req.method.toUpperCase()} ${pathname(req.url)} [↩️ ${res.status >= 400 ? '⭕' : '✅'}] (status: ${res.status}, length: ${res.headers.get('content-length') }, content-type: ${res.headers.get('content-type')})`);
        });

        srv.use('*', cors())

        srv.use('*', async (c: Context, next: Next) => {
            const pretty = !!(c.req.query(PRETTY_PARAM) || c.req.query(PRETTY_PARAM) === '');
            c.pretty(pretty, 2);
            await next();     
        });


        const logRequest = async (req: Request) => {
            
            let logReq = `[DEBUG] [➡️] ${req.method.toUpperCase()} ${pathname(req.url)}`;
            if (isEmpty(req.query())) {
                logReq += ` [params: ${req.query()}]`;
            }
            if (req.body) {
                let body;
                
                if(req.headers.get('content-type') === 'application/json') {
                    body = await req.json();
                } else {
                    body = await req.parsedBody;
                } 
                
                logReq += ` [payload: ${JSON.stringify(body)}]`;
            }
            
            console.info(logReq);
        }

        srv.use('*', async (c: Context, next: Next) => {
            if (this.verbose) {
                logRequest(c.req);
            }
            await next();
            const { req, res} = c;
            console.info(`[INFO] [➡️] ${req.method.toUpperCase()} ${pathname(req.url)} [↩️ ${res.status >= 400 ? '⭕' : '✅'}] (status: ${res.status}, length: ${res.headers.get('content-length') }, content-type: ${res.headers.get('content-type')})`);
        });

        srv.use('*', async (c: Context, next: Next) => {
            
            const delay = +c.req.query(DELAY_PARAM);
            if (delay) {
                await sleep(delay);
            }
            await next();
        });

        

        srv.use('*', async (c: Context, next: Next) => {
            const { res, req } = c;
            const forceError = !!req.query(FORCE_ERROR_PARAM);
            const errorCode = +req.header(FORCE_ERROR_HEADER);
            if (!!errorCode || forceError) {                
                const errorMsg = req.header(FORCE_ERROR_MSG_HEADER);
                const responseGenerator = new ResponseGenerator(this.responseConfig, this.apiPrefix);
                const errorResponse = responseGenerator.generateError(req, errorMsg, errorCode);
                return c.json(errorResponse.payload, errorResponse.httpStatus);
            }
            
            await next();
            if (res.status === 404) {
                return c.text(`Missing route, try: ${this.apiPrefix}/<anything>`, 404);
            }
        });

        srv.use(`${this.apiPrefix}/*`, async (c: Context, next: Next) => {
            if (pathname(c.req.url) !== '/') {
                const responseGenerator = new ResponseGenerator(this.responseConfig, this.apiPrefix);
                return c.json(responseGenerator.generate(c.req));
            } else {
                await next();
            }
        });

        srv.get('/', (c) => c.text(`${PING_MSG} (v${this.version})`));


        // Create hapi server catchall route
        // srv.route({
        //     method: '*',
        //     path: `${this.apiPrefix}/{p*}`,
        //     handler: (req: Request, h : ResponseToolkit) => {
        //         const responseGenerator = new ResponseGenerator(this.responseConfig, this.apiPrefix);
        //         return responseGenerator.generate(req);
        //     }
        // });
    
        
        return srv;
    
    }

    log(...args: string[]) {
        const tag = args.length > 1 ? args[0] : 'info';
        const msg = args.length > 1 ? args.slice(1) : args[0];
        if (!this.silent) {
            if (tag === 'info') {
                console.info(...msg);
            }
            if (this.verbose && tag === 'verbose') {
                console.info(...msg);
            }
        }
    }
    
}
