
import { Context } from "https://deno.land/x/hono@v2.0.8/mod.ts";
import { dirname, fromFileUrl, join } from "../deps/deno.ts";


export const getVersion = async (): Promise<string> => {
    if (!Deno.env.get('MOCKR_VERSION')) {
        let _currentVersion;
        const td = new TextDecoder();
        const pkgLocatios: string[] = ['../version.txt', './version.txt', join(Deno.cwd(), 'version.txt')];
        for (const pkgLocation of pkgLocatios) {
            try {
                _currentVersion = td.decode(await Deno.readFile(pkgLocation)).trim();
                break;
            } catch (_) {
                // Empty
            }
        }
        if (_currentVersion) {
            Deno.env.set('MOCKR_VERSION', _currentVersion);
        } else {
            return 'Unknown';
        }
    }

    return Deno.env.get('MOCKR_VERSION')!;
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
