import commandLineArgs, {OptionDefinition} from 'command-line-args';
import { existsSync } from 'fs';
import { exit } from 'process';

interface ToolOptions {
  apiPrefix: string;
  logRequestData: boolean;
  debug: boolean;
  config: string[];
  port: number;
  host: string;
}

const optionDefinitions : OptionDefinition[] = [
    { name: 'logRequestData', alias: 'r', type: Boolean, defaultValue: false },
    { name: 'debug', alias: 'd', type: Boolean, defaultValue: false },
    { name: 'config', alias: 'c', multiple: true, type: String },
    { name: 'apiPrefix', alias: 'a', type: String, defaultValue: '/api' },
    { name: 'port', alias: 'p', type: Number, defaultValue: 3003 },
    { name: 'host', alias: 'h', type: String, defaultValue: '0.0.0.0' }
  ]


export const getParams = () : ToolOptions => {
  //console.log(options);
  const opts = commandLineArgs(optionDefinitions, {
    partial: true
  }) as ToolOptions;
  for (let fPath of opts.config || []) {
    if (!existsSync(fPath)) {
      console.error(`Config file ${fPath} not found. Program will exit.`);
      exit(-1);
    }
  }
  return opts;  
}
