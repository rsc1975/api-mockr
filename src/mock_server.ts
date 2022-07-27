import { Request, ResponseToolkit, server as hapiServer, Server } from '@hapi/hapi';
import { ResponseGenerator } from './response_generator';
import { MockerConfig } from './routes_config';

interface MockServerInputParams {
    port?: number;
    host?: string;
    debug?: boolean;
    logRequestData?: boolean;
    responseConfig?: MockerConfig;   
    apiPrefix?: string;
}

const PRETTY_PARAM = '_pretty';
const FORCE_ERROR_PARAM = '_forceError';
const FORCE_ERROR_HEADER = 'x-mocker-force-error';
const FORCE_ERROR_MSG_HEADER = 'x-mocker-error-msg';

export class MockServer {
    public server: Server;
    public host: string;
    public port: number;
    public apiPrefix: string;
    public logRequestData?: boolean;
    public responseConfig: MockerConfig;

    constructor({host, port, apiPrefix, logRequestData, responseConfig} : MockServerInputParams = {}) {
        this.apiPrefix = apiPrefix || process.env.MOCKER_PREFIX || '';
        if (!this.apiPrefix.startsWith("/") && !!this.apiPrefix) {
            this.apiPrefix = "/" + this.apiPrefix;
          }
        this.host = host || process.env.MOCKER_BINDING || '0.0.0.0';
        this.port = port || +(process.env.MOCKER_PORT || 3003);
        this.logRequestData = !!logRequestData;
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
            handler: (_, __) => 'API Mocker'
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
            
            let logReq = `${req.method.toUpperCase()} ${req.url.pathname}`;
            if (!!req.url.search) {
                logReq += ` [Params: ${req.url.search.substring(1).replace('&', ' ')}]`;
            }
            if (req.headers['content-type'] === 'application/json') {
                
                logReq += ` [Body: ${JSON.stringify(req.payload)}]`;
            }
            console.info(logReq);
            this.server.log('info', logReq);
        }

        srv.ext('onPreHandler', (req : Request, h : ResponseToolkit) => {
            if (this.logRequestData) {
                logRequest(req);
            }
            return h.continue;
        });

        srv.ext('onRequest', (req : Request, h : ResponseToolkit) => {
            const { headers } : any = req;
            const errorCode = +headers[FORCE_ERROR_HEADER] || +req.query[FORCE_ERROR_PARAM];
            if (!!errorCode) {                
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
    
        return srv;
    }

    async start() : Promise<void> {       
        await this.server.initialize();        
        console.log(`Server running at: ${this.server.info.uri}${this.apiPrefix}`);
        return this.server.start();
    }

    async stop() {
        await this.server.stop();
    }

    async dispose() {
        await this.stop();
    }
}



