import { Request } from "@hapi/hapi";
import { randAddress, randBrand, randCompanyName, randCountry, randCountryCode, randEmail, randEmoji, randFilePath, randFirstName, randFullName, randFutureDate, randIp, randJobArea, randJobTitle, randLastName, randPastDate, randPhoneNumber, randPhrase, randPost, randSports, randUrl, randUser, randUserName, randUuid, randZipCode } from '@ngneat/falso';


export class ParamValues {
  static readonly generators: any = {
    request: {
      path: (req: Request) => req.url.pathname,
      params: (req: Request, paramName?: string) => !!paramName ? req.query[paramName] : req.query,
      body: (req: Request, paramName?: string) => !!paramName ? (req.payload as any)[paramName] : req.payload,
      headers: (req: Request, headerName?: string) => !!headerName ? req.headers[headerName.toLowerCase()] : req.headers,
    },
    random: {
      integer: (max: number = Number.MAX_SAFE_INTEGER) => Math.floor(Math.random() * (+max + 1)),
      float: (max: number = 100.0) => Math.random() * (+max),
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

  public static get(paramName: string, req?: Request): Record<string, unknown> | number | string | boolean | null {
    const [category, command, ...params] = paramName.split('.');
    const generator = ParamValues.generators[category];
    if (!generator) {
      return null;
    }
    const commandFn = generator[command];
    if (!commandFn) {
      return null;
    }

    const commandParams = (category === 'request') ? [req, ...params] : params;
    return commandFn(...commandParams);
  }
}
