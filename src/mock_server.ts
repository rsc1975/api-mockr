import { DELAY_PARAM, FORCE_ERROR_HEADER, FORCE_ERROR_MSG_HEADER, FORCE_ERROR_PARAM, PING_MSG, PRETTY_PARAM, RESPONSE_TIME_HEADER } from './common/http.ts';
import { isEmpty, pathname } from './common/utils.ts';
import { extendRequest } from './custom_request.ts';
import { serve } from './deps/deno.ts';
import { Context, cors, Hono, Next, StatusCode } from './deps/hono.ts';
import { ResponseGenerator } from './response_generator.ts';
import { MockerConfig } from './routes_config.ts';

interface MockServerInputParams {
    version?: string;
    port?: number;
    host?: string;
    verbose?: boolean;
    silent?: boolean;
    responseConfig?: MockerConfig;   
    apiPrefix?: string;
}

extendRequest();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    private usemicros = false;


    constructor({host, port, apiPrefix, verbose, silent, responseConfig, version} : MockServerInputParams = {}) {
        this.apiPrefix = apiPrefix || Deno.env.get('MOCKR_PREFIX') || '';
        if (!this.apiPrefix.startsWith("/") && !!this.apiPrefix) {
            this.apiPrefix = "/" + this.apiPrefix;
          }
        this.version = version || 'unknown';
        this.host = host || Deno.env.get('assertEquals(localMockServer.apiPrefix, "/test");BINDING') || '0.0.0.0';
        this.port = port || +(Deno.env.get('MOCKR_PORT') || 3003);
        this.silent = !!silent;
        this.verbose = !this.silent && !!verbose;
        this.responseConfig = responseConfig || {};
        this.server = this.create();
        this.printConfig(this.responseConfig);
    }

    private json(c: Context, obj: unknown, httpStatus = 200) : Response {
        const rawJson = JSON.stringify(obj);
        c.res.headers.set('content-type', 'application/json; charset=UTF-8');
        return c.body(new TextEncoder().encode(rawJson), httpStatus as StatusCode);
    }

    private txt(c: Context, text: string, httpStatus = 200) : Response {        
        c.res.headers.set('content-type', 'text/plain; charset=UTF-8');
        return c.body(new TextEncoder().encode(text), httpStatus as StatusCode);
    }

    async checkHRTime() {
        this.usemicros = (await Deno.permissions.query({ name: "hrtime"})).state === "granted";
    }


    private create() : Hono {
        
        this.server = this._createHonoServer();
        return this.server;
    }


    async start() : Promise<void> {       
        await this.checkHRTime();
        const listeningTxt = () => this.log(`[🟢 api-mockr v${this.version}] Server running at: http://${this.host}:${this.port}${this.apiPrefix}`);
        this.abortController = new AbortController();
        this.abortController.signal.addEventListener('abort', () => {
            this.log("❌ ➡️ Server stopped!");
            this.log(`⏱️ ➡️ Server was running for: ${(performance.now()/1000).toFixed(1)}s`);
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
        this.log('verbose', "[INFO] API Mockr is using the following configuration:");
        this.log('verbose', JSON.stringify(config, null, 2)+"\n");        
    }

    private _createHonoServer() {
        const srv = new Hono();
    
        srv.use('*', async (c: Context, next: Next) => {
            const start = performance.now();
            //await c.req.parseBody();
            await next();
            const elapsed = performance.now() - start;
            const elapsedTxt = this.usemicros ? `${(elapsed*1000).toFixed(0)} us` : `${elapsed.toFixed(2)} ms`;
            c.res.headers.set(RESPONSE_TIME_HEADER, elapsedTxt);
        });

        srv.use('*', cors())

        srv.use('*', async (c: Context, next: Next) => {
            const pretty = !!(c.req.query(PRETTY_PARAM) || c.req.query(PRETTY_PARAM) === '');
            c.pretty(pretty, 2);
            await next();     
        });


        const logRequest = async (req: Request) => {
            
            let logReq = `[DEBUG] [➡️] ${req.method.toUpperCase()} ${pathname(req.url)}`;
            if (!isEmpty(req.query())) {
                logReq += ` [params: ${JSON.stringify(req.query())}]`;
            }
            const body = await req.parseBody();
            if (!isEmpty(body)) {    
               logReq += ` [payload: ${JSON.stringify(body)}]`;
            }            
            
            this.log('verbose', logReq);
        }

        srv.use('*', async (c: Context, next: Next) => {
            if (this.verbose) {
                logRequest(c.req);
            }
            await next();
            const { req, res} = c;
            this.log(`[INFO] [➡️] ${req.method.toUpperCase()} ${pathname(req.url)} [↩️ ${res.status >= 400 ? '⭕' : '✅'}] (status: ${res.status}, content-type: ${res.headers.get('content-type')})`);
        });

        srv.use('*', async (c: Context, next: Next) => {
            
            const delay = +c.req.query(DELAY_PARAM);
            if (delay) {
                await sleep(delay);
            }
            await next();
        });

        

        srv.use('*', async (c: Context, next: Next) => {
            const { req } = c;
            const forceError = !!req.query(FORCE_ERROR_PARAM);
            const errorCode = +req.header(FORCE_ERROR_HEADER);
            if (!!errorCode || forceError) {                
                const errorMsg = req.header(FORCE_ERROR_MSG_HEADER);
                const responseGenerator = new ResponseGenerator(this.responseConfig, this.apiPrefix);
                const errorResponse = await responseGenerator.generateError(req, errorMsg, errorCode);
                
                return this.json(c, errorResponse.payload, errorResponse.httpStatus);
            }
            
            await next();
            
        });

        srv.notFound((c: Context) => {
            return this.txt(c, `Missing route, try: ${this.apiPrefix}/<anything>`, 404);
        });

        srv.use(`${this.apiPrefix}/*`, async (c: Context, next: Next) => {
            if (pathname(c.req.url) !== '/') {
                const responseGenerator = new ResponseGenerator(this.responseConfig, this.apiPrefix);
                return this.json(c, await responseGenerator.generate(c.req));
            } else {
                await next();
            }
        });

        srv.get('/', (c) => this.txt(c, `${PING_MSG} (v${this.version})`));

        return srv;
    
    }

    log(...args: string[]) {
        let tag;
        let msgs;
        if (['info', 'verbose'].includes(args[0])) {
            tag = args[0];
            msgs = args.slice(1);
        } else {
            tag = 'info';
            msgs = args;
        }
        
        if (!this.silent) {
            if (tag === 'info') {
                console.info(...msgs);
            }
            if (this.verbose && tag === 'verbose') {
                console.info(...msgs);
            }
        }
    }
    
}
