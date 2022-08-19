import { getParams } from './cli_parser.ts';
import { getVersion } from './common/utils.ts';
import { MockServer } from './mock_server.ts';


export const run = async () => {
    
    const params = getParams();

    const mockServer = new MockServer({...params, version: await getVersion()});
    

    const exitApp = () => {
        mockServer.stop();        
        Deno.exit();        
    }
    Deno.addSignalListener("SIGINT", exitApp);
    
    await mockServer.start();
};

if (import.meta.main) {
    run();
}


