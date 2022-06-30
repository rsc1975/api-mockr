"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mock_server_1 = require("./mock_server");
const mockServer = new mock_server_1.MockServer();
mockServer.start();
const exitApp = (err) => {
    !!err && console.log(err);
    process.exit(1);
};
process.on('unhandledRejection', exitApp);
