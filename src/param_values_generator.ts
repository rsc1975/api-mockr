
import { AnyObj, isEmpty, pathname } from './common/utils.ts';
import { randAddress, randBrand, randCompanyName, randCountry, randCountryCode, randEmail, randEmoji, randFilePath, randFirstName, randFullName, randFutureDate, randIp, randJobArea, randJobTitle, randLastName, randPastDate, randPhoneNumber, randPhrase, randSports, randUrl, randUserName, randUuid, randZipCode } from './deps/falso.ts';

// deno-lint-ignore no-explicit-any
type generatorFn = (...args: any[]) => any;
type generatorCategory = 'request' | 'random' | 'server';

type generatorConfig = Record<string, generatorFn>;

export class ParamValues {
  static readonly generators: Record<generatorCategory, generatorConfig> = {
    request: {
      path: (req: Request) => pathname(req.url),
      params: (req: Request, paramName?: string) => {
        if (paramName) {
          return req.query(paramName);
        } else {
          const params = req.query();
          return isEmpty(params) ? undefined : params;
        } 
      },
      payload: async (req: Request, paramName?: string) => {
        const body = await req.parseBody();
        if (body instanceof ArrayBuffer) {
          return undefined;
        }        
        return paramName ? (body as AnyObj)[paramName] : body;
      },
      headers: (req: Request, headerName?: string) => headerName ? req.header(headerName.toLowerCase()) : req.header(),
    },
    random: {
      integer: (max: number = Number.MAX_SAFE_INTEGER) => Math.floor(Math.random() * (+max + 1)),
      float: (max = 100.0) => Math.random() * (+max),
      boolean: () => Math.random() > 0.5,
      choose: (...values: string[]) => values[Math.floor(Math.random() * values.length)] || null,
      hexColor: () => `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        
      email: (provider?: string, suffix?: string) => randEmail({ provider, suffix }),
      personFullName: (gender?: "male" | "female") => randFullName({ gender }),
      personFirstName: (gender?: "male" | "female") => randFirstName({ gender }),
      personLastName: () => randLastName(),
      username: () => randUserName(),
      url: () => randUrl(),
      city: () => randAddress().city,
      phone: () => randPhoneNumber(),
      zipCode: () => randZipCode(),
      country: () => randCountry(),
      countryCode: () => randCountryCode(),
      emoji: () => randEmoji(),
      brand: () => randBrand(),
      company: () => randCompanyName(),
      sport: () => randSports(),
      filePath: () => randFilePath(),
      ip: () => randIp(),
      uuid: () => randUuid(),
      department: () => randJobArea(),
      jobTitle: () => randJobTitle(),
      pastDate: () => randPastDate({ years: 5 }).toISOString().substring(0, 10),
      futureDate: () => randFutureDate({ years: 5 }).toISOString().substring(0, 10),
      datetime: () => randPastDate({ years: 5 }).toISOString(),
      phrase: () => randPhrase(),
    },
    server: {
      timestamp:  () => new Date().getTime(),
      isoDatetime: () => new Date().toISOString(),
      isoDate: () => new Date().toISOString().split('T')[0],
    }
  }

  public static async get(paramName: string, req?: Request): Promise<AnyObj | number | string | boolean | null> {
    const [category, command, ...params] = paramName.split('.');
    const generator = ParamValues.generators[category as generatorCategory] as AnyObj;
    if (!generator) {
      return null;
    }
    const commandFn = generator[command] as generatorFn;
    if (!commandFn) {
      return null;
    }

    const commandParams = (category === 'request') ? [req, ...params] : params;
    return await commandFn(...commandParams);
  }

}
