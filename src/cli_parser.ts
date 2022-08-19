//import commandLineArgs, {OptionDefinition} from 'command-line-args';
import { args, exit, parse } from './deps/deno.ts';


import { getConfig, loadConfigFile, MockerConfig } from './routes_config.ts';

interface ToolOptions {
  apiPrefix: string;
  silent: boolean;
  verbose: boolean;
  config: string[];
  responseConfig?: MockerConfig;
  port: number;
  host: string;
}

const parseConfig = {
  alias: {
      s: 'silent',
      v: 'verbose',
      c: 'config',
      a: 'apiPrefix',
      p: 'port',
      h: 'host'
  },
  boolean: ['silent', 'verbose'],
  default: {
      silent: false,
      verbose: false,
      apiPrefix: '',
      port: 3003,
      host: '0.0.0.0'
  },    
  string: ['apiPrefix', 'host', 'config'],
  collect: ['config'],
}


export const getParams = () : ToolOptions => {
  //console.log(options);
  const opts = parse(args, parseConfig) as ToolOptions;

  const extraConfig : MockerConfig[] = [];
  for (const fPath of opts.config || []) {
    try {
      extraConfig.push(loadConfigFile(fPath));
    } catch (_) {
      console.error(`Config file ${fPath} not found. Program will exit.`);
      exit(-1);
    }
  }
  
  opts.responseConfig = getConfig(...extraConfig);
  
  return opts;  
}


