import { Request, ResponseToolkit, server as hapiServer, Server } from '@hapi/hapi';

export class MockServer {
    public server: Server;
    public host: string;
    public port: number;
    public apiPrefix: string;

    constructor(host?: string, port?: number, apiPrefix? : string) {
        this.apiPrefix = apiPrefix || process.env.MOCKER_PREFIX || '/api';
        this.host = host || process.env.MOCKER_BINDING || '0.0.0.0';
        this.port = port || +(process.env.MOCKER_PORT || 3003);
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

        srv.ext('onRequest', (req : Request, h : ResponseToolkit) => {
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



