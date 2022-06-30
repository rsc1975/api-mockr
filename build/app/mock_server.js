"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockServer = void 0;
const hapi_1 = require("@hapi/hapi");
class MockServer {
    constructor(host, port, apiPrefix) {
        this.apiPrefix = apiPrefix || process.env.MOCKER_PREFIX || '/api';
        this.host = host || process.env.MOCKER_BINDING || '0.0.0.0';
        this.port = port || +(process.env.MOCKER_PORT || 3003);
        this.server = this.create();
    }
    create() {
        const srv = (0, hapi_1.server)({
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
                return { 'ok': 'Everything OK', more: 234, other: 'OK' };
            }
        });
        srv.ext('onRequest', (req, h) => {
            const { headers } = req;
            const errorCode = +headers['x-mocker-force-error'];
            if (!!errorCode) {
                const errorMsg = headers['x-mocker-error-msg'] || `FORCED ERROR: ${errorCode}`;
                return h.response(errorMsg).code(errorCode < 600 ? errorCode : 500).takeover();
            }
            return h.continue;
        });
        srv.ext('onPreResponse', (req, h) => {
            const { response } = req;
            if (response.output?.statusCode === 404) {
                return h.response(`Missing route, try: ${this.apiPrefix}/<anything>`).code(404);
            }
            return h.continue;
        });
        return srv;
    }
    async start() {
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
exports.MockServer = MockServer;
