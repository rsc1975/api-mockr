import { MockServer } from './mock_server';

const mockServer = new MockServer();

mockServer.start();

const exitApp = (err: any) => {
    !!err && console.log(err);
    process.exit(1);
}

process.on('unhandledRejection', exitApp);
