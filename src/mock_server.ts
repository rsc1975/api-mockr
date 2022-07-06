import { Request, ResponseToolkit, server as hapiServer, Server } from '@hapi/hapi';

interface MockServerInputParams {
    port?: number;
    host?: string;
    debug?: boolean;
    logRequestData?: boolean;
    config?: string[];
    apiPrefix?: string;
}


export class MockServer {
    public server: Server;
    public host: string;
    public port: number;
    public apiPrefix: string;
    public logRequestData?: boolean;

    constructor({host, port, apiPrefix, logRequestData, } : MockServerInputParams = {}) {
        this.apiPrefix = apiPrefix || process.env.MOCKER_PREFIX || '/api';
        this.host = host || process.env.MOCKER_BINDING || '0.0.0.0';
        this.port = port || +(process.env.MOCKER_PORT || 3003);
        this.logRequestData = !!logRequestData;
        this.server = this.create();
    }

    private create() : Server {
        const srv =  hapiServer({
            port: this.port,
            host: this.host,
            routes: {
                cors: true,
               // validate: {
               //     failAction: async (request: Request, h: ResponseToolkit, err: any) => {
               //         console.log(err);
               //         return h.response({error: err}).code(500);
               //     }
               // }
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
            handler: (request, h) => {
                return {'ok': 'Everything OK', more: 234, other: 'OK'};
            }
        });

        const logReqest = (req: Request) => {
            let logReq = `${req.method} ${req.url.pathname}`;
            if (req.url.searchParams.keys.length > 0) {
                logReq += ` [Params: ${req.url.searchParams}]`;
            }
            if (req.headers['content-type'] === 'application/json') {
                logReq += ` [Body: ${JSON.stringify(req.payload)}]`;
            }
            console.info(logReq);
        }

        srv.ext('onRequest', (req : Request, h : ResponseToolkit) => {
            if (this.logRequestData) {
                logReqest(req);
            }
            const { headers } : any = req;
            const errorCode = +headers['x-mocker-force-error'];
            if (!!errorCode) {                
                const errorMsg = headers['x-mocker-error-msg'] || `FORCED ERROR: ${errorCode}`;

                return h.response(errorMsg).code(errorCode < 600 ? errorCode : 500).takeover();
            }
            return h.continue;
          });

        srv.ext('onPreResponse', (req : Request, h : ResponseToolkit) => {
            const { response } : any = req;
            if (response.output?.statusCode === 404) {
                return h.response(`Missing route, try: ${this.apiPrefix}/<anything>`).code(404);
            }
            return h.continue;
          });
          
        return srv;
    }

    async start() : Promise<void> {       
        await this.server.initialize();
        this.server.log('info', `Server running at: ${this.server.info.uri}`);
        return this.server.start();
    }

    async stop() {
        await this.server.stop();
    }

    async dispose() {
        await this.stop();
    }
}



