"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log('Argumetns');
const command_line_args_1 = __importDefault(require("command-line-args"));
const optionDefinitions = [
    { name: 'logRequestData', alias: 'r', type: Boolean, defaultValue: false },
    { name: 'debug', alias: 'd', type: Boolean, defaultValue: false },
    { name: 'config-file', alias: 'c', type: String },
    { name: 'port', alias: 'p', type: Number, defaultValue: 3003 },
    { name: 'host', alias: 'h', type: String, defaultValue: '0.0.0.0' }
];
const options = (0, command_line_args_1.default)(optionDefinitions);
console.log(options);
