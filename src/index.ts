import { existsSync } from 'fs';
import { join } from 'path';
import { getParams } from './cli_parser';
import { MockServer } from './mock_server';

function getVersion() {
    const possibleLocations = [
        join(__dirname, '..', 'package.json'), './package.json', join(__dirname, 'package.json')
    ]
    const pkgPath = possibleLocations.find(p => existsSync(p))!;
    return require(pkgPath).version;
}

export const run = async () => {
    
    const params = getParams();

    const mockServer = new MockServer({...params, version: getVersion()});
    
    const exitApp = async (err: any) => {
        !!err && console.error(err);
        await mockServer.stop();
        process.exit(err ? 1 : 0);
        
    }
    process.on('unhandledRejection', exitApp);
    process.on('SIGINT', exitApp);
    
    await mockServer.start();
};

if (require.main === module) {
    run();
}


