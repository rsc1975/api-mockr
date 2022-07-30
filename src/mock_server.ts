import { LogEvent, Request, ResponseToolkit, server as hapiServer, Server } from '@hapi/hapi';
import { ResponseGenerator } from './response_generator';
import { MockerConfig } from './routes_config';

interface MockServerInputParams {
    port?: number;
    host?: string;
    verbose?: boolean;
    silent?: boolean;
    responseConfig?: MockerConfig;   
    apiPrefix?: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const PING_MSG = 'API Mockr\n';
const PRETTY_PARAM = '_pretty';
const DELAY_PARAM = '_delay';
const FORCE_ERROR_PARAM = '_forceError';
const FORCE_ERROR_HEADER = 'x-mocker-force-error';
const FORCE_ERROR_MSG_HEADER = 'x-mocker-error-msg';

export class MockServer {
    public server: Server;
    public host: string;
    public port: number;
    public apiPrefix: string;
    public verbose: boolean;
    public silent: boolean;
    public responseConfig: MockerConfig;

    constructor({host, port, apiPrefix, verbose, silent, responseConfig} : MockServerInputParams = {}) {
        this.apiPrefix = apiPrefix || process.env.MOCKER_PREFIX || '';
        if (!this.apiPrefix.startsWith("/") && !!this.apiPrefix) {
            this.apiPrefix = "/" + this.apiPrefix;
          }
        this.host = host || process.env.MOCKER_BINDING || '0.0.0.0';
        this.port = port || +(process.env.MOCKER_PORT || 3003);
        this.silent = !!silent;
        this.verbose = !this.silent && !!verbose;
        this.responseConfig = responseConfig || {};
        this.server = this.create();
    }

    private create() : Server {
        const srv =  hapiServer({
            port: this.port,
            host: this.host,
            routes: {
                cors: true,
                payload: {
                    output: 'data',
                    parse: true,                    
                }
            }
        });
        srv.route({
            method: 'GET',
            path: '/',
            handler: (_, __) => PING_MSG
        });
    
        // Create hapi server catchall route
        srv.route({
            method: '*',
            path: `${this.apiPrefix}/{p*}`,
            handler: (req: Request, h : ResponseToolkit) => {
                const responseGenerator = new ResponseGenerator(this.responseConfig, this.apiPrefix);
                return responseGenerator.generate(req);
            }
        });

        const logRequest = (req: Request) => {
            
            let logReq = `[DEBUG] [📃 ➡️] ${req.method.toUpperCase()} ${req.url.pathname}`;
            if (!!req.url.search) {
                logReq += ` [params: ${req.url.search.substring(1).replace('&', ' ')}]`;
            }
            if (!!req.payload) {
                const body = req.headers['content-type'] === 'application/json' ? JSON.stringify(req.payload) : req.payload.toString();
                
                logReq += ` [payload: ${body}]`;
            }
            
            this.server.log('verbose', logReq);
        }

        srv.ext('onPreHandler', (req : Request, h : ResponseToolkit) => {
            if (this.verbose) {
                logRequest(req);
            }
            return h.continue;
        });

        srv.ext('onRequest', async (req : Request, h : ResponseToolkit) => {
            const { headers } : any = req;
            const delay = +req.query[DELAY_PARAM];
            if (delay) {
                await sleep(delay);
            }
            const forceError = !!req.query[FORCE_ERROR_PARAM];
            const errorCode = +headers[FORCE_ERROR_HEADER];
            if (!!errorCode || forceError) {                
                const errorMsg = headers[FORCE_ERROR_MSG_HEADER];
                const responseGenerator = new ResponseGenerator(this.responseConfig, this.apiPrefix);
                const errorResponse = responseGenerator.generateError(req, errorMsg, errorCode);
                return h.response(errorResponse.payload).code(errorResponse.httpStatus).takeover();
            }
            return h.continue;
        });

        srv.ext('onPreResponse', (req : Request, h : ResponseToolkit) => {
            const { response } : any = req;
            if (response.output?.statusCode === 404) {
                return h.response(`Missing route, try: ${this.apiPrefix}/<anything>`).code(404);
            }
            if (req.query[PRETTY_PARAM]) {
                response.spaces(2).takeover();
            }
            return h.continue;
        });
        srv.ext('onPostResponse', (req : Request, h : ResponseToolkit) => {
            const { response } : any = req;
            this.server.log('info', `[INFO] [⬅️ ${response.statusCode >= 400 ? '⭕' : '✅'}] ${req.method.toUpperCase()} ${req.url.pathname} => (status: ${response.statusCode}, length: ${response.headers['content-length'] }, content-type: ${response.contentType})`);
            return h.continue;
        });        

        srv.events.on('log', (event: LogEvent, tags: { [key: string]: true }) => {
            if (!this.silent) {
                if (tags.info) {
                    console.info(event.data);
                }
                if (this.verbose && tags.verbose) {
                    console.info(event.data);
                }
            }
        });
    
        
        return srv;
    }


    async start() : Promise<void> {       
        await this.server.initialize();        
        this.server.log('info', `[🟢 api-mockr] Server running at: ${this.server.info.uri}${this.apiPrefix}`);
        return this.server.start();
    }

    async stop() {
        await this.server.stop();
        this.server.log('info', `[🟥 api-mockr] Server stopped`);
    }

    async dispose() {
        await this.stop();
    }
}



