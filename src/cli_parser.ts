console.log('Argumetns');

import commandLineArgs, {OptionDefinition} from 'command-line-args';

const optionDefinitions = [
    { name: 'logRequestData', alias: 'r', type: Boolean, defaultValue: false },
    { name: 'debug', alias: 'd', type: Boolean, defaultValue: false },
    { name: 'config-file', alias: 'c', type: String },
    { name: 'port', alias: 'p', type: Number, defaultValue: 3003 },
    { name: 'host', alias: 'h', type: String, defaultValue: '0.0.0.0' }
  ]

const options = commandLineArgs(optionDefinitions);

console.log(options);