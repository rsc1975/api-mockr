import { getParams } from './cli_parser';
import { MockServer } from './mock_server';


export const run = async () => {
    
    const params = getParams();

    const mockServer = new MockServer({...params});
    
    const exitApp = (err: any) => {
        !!err && console.error(err);
        process.exit(1);
    }
    process.on('unhandledRejection', exitApp);
    await mockServer.start();
};

if (require.main === module) {
    run();
}


