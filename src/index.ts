import { getParams } from './cli_parser';
import { MockServer } from './mock_server';

const params = getParams();

const mockServer = new MockServer({...params});

mockServer.start();

const exitApp = (err: any) => {
    !!err && console.log(err);
    process.exit(1);
}

process.on('unhandledRejection', exitApp);
