
import { Context } from "https://deno.land/x/hono@v2.0.8/mod.ts";
import { dirname, fromFileUrl, join } from "../deps/deno.ts";

let VERSION :string | undefined = undefined;

export const getMainModuleDir = () : string => dirname(fromFileUrl(Deno.mainModule));

export const getVersion = async (): Promise<string> => {
    if (Deno.env.get('MOCKR_VERSION')) {
        VERSION = Deno.env.get('MOCKR_VERSION')!;
    }
    if (!VERSION) {
        let _currentVersion;
        const td = new TextDecoder();
        const pkgLocatios: string[] = [join(getMainModuleDir(),'..', 'version.txt'), join(getMainModuleDir(), 'version.txt')];
        //console.log('pkgLocatios:', pkgLocatios);
        for (const pkgLocation of pkgLocatios) {
            try {
                _currentVersion = td.decode(await Deno.readFile(pkgLocation)).trim();
                break;
            } catch (_) {
                // Empty
            }
        }
        if (_currentVersion) {
            VERSION = _currentVersion;
        }
    }

    return VERSION || 'Unknown';
}

export function getCallerIP(c: Context) {
    const remoteIp = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || c.req.header('cf-connecting-ip')
        || c.env.remoteAddr?.hostname || 'unknown';
    return remoteIp.split(',')[0].trim();
}

export function pathname(url: string): string {
    if (!url) {
        return url;
    }
    const fromIndex = url.indexOf('/', url.indexOf('://') + 3);
    if (fromIndex === -1) {
        return '/';
    }
    const toIndex = url.indexOf('?', fromIndex);
    return url.substring(fromIndex, toIndex === -1 ? undefined : toIndex);
}

// deno-lint-ignore no-explicit-any
export function isEmpty(obj: any): boolean {
    for (const _ in obj) {        
        return false;
    }
    return true;
}


export type AnyObj = { [key: string]: unknown };

// deno-lint-ignore no-explicit-any
export const toAny = (o: unknown) : any => o as any;

