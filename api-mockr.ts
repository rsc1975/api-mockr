// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const osType = (()=>{
    const { Deno: Deno1  } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator  } = globalThis;
    if (navigator?.appVersion?.includes?.("Win")) {
        return "windows";
    }
    return "linux";
})();
const isWindows = osType === "windows";
const CHAR_FORWARD_SLASH = 47;
function assertPath(path) {
    if (typeof path !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
    }
}
function isPosixPathSeparator(code) {
    return code === 47;
}
function isPathSeparator(code) {
    return isPosixPathSeparator(code) || code === 92;
}
function isWindowsDeviceRoot(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path.length; i <= len; ++i){
        if (i < len) code = path.charCodeAt(i);
        else if (isPathSeparator(code)) break;
        else code = CHAR_FORWARD_SLASH;
        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {} else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
                else res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function _format(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (dir === pathObject.root) return dir + base;
    return dir + sep + base;
}
const WHITESPACE_ENCODINGS = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS[c] ?? c;
    });
}
class DenoStdInternalError extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError(msg);
    }
}
const sep = "\\";
const delimiter = ";";
function resolve(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno: Deno1  } = globalThis;
        if (i >= 0) {
            path = pathSegments[i];
        } else if (!resolvedDevice) {
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path = Deno1.cwd();
        } else {
            if (typeof Deno1?.env?.get !== "function" || typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
            if (path === undefined || path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path = `${resolvedDevice}\\`;
            }
        }
        assertPath(path);
        const len = path.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator(code)) {
                isAbsolute = true;
                if (isPathSeparator(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator(path.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                device = `\\\\${firstPart}\\${path.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot(code)) {
                if (path.charCodeAt(1) === 58) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator(path.charCodeAt(2))) {
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator(code)) {
            rootEnd = 1;
            isAbsolute = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            isAbsolute = true;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return `\\\\${firstPart}\\${path.slice(last)}\\`;
                        } else if (j !== last) {
                            device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute) tail = ".";
    if (tail.length > 0 && isPathSeparator(path.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function isAbsolute(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return false;
    const code = path.charCodeAt(0);
    if (isPathSeparator(code)) {
        return true;
    } else if (isWindowsDeviceRoot(code)) {
        if (len > 2 && path.charCodeAt(1) === 58) {
            if (isPathSeparator(path.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < pathsCount; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (joined === undefined) joined = firstPart = path;
            else joined += `\\${path}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert(firstPart != null);
    if (isPathSeparator(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize(joined);
}
function relative(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    const fromOrig = resolve(from);
    const toOrig = resolve(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 92) {
                    return toOrig.slice(toStart + i + 1);
                } else if (i === 2) {
                    return toOrig.slice(toStart + i);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 92) {
                    lastCommonSep = i;
                } else if (i === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i;
    }
    if (i !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
function toNamespacedPath(path) {
    if (typeof path !== "string") return path;
    if (path.length === 0) return "";
    const resolvedPath = resolve(path);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path;
}
function dirname(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return path;
                        }
                        if (j !== last) {
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return path;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator(path.charCodeAt(i))) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return path.slice(0, end);
}
function basename(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot(drive)) {
            if (path.charCodeAt(1) === 58) start = 2;
        }
    }
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= start; --i){
            const code = path.charCodeAt(i);
            if (isPathSeparator(code)) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path.length;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= start; --i){
            if (isPathSeparator(path.charCodeAt(i))) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
function extname(path) {
    assertPath(path);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path.length >= 2 && path.charCodeAt(1) === 58 && isWindowsDeviceRoot(path.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path.length - 1; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("\\", pathObject);
}
function parse(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path;
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        ret.root = ret.dir = path;
        return ret;
    }
    if (rootEnd > 0) ret.root = path.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= rootEnd; --i){
        code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path.slice(startPart, end);
        }
    } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function fromFileUrl(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path = `\\\\${url.hostname}${path}`;
    }
    return path;
}
function toFileUrl(path) {
    if (!isAbsolute(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod = {
    sep: sep,
    delimiter: delimiter,
    resolve: resolve,
    normalize: normalize,
    isAbsolute: isAbsolute,
    join: join,
    relative: relative,
    toNamespacedPath: toNamespacedPath,
    dirname: dirname,
    basename: basename,
    extname: extname,
    format: format,
    parse: parse,
    fromFileUrl: fromFileUrl,
    toFileUrl: toFileUrl
};
const sep1 = "/";
const delimiter1 = ":";
function resolve1(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            const { Deno: Deno1  } = globalThis;
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
        }
        assertPath(path);
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
    }
    resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize1(path) {
    assertPath(path);
    if (path.length === 0) return ".";
    const isAbsolute = path.charCodeAt(0) === 47;
    const trailingSeparator = path.charCodeAt(path.length - 1) === 47;
    path = normalizeString(path, !isAbsolute, "/", isPosixPathSeparator);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
function isAbsolute1(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47;
}
function join1(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `/${path}`;
        }
    }
    if (!joined) return ".";
    return normalize1(joined);
}
function relative1(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    from = resolve1(from);
    to = resolve1(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 47) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 47) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 47) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 47) {
                    lastCommonSep = i;
                } else if (i === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 47) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 47) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (to.charCodeAt(toStart) === 47) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath1(path) {
    return path;
}
function dirname1(path) {
    assertPath(path);
    if (path.length === 0) return ".";
    const hasRoot = path.charCodeAt(0) === 47;
    let end = -1;
    let matchedSlash = true;
    for(let i = path.length - 1; i >= 1; --i){
        if (path.charCodeAt(i) === 47) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) return hasRoot ? "/" : ".";
    if (hasRoot && end === 1) return "//";
    return path.slice(0, end);
}
function basename1(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= 0; --i){
            const code = path.charCodeAt(i);
            if (code === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path.length;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= 0; --i){
            if (path.charCodeAt(i) === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
function extname1(path) {
    assertPath(path);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path.length - 1; i >= 0; --i){
        const code = path.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format1(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("/", pathObject);
}
function parse1(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = path.charCodeAt(0) === 47;
    let start;
    if (isAbsolute) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= start; --i){
        const code = path.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute) {
                ret.base = ret.name = path.slice(1, end);
            } else {
                ret.base = ret.name = path.slice(startPart, end);
            }
        }
    } else {
        if (startPart === 0 && isAbsolute) {
            ret.name = path.slice(1, startDot);
            ret.base = path.slice(1, end);
        } else {
            ret.name = path.slice(startPart, startDot);
            ret.base = path.slice(startPart, end);
        }
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);
    else if (isAbsolute) ret.dir = "/";
    return ret;
}
function fromFileUrl1(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl1(path) {
    if (!isAbsolute1(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod1 = {
    sep: sep1,
    delimiter: delimiter1,
    resolve: resolve1,
    normalize: normalize1,
    isAbsolute: isAbsolute1,
    join: join1,
    relative: relative1,
    toNamespacedPath: toNamespacedPath1,
    dirname: dirname1,
    basename: basename1,
    extname: extname1,
    format: format1,
    parse: parse1,
    fromFileUrl: fromFileUrl1,
    toFileUrl: toFileUrl1
};
const path = isWindows ? mod : mod1;
const { join: join2 , normalize: normalize2  } = path;
const path1 = isWindows ? mod : mod1;
const { basename: basename2 , delimiter: delimiter2 , dirname: dirname2 , extname: extname2 , format: format2 , fromFileUrl: fromFileUrl2 , isAbsolute: isAbsolute2 , join: join3 , normalize: normalize3 , parse: parse2 , relative: relative2 , resolve: resolve2 , sep: sep2 , toFileUrl: toFileUrl2 , toNamespacedPath: toNamespacedPath2 ,  } = path1;
function delay(ms, options = {}) {
    const { signal  } = options;
    if (signal?.aborted) {
        return Promise.reject(new DOMException("Delay was aborted.", "AbortError"));
    }
    return new Promise((resolve, reject)=>{
        const abort = ()=>{
            clearTimeout(i);
            reject(new DOMException("Delay was aborted.", "AbortError"));
        };
        const done = ()=>{
            signal?.removeEventListener("abort", abort);
            resolve();
        };
        const i = setTimeout(done, ms);
        signal?.addEventListener("abort", abort, {
            once: true
        });
    });
}
const ERROR_SERVER_CLOSED = "Server closed";
const INITIAL_ACCEPT_BACKOFF_DELAY = 5;
const MAX_ACCEPT_BACKOFF_DELAY = 1000;
class Server {
    #port;
    #host;
    #handler;
    #closed = false;
    #listeners = new Set();
    #httpConnections = new Set();
    #onError;
    constructor(serverInit){
        this.#port = serverInit.port;
        this.#host = serverInit.hostname;
        this.#handler = serverInit.handler;
        this.#onError = serverInit.onError ?? function(error) {
            console.error(error);
            return new Response("Internal Server Error", {
                status: 500
            });
        };
    }
    async serve(listener) {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        this.#trackListener(listener);
        try {
            return await this.#accept(listener);
        } finally{
            this.#untrackListener(listener);
            try {
                listener.close();
            } catch  {}
        }
    }
    async listenAndServe() {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        const listener = Deno.listen({
            port: this.#port ?? 80,
            hostname: this.#host ?? "0.0.0.0",
            transport: "tcp"
        });
        return await this.serve(listener);
    }
    async listenAndServeTls(certFile, keyFile) {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        const listener = Deno.listenTls({
            port: this.#port ?? 443,
            hostname: this.#host ?? "0.0.0.0",
            certFile,
            keyFile,
            transport: "tcp"
        });
        return await this.serve(listener);
    }
    close() {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        this.#closed = true;
        for (const listener of this.#listeners){
            try {
                listener.close();
            } catch  {}
        }
        this.#listeners.clear();
        for (const httpConn of this.#httpConnections){
            this.#closeHttpConn(httpConn);
        }
        this.#httpConnections.clear();
    }
    get closed() {
        return this.#closed;
    }
    get addrs() {
        return Array.from(this.#listeners).map((listener)=>listener.addr);
    }
    async #respond(requestEvent, httpConn, connInfo) {
        let response;
        try {
            response = await this.#handler(requestEvent.request, connInfo);
        } catch (error) {
            response = await this.#onError(error);
        }
        try {
            await requestEvent.respondWith(response);
        } catch  {
            return this.#closeHttpConn(httpConn);
        }
    }
    async #serveHttp(httpConn1, connInfo1) {
        while(!this.#closed){
            let requestEvent1;
            try {
                requestEvent1 = await httpConn1.nextRequest();
            } catch  {
                break;
            }
            if (requestEvent1 === null) {
                break;
            }
            this.#respond(requestEvent1, httpConn1, connInfo1);
        }
        this.#closeHttpConn(httpConn1);
    }
    async #accept(listener) {
        let acceptBackoffDelay;
        while(!this.#closed){
            let conn;
            try {
                conn = await listener.accept();
            } catch (error1) {
                if (error1 instanceof Deno.errors.BadResource || error1 instanceof Deno.errors.InvalidData || error1 instanceof Deno.errors.UnexpectedEof || error1 instanceof Deno.errors.ConnectionReset || error1 instanceof Deno.errors.NotConnected) {
                    if (!acceptBackoffDelay) {
                        acceptBackoffDelay = INITIAL_ACCEPT_BACKOFF_DELAY;
                    } else {
                        acceptBackoffDelay *= 2;
                    }
                    if (acceptBackoffDelay >= 1000) {
                        acceptBackoffDelay = MAX_ACCEPT_BACKOFF_DELAY;
                    }
                    await delay(acceptBackoffDelay);
                    continue;
                }
                throw error1;
            }
            acceptBackoffDelay = undefined;
            let httpConn2;
            try {
                httpConn2 = Deno.serveHttp(conn);
            } catch  {
                continue;
            }
            this.#trackHttpConnection(httpConn2);
            const connInfo2 = {
                localAddr: conn.localAddr,
                remoteAddr: conn.remoteAddr
            };
            this.#serveHttp(httpConn2, connInfo2);
        }
    }
     #closeHttpConn(httpConn3) {
        this.#untrackHttpConnection(httpConn3);
        try {
            httpConn3.close();
        } catch  {}
    }
     #trackListener(listener1) {
        this.#listeners.add(listener1);
    }
     #untrackListener(listener2) {
        this.#listeners.delete(listener2);
    }
     #trackHttpConnection(httpConn4) {
        this.#httpConnections.add(httpConn4);
    }
     #untrackHttpConnection(httpConn5) {
        this.#httpConnections.delete(httpConn5);
    }
}
function hostnameForDisplay(hostname) {
    return hostname === "0.0.0.0" ? "localhost" : hostname;
}
async function serve(handler, options = {}) {
    let port = options.port ?? 8000;
    const hostname = options.hostname ?? "0.0.0.0";
    const server = new Server({
        port,
        hostname,
        handler,
        onError: options.onError
    });
    options?.signal?.addEventListener("abort", ()=>server.close(), {
        once: true
    });
    const s = server.listenAndServe();
    port = server.addrs[0].port;
    if ("onListen" in options) {
        options.onListen?.({
            port,
            hostname
        });
    } else {
        console.log(`Listening on http://${hostnameForDisplay(hostname)}:${port}/`);
    }
    return await s;
}
const { hasOwn  } = Object;
function get(obj, key) {
    if (hasOwn(obj, key)) {
        return obj[key];
    }
}
function getForce(obj, key) {
    const v = get(obj, key);
    assert(v != null);
    return v;
}
function isNumber(x) {
    if (typeof x === "number") return true;
    if (/^0x[0-9a-f]+$/i.test(String(x))) return true;
    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(String(x));
}
function hasKey(obj, keys) {
    let o = obj;
    keys.slice(0, -1).forEach((key)=>{
        o = get(o, key) ?? {};
    });
    const key = keys[keys.length - 1];
    return hasOwn(o, key);
}
function parse3(args, { "--": doubleDash = false , alias ={} , boolean: __boolean = false , default: defaults = {} , stopEarly =false , string =[] , collect =[] , negatable =[] , unknown =(i)=>i  } = {}) {
    const flags = {
        bools: {},
        strings: {},
        unknownFn: unknown,
        allBools: false,
        collect: {},
        negatable: {}
    };
    if (__boolean !== undefined) {
        if (typeof __boolean === "boolean") {
            flags.allBools = !!__boolean;
        } else {
            const booleanArgs = typeof __boolean === "string" ? [
                __boolean
            ] : __boolean;
            for (const key of booleanArgs.filter(Boolean)){
                flags.bools[key] = true;
            }
        }
    }
    const aliases = {};
    if (alias !== undefined) {
        for(const key1 in alias){
            const val = getForce(alias, key1);
            if (typeof val === "string") {
                aliases[key1] = [
                    val
                ];
            } else {
                aliases[key1] = val;
            }
            for (const alias1 of getForce(aliases, key1)){
                aliases[alias1] = [
                    key1
                ].concat(aliases[key1].filter((y)=>alias1 !== y));
            }
        }
    }
    if (string !== undefined) {
        const stringArgs = typeof string === "string" ? [
            string
        ] : string;
        for (const key2 of stringArgs.filter(Boolean)){
            flags.strings[key2] = true;
            const alias2 = get(aliases, key2);
            if (alias2) {
                for (const al of alias2){
                    flags.strings[al] = true;
                }
            }
        }
    }
    if (collect !== undefined) {
        const collectArgs = typeof collect === "string" ? [
            collect
        ] : collect;
        for (const key3 of collectArgs.filter(Boolean)){
            flags.collect[key3] = true;
            const alias3 = get(aliases, key3);
            if (alias3) {
                for (const al1 of alias3){
                    flags.collect[al1] = true;
                }
            }
        }
    }
    if (negatable !== undefined) {
        const negatableArgs = typeof negatable === "string" ? [
            negatable
        ] : negatable;
        for (const key4 of negatableArgs.filter(Boolean)){
            flags.negatable[key4] = true;
            const alias4 = get(aliases, key4);
            if (alias4) {
                for (const al2 of alias4){
                    flags.negatable[al2] = true;
                }
            }
        }
    }
    const argv = {
        _: []
    };
    function argDefined(key, arg) {
        return flags.allBools && /^--[^=]+$/.test(arg) || get(flags.bools, key) || !!get(flags.strings, key) || !!get(aliases, key);
    }
    function setKey(obj, name, value, collect = true) {
        let o = obj;
        const keys = name.split(".");
        keys.slice(0, -1).forEach(function(key) {
            if (get(o, key) === undefined) {
                o[key] = {};
            }
            o = get(o, key);
        });
        const key = keys[keys.length - 1];
        const collectable = collect && !!get(flags.collect, name);
        if (!collectable) {
            o[key] = value;
        } else if (get(o, key) === undefined) {
            o[key] = [
                value
            ];
        } else if (Array.isArray(get(o, key))) {
            o[key].push(value);
        } else {
            o[key] = [
                get(o, key),
                value
            ];
        }
    }
    function setArg(key, val, arg = undefined, collect) {
        if (arg && flags.unknownFn && !argDefined(key, arg)) {
            if (flags.unknownFn(arg, key, val) === false) return;
        }
        const value = !get(flags.strings, key) && isNumber(val) ? Number(val) : val;
        setKey(argv, key, value, collect);
        const alias = get(aliases, key);
        if (alias) {
            for (const x of alias){
                setKey(argv, x, value, collect);
            }
        }
    }
    function aliasIsBoolean(key) {
        return getForce(aliases, key).some((x)=>typeof get(flags.bools, x) === "boolean");
    }
    let notFlags = [];
    if (args.includes("--")) {
        notFlags = args.slice(args.indexOf("--") + 1);
        args = args.slice(0, args.indexOf("--"));
    }
    for(let i = 0; i < args.length; i++){
        const arg = args[i];
        if (/^--.+=/.test(arg)) {
            const m = arg.match(/^--([^=]+)=(.*)$/s);
            assert(m != null);
            const [, key5, value] = m;
            if (flags.bools[key5]) {
                const booleanValue = value !== "false";
                setArg(key5, booleanValue, arg);
            } else {
                setArg(key5, value, arg);
            }
        } else if (/^--no-.+/.test(arg) && get(flags.negatable, arg.replace(/^--no-/, ""))) {
            const m1 = arg.match(/^--no-(.+)/);
            assert(m1 != null);
            setArg(m1[1], false, arg, false);
        } else if (/^--.+/.test(arg)) {
            const m2 = arg.match(/^--(.+)/);
            assert(m2 != null);
            const [, key6] = m2;
            const next = args[i + 1];
            if (next !== undefined && !/^-/.test(next) && !get(flags.bools, key6) && !flags.allBools && (get(aliases, key6) ? !aliasIsBoolean(key6) : true)) {
                setArg(key6, next, arg);
                i++;
            } else if (/^(true|false)$/.test(next)) {
                setArg(key6, next === "true", arg);
                i++;
            } else {
                setArg(key6, get(flags.strings, key6) ? "" : true, arg);
            }
        } else if (/^-[^-]+/.test(arg)) {
            const letters = arg.slice(1, -1).split("");
            let broken = false;
            for(let j = 0; j < letters.length; j++){
                const next1 = arg.slice(j + 2);
                if (next1 === "-") {
                    setArg(letters[j], next1, arg);
                    continue;
                }
                if (/[A-Za-z]/.test(letters[j]) && /=/.test(next1)) {
                    setArg(letters[j], next1.split(/=(.+)/)[1], arg);
                    broken = true;
                    break;
                }
                if (/[A-Za-z]/.test(letters[j]) && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next1)) {
                    setArg(letters[j], next1, arg);
                    broken = true;
                    break;
                }
                if (letters[j + 1] && letters[j + 1].match(/\W/)) {
                    setArg(letters[j], arg.slice(j + 2), arg);
                    broken = true;
                    break;
                } else {
                    setArg(letters[j], get(flags.strings, letters[j]) ? "" : true, arg);
                }
            }
            const [key7] = arg.slice(-1);
            if (!broken && key7 !== "-") {
                if (args[i + 1] && !/^(-|--)[^-]/.test(args[i + 1]) && !get(flags.bools, key7) && (get(aliases, key7) ? !aliasIsBoolean(key7) : true)) {
                    setArg(key7, args[i + 1], arg);
                    i++;
                } else if (args[i + 1] && /^(true|false)$/.test(args[i + 1])) {
                    setArg(key7, args[i + 1] === "true", arg);
                    i++;
                } else {
                    setArg(key7, get(flags.strings, key7) ? "" : true, arg);
                }
            }
        } else {
            if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
                argv._.push(flags.strings["_"] ?? !isNumber(arg) ? arg : Number(arg));
            }
            if (stopEarly) {
                argv._.push(...args.slice(i + 1));
                break;
            }
        }
    }
    for (const [key8, value1] of Object.entries(defaults)){
        if (!hasKey(argv, key8.split("."))) {
            setKey(argv, key8, value1);
            if (aliases[key8]) {
                for (const x of aliases[key8]){
                    setKey(argv, x, value1);
                }
            }
        }
    }
    for (const key9 of Object.keys(flags.bools)){
        if (!hasKey(argv, key9.split("."))) {
            const value2 = get(flags.collect, key9) ? [] : false;
            setKey(argv, key9, value2, false);
        }
    }
    for (const key10 of Object.keys(flags.strings)){
        if (!hasKey(argv, key10.split(".")) && get(flags.collect, key10)) {
            setKey(argv, key10, [], false);
        }
    }
    if (doubleDash) {
        argv["--"] = [];
        for (const key11 of notFlags){
            argv["--"].push(key11);
        }
    } else {
        for (const key12 of notFlags){
            argv._.push(key12);
        }
    }
    return argv;
}
let VERSION = 'Unknown';
const getVersion = async ()=>{
    if (Deno.env.get('MOCKR_VERSION')) {
        VERSION = Deno.env.get('MOCKR_VERSION');
    }
    if (!VERSION) {
        let _currentVersion;
        const td = new TextDecoder();
        const pkgLocatios = [
            '../version.txt',
            './version.txt',
            join3(Deno.cwd(), 'version.txt')
        ];
        for (const pkgLocation of pkgLocatios){
            try {
                _currentVersion = td.decode(await Deno.readFile(pkgLocation)).trim();
                break;
            } catch (_) {}
        }
        if (_currentVersion) {
            Deno.env.set('MOCKR_VERSION', _currentVersion);
        } else {
            return 'Unknown';
        }
    }
    return VERSION;
};
function pathname(url) {
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
function isEmpty(obj) {
    for(const _ in obj){
        return false;
    }
    return true;
}
const toAny = (o)=>o;
const mainModuleDir = dirname2(fromFileUrl2(Deno.mainModule));
console.log('mainModuleDir:', mainModuleDir);
const codes = {};
function hideStackFrames(fn) {
    const hidden = "__node_internal_" + fn.name;
    Object.defineProperty(fn, "name", {
        value: hidden
    });
    return fn;
}
const _toString = Object.prototype.toString;
const _isObjectLike = (value)=>value !== null && typeof value === "object";
const _isFunctionLike = (value)=>value !== null && typeof value === "function";
function isAnyArrayBuffer(value) {
    return _isObjectLike(value) && (_toString.call(value) === "[object ArrayBuffer]" || _toString.call(value) === "[object SharedArrayBuffer]");
}
function isArgumentsObject(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Arguments]";
}
function isArrayBuffer(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object ArrayBuffer]";
}
function isAsyncFunction(value) {
    return _isFunctionLike(value) && _toString.call(value) === "[object AsyncFunction]";
}
function isBooleanObject(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Boolean]";
}
function isBoxedPrimitive(value) {
    return isBooleanObject(value) || isStringObject(value) || isNumberObject(value) || isSymbolObject(value) || isBigIntObject(value);
}
function isDataView(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object DataView]";
}
function isDate(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Date]";
}
function isGeneratorFunction(value) {
    return _isFunctionLike(value) && _toString.call(value) === "[object GeneratorFunction]";
}
function isGeneratorObject(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Generator]";
}
function isMap(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Map]";
}
function isMapIterator(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Map Iterator]";
}
function isModuleNamespaceObject(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Module]";
}
function isNativeError(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Error]";
}
function isNumberObject(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Number]";
}
function isBigIntObject(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object BigInt]";
}
function isPromise(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Promise]";
}
function isRegExp(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object RegExp]";
}
function isSet(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Set]";
}
function isSetIterator(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Set Iterator]";
}
function isSharedArrayBuffer(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object SharedArrayBuffer]";
}
function isStringObject(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object String]";
}
function isSymbolObject(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Symbol]";
}
function isWeakMap(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object WeakMap]";
}
function isWeakSet(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object WeakSet]";
}
const __default = {
    isAsyncFunction,
    isGeneratorFunction,
    isAnyArrayBuffer,
    isArrayBuffer,
    isArgumentsObject,
    isBoxedPrimitive,
    isDataView,
    isMap,
    isMapIterator,
    isModuleNamespaceObject,
    isNativeError,
    isPromise,
    isSet,
    isSetIterator,
    isWeakMap,
    isWeakSet,
    isRegExp,
    isDate,
    isStringObject,
    isNumberObject,
    isBooleanObject,
    isBigIntObject
};
const mod2 = {
    isAnyArrayBuffer: isAnyArrayBuffer,
    isArgumentsObject: isArgumentsObject,
    isArrayBuffer: isArrayBuffer,
    isAsyncFunction: isAsyncFunction,
    isBooleanObject: isBooleanObject,
    isBoxedPrimitive: isBoxedPrimitive,
    isDataView: isDataView,
    isDate: isDate,
    isGeneratorFunction: isGeneratorFunction,
    isGeneratorObject: isGeneratorObject,
    isMap: isMap,
    isMapIterator: isMapIterator,
    isModuleNamespaceObject: isModuleNamespaceObject,
    isNativeError: isNativeError,
    isNumberObject: isNumberObject,
    isBigIntObject: isBigIntObject,
    isPromise: isPromise,
    isRegExp: isRegExp,
    isSet: isSet,
    isSetIterator: isSetIterator,
    isSharedArrayBuffer: isSharedArrayBuffer,
    isStringObject: isStringObject,
    isSymbolObject: isSymbolObject,
    isWeakMap: isWeakMap,
    isWeakSet: isWeakSet,
    default: __default
};
Symbol("kHandle");
Symbol("kKeyObject");
Symbol("kKeyType");
const _toString1 = Object.prototype.toString;
const _isObjectLike1 = (value)=>value !== null && typeof value === "object";
function isArrayBufferView(value) {
    return ArrayBuffer.isView(value);
}
function isFloat32Array(value) {
    return _isObjectLike1(value) && _toString1.call(value) === "[object Float32Array]";
}
function isFloat64Array(value) {
    return _isObjectLike1(value) && _toString1.call(value) === "[object Float64Array]";
}
function isTypedArray(value) {
    const reTypedTag = /^\[object (?:Float(?:32|64)|(?:Int|Uint)(?:8|16|32)|Uint8Clamped)Array\]$/;
    return _isObjectLike1(value) && reTypedTag.test(_toString1.call(value));
}
function isUint8Array(value) {
    return _isObjectLike1(value) && _toString1.call(value) === "[object Uint8Array]";
}
const { isDate: isDate1 , isArgumentsObject: isArgumentsObject1 , isBigIntObject: isBigIntObject1 , isBooleanObject: isBooleanObject1 , isNumberObject: isNumberObject1 , isStringObject: isStringObject1 , isSymbolObject: isSymbolObject1 , isNativeError: isNativeError1 , isRegExp: isRegExp1 , isAsyncFunction: isAsyncFunction1 , isGeneratorFunction: isGeneratorFunction1 , isGeneratorObject: isGeneratorObject1 , isPromise: isPromise1 , isMap: isMap1 , isSet: isSet1 , isMapIterator: isMapIterator1 , isSetIterator: isSetIterator1 , isWeakMap: isWeakMap1 , isWeakSet: isWeakSet1 , isArrayBuffer: isArrayBuffer1 , isDataView: isDataView1 , isSharedArrayBuffer: isSharedArrayBuffer1 , isModuleNamespaceObject: isModuleNamespaceObject1 , isAnyArrayBuffer: isAnyArrayBuffer1 , isBoxedPrimitive: isBoxedPrimitive1 ,  } = mod2;
function normalizeEncoding(enc) {
    if (enc == null || enc === "utf8" || enc === "utf-8") return "utf8";
    return slowCases(enc);
}
function slowCases(enc) {
    switch(enc.length){
        case 4:
            if (enc === "UTF8") return "utf8";
            if (enc === "ucs2" || enc === "UCS2") return "utf16le";
            enc = `${enc}`.toLowerCase();
            if (enc === "utf8") return "utf8";
            if (enc === "ucs2") return "utf16le";
            break;
        case 3:
            if (enc === "hex" || enc === "HEX" || `${enc}`.toLowerCase() === "hex") {
                return "hex";
            }
            break;
        case 5:
            if (enc === "ascii") return "ascii";
            if (enc === "ucs-2") return "utf16le";
            if (enc === "UTF-8") return "utf8";
            if (enc === "ASCII") return "ascii";
            if (enc === "UCS-2") return "utf16le";
            enc = `${enc}`.toLowerCase();
            if (enc === "utf-8") return "utf8";
            if (enc === "ascii") return "ascii";
            if (enc === "ucs-2") return "utf16le";
            break;
        case 6:
            if (enc === "base64") return "base64";
            if (enc === "latin1" || enc === "binary") return "latin1";
            if (enc === "BASE64") return "base64";
            if (enc === "LATIN1" || enc === "BINARY") return "latin1";
            enc = `${enc}`.toLowerCase();
            if (enc === "base64") return "base64";
            if (enc === "latin1" || enc === "binary") return "latin1";
            break;
        case 7:
            if (enc === "utf16le" || enc === "UTF16LE" || `${enc}`.toLowerCase() === "utf16le") {
                return "utf16le";
            }
            break;
        case 8:
            if (enc === "utf-16le" || enc === "UTF-16LE" || `${enc}`.toLowerCase() === "utf-16le") {
                return "utf16le";
            }
            break;
        case 9:
            if (enc === "base64url" || enc === "BASE64URL" || `${enc}`.toLowerCase() === "base64url") {
                return "base64url";
            }
            break;
        default:
            if (enc === "") return "utf8";
    }
}
function isInt32(value) {
    return value === (value | 0);
}
function isUint32(value) {
    return value === value >>> 0;
}
const validateBuffer = hideStackFrames((buffer, name = "buffer")=>{
    if (!isArrayBufferView(buffer)) {
        throw new codes.ERR_INVALID_ARG_TYPE(name, [
            "Buffer",
            "TypedArray",
            "DataView"
        ], buffer);
    }
});
hideStackFrames((value, name, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER)=>{
    if (typeof value !== "number") {
        throw new codes.ERR_INVALID_ARG_TYPE(name, "number", value);
    }
    if (!Number.isInteger(value)) {
        throw new codes.ERR_OUT_OF_RANGE(name, "an integer", value);
    }
    if (value < min || value > max) {
        throw new codes.ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
    }
});
const validateObject = hideStackFrames((value, name, options)=>{
    const useDefaultOptions = options == null;
    const allowArray = useDefaultOptions ? false : options.allowArray;
    const allowFunction = useDefaultOptions ? false : options.allowFunction;
    const nullable = useDefaultOptions ? false : options.nullable;
    if (!nullable && value === null || !allowArray && Array.isArray(value) || typeof value !== "object" && (!allowFunction || typeof value !== "function")) {
        throw new codes.ERR_INVALID_ARG_TYPE(name, "Object", value);
    }
});
hideStackFrames((value, name, min = -2147483648, max = 2147483647)=>{
    if (!isInt32(value)) {
        if (typeof value !== "number") {
            throw new codes.ERR_INVALID_ARG_TYPE(name, "number", value);
        }
        if (!Number.isInteger(value)) {
            throw new codes.ERR_OUT_OF_RANGE(name, "an integer", value);
        }
        throw new codes.ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
    }
    if (value < min || value > max) {
        throw new codes.ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
    }
});
hideStackFrames((value, name, positive)=>{
    if (!isUint32(value)) {
        if (typeof value !== "number") {
            throw new codes.ERR_INVALID_ARG_TYPE(name, "number", value);
        }
        if (!Number.isInteger(value)) {
            throw new codes.ERR_OUT_OF_RANGE(name, "an integer", value);
        }
        const min = positive ? 1 : 0;
        throw new codes.ERR_OUT_OF_RANGE(name, `>= ${min} && < 4294967296`, value);
    }
    if (positive && value === 0) {
        throw new codes.ERR_OUT_OF_RANGE(name, ">= 1 && < 4294967296", value);
    }
});
function validateString(value, name) {
    if (typeof value !== "string") {
        throw new codes.ERR_INVALID_ARG_TYPE(name, "string", value);
    }
}
hideStackFrames((value, name, oneOf)=>{
    if (!Array.prototype.includes.call(oneOf, value)) {
        const allowed = Array.prototype.join.call(Array.prototype.map.call(oneOf, (v)=>typeof v === "string" ? `'${v}'` : String(v)), ", ");
        const reason = "must be one of: " + allowed;
        throw new codes.ERR_INVALID_ARG_VALUE(name, value, reason);
    }
});
hideStackFrames((callback)=>{
    if (typeof callback !== "function") {
        throw new codes.ERR_INVALID_CALLBACK(callback);
    }
});
hideStackFrames((signal, name)=>{
    if (signal !== undefined && (signal === null || typeof signal !== "object" || !("aborted" in signal))) {
        throw new codes.ERR_INVALID_ARG_TYPE(name, "AbortSignal", signal);
    }
});
const validateFunction = hideStackFrames((value, name)=>{
    if (typeof value !== "function") {
        throw new codes.ERR_INVALID_ARG_TYPE(name, "Function", value);
    }
});
hideStackFrames((value, name, minLength = 0)=>{
    if (!Array.isArray(value)) {
        throw new codes.ERR_INVALID_ARG_TYPE(name, "Array", value);
    }
    if (value.length < minLength) {
        const reason = `must be longer than ${minLength}`;
        throw new codes.ERR_INVALID_ARG_VALUE(name, value, reason);
    }
});
Symbol.for("nodejs.util.inspect.custom");
const kEnumerableProperty = Object.create(null);
kEnumerableProperty.enumerable = true;
new Set();
const kCustomPromisifiedSymbol = Symbol.for("nodejs.util.promisify.custom");
const kCustomPromisifyArgsSymbol = Symbol.for("nodejs.util.promisify.customArgs");
function promisify(original) {
    validateFunction(original, "original");
    if (original[kCustomPromisifiedSymbol]) {
        const fn = original[kCustomPromisifiedSymbol];
        validateFunction(fn, "util.promisify.custom");
        return Object.defineProperty(fn, kCustomPromisifiedSymbol, {
            value: fn,
            enumerable: false,
            writable: false,
            configurable: true
        });
    }
    const argumentNames = original[kCustomPromisifyArgsSymbol];
    function fn1(...args) {
        return new Promise((resolve, reject)=>{
            args.push((err, ...values)=>{
                if (err) {
                    return reject(err);
                }
                if (argumentNames !== undefined && values.length > 1) {
                    const obj = {};
                    for(let i = 0; i < argumentNames.length; i++){
                        obj[argumentNames[i]] = values[i];
                    }
                    resolve(obj);
                } else {
                    resolve(values[0]);
                }
            });
            Reflect.apply(original, this, args);
        });
    }
    Object.setPrototypeOf(fn1, Object.getPrototypeOf(original));
    Object.defineProperty(fn1, kCustomPromisifiedSymbol, {
        value: fn1,
        enumerable: false,
        writable: false,
        configurable: true
    });
    return Object.defineProperties(fn1, Object.getOwnPropertyDescriptors(original));
}
promisify.custom = kCustomPromisifiedSymbol;
let core;
if (Deno?.core) {
    core = Deno.core;
} else {
    core = {
        setNextTickCallback: undefined,
        evalContext (_code, _filename) {
            throw new Error("Deno.core.evalContext is not supported in this environment");
        },
        encode (chunk) {
            return new TextEncoder().encode(chunk);
        },
        eventLoopHasMoreWork () {
            return false;
        }
    };
}
const kSize = 2048;
const kMask = 2048 - 1;
class FixedCircularBuffer {
    bottom;
    top;
    list;
    next;
    constructor(){
        this.bottom = 0;
        this.top = 0;
        this.list = new Array(kSize);
        this.next = null;
    }
    isEmpty() {
        return this.top === this.bottom;
    }
    isFull() {
        return (this.top + 1 & kMask) === this.bottom;
    }
    push(data) {
        this.list[this.top] = data;
        this.top = this.top + 1 & kMask;
    }
    shift() {
        const nextItem = this.list[this.bottom];
        if (nextItem === undefined) {
            return null;
        }
        this.list[this.bottom] = undefined;
        this.bottom = this.bottom + 1 & kMask;
        return nextItem;
    }
}
class FixedQueue {
    head;
    tail;
    constructor(){
        this.head = this.tail = new FixedCircularBuffer();
    }
    isEmpty() {
        return this.head.isEmpty();
    }
    push(data) {
        if (this.head.isFull()) {
            this.head = this.head.next = new FixedCircularBuffer();
        }
        this.head.push(data);
    }
    shift() {
        const tail = this.tail;
        const next = tail.shift();
        if (tail.isEmpty() && tail.next !== null) {
            this.tail = tail.next;
        }
        return next;
    }
}
const queue = new FixedQueue();
function processTicksAndRejections() {
    let tock;
    do {
        while(tock = queue.shift()){
            try {
                const callback = tock.callback;
                if (tock.args === undefined) {
                    callback();
                } else {
                    const args = tock.args;
                    switch(args.length){
                        case 1:
                            callback(args[0]);
                            break;
                        case 2:
                            callback(args[0], args[1]);
                            break;
                        case 3:
                            callback(args[0], args[1], args[2]);
                            break;
                        case 4:
                            callback(args[0], args[1], args[2], args[3]);
                            break;
                        default:
                            callback(...args);
                    }
                }
            } finally{}
        }
        core.runMicrotasks();
    }while (!queue.isEmpty())
    core.setHasTickScheduled(false);
}
if (typeof core.setNextTickCallback !== "undefined") {
    function runNextTicks() {
        if (!core.hasTickScheduled()) {
            core.runMicrotasks();
        }
        if (!core.hasTickScheduled()) {
            return true;
        }
        processTicksAndRejections();
        return true;
    }
    core.setNextTickCallback(processTicksAndRejections);
    core.setMacrotaskCallback(runNextTicks);
} else {}
var State;
(function(State) {
    State[State["PASSTHROUGH"] = 0] = "PASSTHROUGH";
    State[State["PERCENT"] = 1] = "PERCENT";
    State[State["POSITIONAL"] = 2] = "POSITIONAL";
    State[State["PRECISION"] = 3] = "PRECISION";
    State[State["WIDTH"] = 4] = "WIDTH";
})(State || (State = {}));
var WorP;
(function(WorP) {
    WorP[WorP["WIDTH"] = 0] = "WIDTH";
    WorP[WorP["PRECISION"] = 1] = "PRECISION";
})(WorP || (WorP = {}));
var F;
(function(F) {
    F[F["sign"] = 1] = "sign";
    F[F["mantissa"] = 2] = "mantissa";
    F[F["fractional"] = 3] = "fractional";
    F[F["esign"] = 4] = "esign";
    F[F["exponent"] = 5] = "exponent";
})(F || (F = {}));
const { Deno: Deno1  } = globalThis;
typeof Deno1?.noColor === "boolean" ? Deno1.noColor : true;
new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))", 
].join("|"), "g");
var DiffType;
(function(DiffType) {
    DiffType["removed"] = "removed";
    DiffType["common"] = "common";
    DiffType["added"] = "added";
})(DiffType || (DiffType = {}));
class AssertionError extends Error {
    name = "AssertionError";
    constructor(message){
        super(message);
    }
}
function unreachable() {
    throw new AssertionError("unreachable");
}
class DenoStdInternalError1 extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert1(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError1(msg);
    }
}
function indexOfNeedle(source, needle, start = 0) {
    if (start >= source.length) {
        return -1;
    }
    if (start < 0) {
        start = Math.max(0, source.length + start);
    }
    const s = needle[0];
    for(let i = start; i < source.length; i++){
        if (source[i] !== s) continue;
        const pin = i;
        let matched = 1;
        let j = i;
        while(matched < needle.length){
            j++;
            if (source[j] !== needle[j - pin]) {
                break;
            }
            matched++;
        }
        if (matched === needle.length) {
            return pin;
        }
    }
    return -1;
}
function copy(src, dst, off = 0) {
    off = Math.max(0, Math.min(off, dst.byteLength));
    const dstBytesAvailable = dst.byteLength - off;
    if (src.byteLength > dstBytesAvailable) {
        src = src.subarray(0, dstBytesAvailable);
    }
    dst.set(src, off);
    return src.byteLength;
}
const MIN_BUF_SIZE = 16;
const CR = "\r".charCodeAt(0);
const LF = "\n".charCodeAt(0);
class BufferFullError extends Error {
    name;
    constructor(partial){
        super("Buffer full");
        this.partial = partial;
        this.name = "BufferFullError";
    }
    partial;
}
class PartialReadError extends Error {
    name = "PartialReadError";
    partial;
    constructor(){
        super("Encountered UnexpectedEof, data only partially read");
    }
}
class BufReader {
    #buf;
    #rd;
    #r = 0;
    #w = 0;
    #eof = false;
    static create(r, size = 4096) {
        return r instanceof BufReader ? r : new BufReader(r, size);
    }
    constructor(rd, size = 4096){
        if (size < 16) {
            size = MIN_BUF_SIZE;
        }
        this.#reset(new Uint8Array(size), rd);
    }
    size() {
        return this.#buf.byteLength;
    }
    buffered() {
        return this.#w - this.#r;
    }
    #fill = async ()=>{
        if (this.#r > 0) {
            this.#buf.copyWithin(0, this.#r, this.#w);
            this.#w -= this.#r;
            this.#r = 0;
        }
        if (this.#w >= this.#buf.byteLength) {
            throw Error("bufio: tried to fill full buffer");
        }
        for(let i = 100; i > 0; i--){
            const rr = await this.#rd.read(this.#buf.subarray(this.#w));
            if (rr === null) {
                this.#eof = true;
                return;
            }
            assert1(rr >= 0, "negative read");
            this.#w += rr;
            if (rr > 0) {
                return;
            }
        }
        throw new Error(`No progress after ${100} read() calls`);
    };
    reset(r) {
        this.#reset(this.#buf, r);
    }
    #reset = (buf, rd)=>{
        this.#buf = buf;
        this.#rd = rd;
        this.#eof = false;
    };
    async read(p) {
        let rr = p.byteLength;
        if (p.byteLength === 0) return rr;
        if (this.#r === this.#w) {
            if (p.byteLength >= this.#buf.byteLength) {
                const rr1 = await this.#rd.read(p);
                const nread = rr1 ?? 0;
                assert1(nread >= 0, "negative read");
                return rr1;
            }
            this.#r = 0;
            this.#w = 0;
            rr = await this.#rd.read(this.#buf);
            if (rr === 0 || rr === null) return rr;
            assert1(rr >= 0, "negative read");
            this.#w += rr;
        }
        const copied = copy(this.#buf.subarray(this.#r, this.#w), p, 0);
        this.#r += copied;
        return copied;
    }
    async readFull(p) {
        let bytesRead = 0;
        while(bytesRead < p.length){
            try {
                const rr = await this.read(p.subarray(bytesRead));
                if (rr === null) {
                    if (bytesRead === 0) {
                        return null;
                    } else {
                        throw new PartialReadError();
                    }
                }
                bytesRead += rr;
            } catch (err) {
                if (err instanceof PartialReadError) {
                    err.partial = p.subarray(0, bytesRead);
                } else if (err instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = p.subarray(0, bytesRead);
                    e.stack = err.stack;
                    e.message = err.message;
                    e.cause = err.cause;
                    throw err;
                }
                throw err;
            }
        }
        return p;
    }
    async readByte() {
        while(this.#r === this.#w){
            if (this.#eof) return null;
            await this.#fill();
        }
        const c = this.#buf[this.#r];
        this.#r++;
        return c;
    }
    async readString(delim) {
        if (delim.length !== 1) {
            throw new Error("Delimiter should be a single character");
        }
        const buffer = await this.readSlice(delim.charCodeAt(0));
        if (buffer === null) return null;
        return new TextDecoder().decode(buffer);
    }
    async readLine() {
        let line = null;
        try {
            line = await this.readSlice(LF);
        } catch (err) {
            if (err instanceof Deno.errors.BadResource) {
                throw err;
            }
            let partial;
            if (err instanceof PartialReadError) {
                partial = err.partial;
                assert1(partial instanceof Uint8Array, "bufio: caught error from `readSlice()` without `partial` property");
            }
            if (!(err instanceof BufferFullError)) {
                throw err;
            }
            partial = err.partial;
            if (!this.#eof && partial && partial.byteLength > 0 && partial[partial.byteLength - 1] === CR) {
                assert1(this.#r > 0, "bufio: tried to rewind past start of buffer");
                this.#r--;
                partial = partial.subarray(0, partial.byteLength - 1);
            }
            if (partial) {
                return {
                    line: partial,
                    more: !this.#eof
                };
            }
        }
        if (line === null) {
            return null;
        }
        if (line.byteLength === 0) {
            return {
                line,
                more: false
            };
        }
        if (line[line.byteLength - 1] == LF) {
            let drop = 1;
            if (line.byteLength > 1 && line[line.byteLength - 2] === CR) {
                drop = 2;
            }
            line = line.subarray(0, line.byteLength - drop);
        }
        return {
            line,
            more: false
        };
    }
    async readSlice(delim) {
        let s = 0;
        let slice;
        while(true){
            let i = this.#buf.subarray(this.#r + s, this.#w).indexOf(delim);
            if (i >= 0) {
                i += s;
                slice = this.#buf.subarray(this.#r, this.#r + i + 1);
                this.#r += i + 1;
                break;
            }
            if (this.#eof) {
                if (this.#r === this.#w) {
                    return null;
                }
                slice = this.#buf.subarray(this.#r, this.#w);
                this.#r = this.#w;
                break;
            }
            if (this.buffered() >= this.#buf.byteLength) {
                this.#r = this.#w;
                const oldbuf = this.#buf;
                const newbuf = this.#buf.slice(0);
                this.#buf = newbuf;
                throw new BufferFullError(oldbuf);
            }
            s = this.#w - this.#r;
            try {
                await this.#fill();
            } catch (err) {
                if (err instanceof PartialReadError) {
                    err.partial = slice;
                } else if (err instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = slice;
                    e.stack = err.stack;
                    e.message = err.message;
                    e.cause = err.cause;
                    throw err;
                }
                throw err;
            }
        }
        return slice;
    }
    async peek(n) {
        if (n < 0) {
            throw Error("negative count");
        }
        let avail = this.#w - this.#r;
        while(avail < n && avail < this.#buf.byteLength && !this.#eof){
            try {
                await this.#fill();
            } catch (err) {
                if (err instanceof PartialReadError) {
                    err.partial = this.#buf.subarray(this.#r, this.#w);
                } else if (err instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = this.#buf.subarray(this.#r, this.#w);
                    e.stack = err.stack;
                    e.message = err.message;
                    e.cause = err.cause;
                    throw err;
                }
                throw err;
            }
            avail = this.#w - this.#r;
        }
        if (avail === 0 && this.#eof) {
            return null;
        } else if (avail < n && this.#eof) {
            return this.#buf.subarray(this.#r, this.#r + avail);
        } else if (avail < n) {
            throw new BufferFullError(this.#buf.subarray(this.#r, this.#w));
        }
        return this.#buf.subarray(this.#r, this.#r + n);
    }
}
class AbstractBufBase {
    buf;
    usedBufferBytes = 0;
    err = null;
    constructor(buf){
        this.buf = buf;
    }
    size() {
        return this.buf.byteLength;
    }
    available() {
        return this.buf.byteLength - this.usedBufferBytes;
    }
    buffered() {
        return this.usedBufferBytes;
    }
}
class BufWriter extends AbstractBufBase {
    #writer;
    static create(writer, size = 4096) {
        return writer instanceof BufWriter ? writer : new BufWriter(writer, size);
    }
    constructor(writer, size = 4096){
        super(new Uint8Array(size <= 0 ? 4096 : size));
        this.#writer = writer;
    }
    reset(w) {
        this.err = null;
        this.usedBufferBytes = 0;
        this.#writer = w;
    }
    async flush() {
        if (this.err !== null) throw this.err;
        if (this.usedBufferBytes === 0) return;
        try {
            const p = this.buf.subarray(0, this.usedBufferBytes);
            let nwritten = 0;
            while(nwritten < p.length){
                nwritten += await this.#writer.write(p.subarray(nwritten));
            }
        } catch (e) {
            if (e instanceof Error) {
                this.err = e;
            }
            throw e;
        }
        this.buf = new Uint8Array(this.buf.length);
        this.usedBufferBytes = 0;
    }
    async write(data) {
        if (this.err !== null) throw this.err;
        if (data.length === 0) return 0;
        let totalBytesWritten = 0;
        let numBytesWritten = 0;
        while(data.byteLength > this.available()){
            if (this.buffered() === 0) {
                try {
                    numBytesWritten = await this.#writer.write(data);
                } catch (e) {
                    if (e instanceof Error) {
                        this.err = e;
                    }
                    throw e;
                }
            } else {
                numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
                this.usedBufferBytes += numBytesWritten;
                await this.flush();
            }
            totalBytesWritten += numBytesWritten;
            data = data.subarray(numBytesWritten);
        }
        numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        totalBytesWritten += numBytesWritten;
        return totalBytesWritten;
    }
}
class BufWriterSync extends AbstractBufBase {
    #writer;
    static create(writer, size = 4096) {
        return writer instanceof BufWriterSync ? writer : new BufWriterSync(writer, size);
    }
    constructor(writer, size = 4096){
        super(new Uint8Array(size <= 0 ? 4096 : size));
        this.#writer = writer;
    }
    reset(w) {
        this.err = null;
        this.usedBufferBytes = 0;
        this.#writer = w;
    }
    flush() {
        if (this.err !== null) throw this.err;
        if (this.usedBufferBytes === 0) return;
        try {
            const p = this.buf.subarray(0, this.usedBufferBytes);
            let nwritten = 0;
            while(nwritten < p.length){
                nwritten += this.#writer.writeSync(p.subarray(nwritten));
            }
        } catch (e) {
            if (e instanceof Error) {
                this.err = e;
            }
            throw e;
        }
        this.buf = new Uint8Array(this.buf.length);
        this.usedBufferBytes = 0;
    }
    writeSync(data) {
        if (this.err !== null) throw this.err;
        if (data.length === 0) return 0;
        let totalBytesWritten = 0;
        let numBytesWritten = 0;
        while(data.byteLength > this.available()){
            if (this.buffered() === 0) {
                try {
                    numBytesWritten = this.#writer.writeSync(data);
                } catch (e) {
                    if (e instanceof Error) {
                        this.err = e;
                    }
                    throw e;
                }
            } else {
                numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
                this.usedBufferBytes += numBytesWritten;
                this.flush();
            }
            totalBytesWritten += numBytesWritten;
            data = data.subarray(numBytesWritten);
        }
        numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        totalBytesWritten += numBytesWritten;
        return totalBytesWritten;
    }
}
TextDecoder;
TextEncoder;
const isNumericLookup = {};
function isArrayIndex(value) {
    switch(typeof value){
        case "number":
            return value >= 0 && (value | 0) === value;
        case "string":
            {
                const result = isNumericLookup[value];
                if (result !== void 0) {
                    return result;
                }
                const length = value.length;
                if (length === 0) {
                    return isNumericLookup[value] = false;
                }
                let ch = 0;
                let i = 0;
                for(; i < length; ++i){
                    ch = value.charCodeAt(i);
                    if (i === 0 && ch === 0x30 && length > 1 || ch < 0x30 || ch > 0x39) {
                        return isNumericLookup[value] = false;
                    }
                }
                return isNumericLookup[value] = true;
            }
        default:
            return false;
    }
}
function getOwnNonIndexProperties(obj, filter) {
    let allProperties = [
        ...Object.getOwnPropertyNames(obj),
        ...Object.getOwnPropertySymbols(obj), 
    ];
    if (Array.isArray(obj)) {
        allProperties = allProperties.filter((k)=>!isArrayIndex(k));
    }
    if (filter === 0) {
        return allProperties;
    }
    const result = [];
    for (const key of allProperties){
        const desc = Object.getOwnPropertyDescriptor(obj, key);
        if (desc === undefined) {
            continue;
        }
        if (filter & 1 && !desc.writable) {
            continue;
        }
        if (filter & 2 && !desc.enumerable) {
            continue;
        }
        if (filter & 4 && !desc.configurable) {
            continue;
        }
        if (filter & 8 && typeof key === "string") {
            continue;
        }
        if (filter & 16 && typeof key === "symbol") {
            continue;
        }
        result.push(key);
    }
    return result;
}
const kObjectType = 0;
const kArrayExtrasType = 2;
const kRejected = 2;
const meta = [
    '\\x00',
    '\\x01',
    '\\x02',
    '\\x03',
    '\\x04',
    '\\x05',
    '\\x06',
    '\\x07',
    '\\b',
    '\\t',
    '\\n',
    '\\x0B',
    '\\f',
    '\\r',
    '\\x0E',
    '\\x0F',
    '\\x10',
    '\\x11',
    '\\x12',
    '\\x13',
    '\\x14',
    '\\x15',
    '\\x16',
    '\\x17',
    '\\x18',
    '\\x19',
    '\\x1A',
    '\\x1B',
    '\\x1C',
    '\\x1D',
    '\\x1E',
    '\\x1F',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    "\\'",
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '\\\\',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '\\x7F',
    '\\x80',
    '\\x81',
    '\\x82',
    '\\x83',
    '\\x84',
    '\\x85',
    '\\x86',
    '\\x87',
    '\\x88',
    '\\x89',
    '\\x8A',
    '\\x8B',
    '\\x8C',
    '\\x8D',
    '\\x8E',
    '\\x8F',
    '\\x90',
    '\\x91',
    '\\x92',
    '\\x93',
    '\\x94',
    '\\x95',
    '\\x96',
    '\\x97',
    '\\x98',
    '\\x99',
    '\\x9A',
    '\\x9B',
    '\\x9C',
    '\\x9D',
    '\\x9E',
    '\\x9F'
];
const isUndetectableObject = (v)=>typeof v === "undefined" && v !== undefined;
const strEscapeSequencesRegExp = /[\x00-\x1f\x27\x5c\x7f-\x9f]/;
const strEscapeSequencesReplacer = /[\x00-\x1f\x27\x5c\x7f-\x9f]/g;
const strEscapeSequencesRegExpSingle = /[\x00-\x1f\x5c\x7f-\x9f]/;
const strEscapeSequencesReplacerSingle = /[\x00-\x1f\x5c\x7f-\x9f]/g;
const keyStrRegExp = /^[a-zA-Z_][a-zA-Z_0-9]*$/;
const numberRegExp = /^(0|[1-9][0-9]*)$/;
const nodeModulesRegExp = /[/\\]node_modules[/\\](.+?)(?=[/\\])/g;
const classRegExp = /^(\s+[^(]*?)\s*{/;
const stripCommentsRegExp = /(\/\/.*?\n)|(\/\*(.|\n)*?\*\/)/g;
const inspectDefaultOptions = {
    showHidden: false,
    depth: 2,
    colors: false,
    customInspect: true,
    showProxy: false,
    maxArrayLength: 100,
    maxStringLength: 10000,
    breakLength: 80,
    compact: 3,
    sorted: false,
    getters: false
};
function getUserOptions(ctx, isCrossContext) {
    const ret = {
        stylize: ctx.stylize,
        showHidden: ctx.showHidden,
        depth: ctx.depth,
        colors: ctx.colors,
        customInspect: ctx.customInspect,
        showProxy: ctx.showProxy,
        maxArrayLength: ctx.maxArrayLength,
        maxStringLength: ctx.maxStringLength,
        breakLength: ctx.breakLength,
        compact: ctx.compact,
        sorted: ctx.sorted,
        getters: ctx.getters,
        ...ctx.userOptions
    };
    if (isCrossContext) {
        Object.setPrototypeOf(ret, null);
        for (const key of Object.keys(ret)){
            if ((typeof ret[key] === "object" || typeof ret[key] === "function") && ret[key] !== null) {
                delete ret[key];
            }
        }
        ret.stylize = Object.setPrototypeOf((value, flavour)=>{
            let stylized;
            try {
                stylized = `${ctx.stylize(value, flavour)}`;
            } catch  {}
            if (typeof stylized !== "string") return value;
            return stylized;
        }, null);
    }
    return ret;
}
function inspect(value, opts) {
    const ctx = {
        budget: {},
        indentationLvl: 0,
        seen: [],
        currentDepth: 0,
        stylize: stylizeNoColor,
        showHidden: inspectDefaultOptions.showHidden,
        depth: inspectDefaultOptions.depth,
        colors: inspectDefaultOptions.colors,
        customInspect: inspectDefaultOptions.customInspect,
        showProxy: inspectDefaultOptions.showProxy,
        maxArrayLength: inspectDefaultOptions.maxArrayLength,
        maxStringLength: inspectDefaultOptions.maxStringLength,
        breakLength: inspectDefaultOptions.breakLength,
        compact: inspectDefaultOptions.compact,
        sorted: inspectDefaultOptions.sorted,
        getters: inspectDefaultOptions.getters
    };
    if (arguments.length > 1) {
        if (arguments.length > 2) {
            if (arguments[2] !== undefined) {
                ctx.depth = arguments[2];
            }
            if (arguments.length > 3 && arguments[3] !== undefined) {
                ctx.colors = arguments[3];
            }
        }
        if (typeof opts === "boolean") {
            ctx.showHidden = opts;
        } else if (opts) {
            const optKeys = Object.keys(opts);
            for(let i = 0; i < optKeys.length; ++i){
                const key = optKeys[i];
                if (inspectDefaultOptions.hasOwnProperty(key) || key === "stylize") {
                    ctx[key] = opts[key];
                } else if (ctx.userOptions === undefined) {
                    ctx.userOptions = opts;
                }
            }
        }
    }
    if (ctx.colors) ctx.stylize = stylizeWithColor;
    if (ctx.maxArrayLength === null) ctx.maxArrayLength = Infinity;
    if (ctx.maxStringLength === null) ctx.maxStringLength = Infinity;
    return formatValue(ctx, value, 0);
}
const customInspectSymbol = Symbol.for("nodejs.util.inspect.custom");
inspect.custom = customInspectSymbol;
Object.defineProperty(inspect, "defaultOptions", {
    get () {
        return inspectDefaultOptions;
    },
    set (options) {
        validateObject(options, "options");
        return Object.assign(inspectDefaultOptions, options);
    }
});
const defaultFG = 39;
const defaultBG = 49;
inspect.colors = Object.assign(Object.create(null), {
    reset: [
        0,
        0
    ],
    bold: [
        1,
        22
    ],
    dim: [
        2,
        22
    ],
    italic: [
        3,
        23
    ],
    underline: [
        4,
        24
    ],
    blink: [
        5,
        25
    ],
    inverse: [
        7,
        27
    ],
    hidden: [
        8,
        28
    ],
    strikethrough: [
        9,
        29
    ],
    doubleunderline: [
        21,
        24
    ],
    black: [
        30,
        defaultFG
    ],
    red: [
        31,
        defaultFG
    ],
    green: [
        32,
        defaultFG
    ],
    yellow: [
        33,
        defaultFG
    ],
    blue: [
        34,
        defaultFG
    ],
    magenta: [
        35,
        defaultFG
    ],
    cyan: [
        36,
        defaultFG
    ],
    white: [
        37,
        defaultFG
    ],
    bgBlack: [
        40,
        defaultBG
    ],
    bgRed: [
        41,
        defaultBG
    ],
    bgGreen: [
        42,
        defaultBG
    ],
    bgYellow: [
        43,
        defaultBG
    ],
    bgBlue: [
        44,
        defaultBG
    ],
    bgMagenta: [
        45,
        defaultBG
    ],
    bgCyan: [
        46,
        defaultBG
    ],
    bgWhite: [
        47,
        defaultBG
    ],
    framed: [
        51,
        54
    ],
    overlined: [
        53,
        55
    ],
    gray: [
        90,
        defaultFG
    ],
    redBright: [
        91,
        defaultFG
    ],
    greenBright: [
        92,
        defaultFG
    ],
    yellowBright: [
        93,
        defaultFG
    ],
    blueBright: [
        94,
        defaultFG
    ],
    magentaBright: [
        95,
        defaultFG
    ],
    cyanBright: [
        96,
        defaultFG
    ],
    whiteBright: [
        97,
        defaultFG
    ],
    bgGray: [
        100,
        defaultBG
    ],
    bgRedBright: [
        101,
        defaultBG
    ],
    bgGreenBright: [
        102,
        defaultBG
    ],
    bgYellowBright: [
        103,
        defaultBG
    ],
    bgBlueBright: [
        104,
        defaultBG
    ],
    bgMagentaBright: [
        105,
        defaultBG
    ],
    bgCyanBright: [
        106,
        defaultBG
    ],
    bgWhiteBright: [
        107,
        defaultBG
    ]
});
function defineColorAlias(target, alias) {
    Object.defineProperty(inspect.colors, alias, {
        get () {
            return this[target];
        },
        set (value) {
            this[target] = value;
        },
        configurable: true,
        enumerable: false
    });
}
defineColorAlias("gray", "grey");
defineColorAlias("gray", "blackBright");
defineColorAlias("bgGray", "bgGrey");
defineColorAlias("bgGray", "bgBlackBright");
defineColorAlias("dim", "faint");
defineColorAlias("strikethrough", "crossedout");
defineColorAlias("strikethrough", "strikeThrough");
defineColorAlias("strikethrough", "crossedOut");
defineColorAlias("hidden", "conceal");
defineColorAlias("inverse", "swapColors");
defineColorAlias("inverse", "swapcolors");
defineColorAlias("doubleunderline", "doubleUnderline");
inspect.styles = Object.assign(Object.create(null), {
    special: "cyan",
    number: "yellow",
    bigint: "yellow",
    boolean: "yellow",
    undefined: "grey",
    null: "bold",
    string: "green",
    symbol: "green",
    date: "magenta",
    regexp: "red",
    module: "underline"
});
function addQuotes(str, quotes) {
    if (quotes === -1) {
        return `"${str}"`;
    }
    if (quotes === -2) {
        return `\`${str}\``;
    }
    return `'${str}'`;
}
const escapeFn = (str)=>meta[str.charCodeAt(0)];
function strEscape(str) {
    let escapeTest = strEscapeSequencesRegExp;
    let escapeReplace = strEscapeSequencesReplacer;
    let singleQuote = 39;
    if (str.includes("'")) {
        if (!str.includes('"')) {
            singleQuote = -1;
        } else if (!str.includes("`") && !str.includes("${")) {
            singleQuote = -2;
        }
        if (singleQuote !== 39) {
            escapeTest = strEscapeSequencesRegExpSingle;
            escapeReplace = strEscapeSequencesReplacerSingle;
        }
    }
    if (str.length < 5000 && !escapeTest.test(str)) {
        return addQuotes(str, singleQuote);
    }
    if (str.length > 100) {
        str = str.replace(escapeReplace, escapeFn);
        return addQuotes(str, singleQuote);
    }
    let result = "";
    let last = 0;
    const lastIndex = str.length;
    for(let i = 0; i < lastIndex; i++){
        const point = str.charCodeAt(i);
        if (point === singleQuote || point === 92 || point < 32 || point > 126 && point < 160) {
            if (last === i) {
                result += meta[point];
            } else {
                result += `${str.slice(last, i)}${meta[point]}`;
            }
            last = i + 1;
        }
    }
    if (last !== lastIndex) {
        result += str.slice(last);
    }
    return addQuotes(result, singleQuote);
}
function stylizeWithColor(str, styleType) {
    const style = inspect.styles[styleType];
    if (style !== undefined) {
        const color = inspect.colors[style];
        if (color !== undefined) {
            return `\u001b[${color[0]}m${str}\u001b[${color[1]}m`;
        }
    }
    return str;
}
function stylizeNoColor(str) {
    return str;
}
function formatValue(ctx, value, recurseTimes, typedArray) {
    if (typeof value !== "object" && typeof value !== "function" && !isUndetectableObject(value)) {
        return formatPrimitive(ctx.stylize, value, ctx);
    }
    if (value === null) {
        return ctx.stylize("null", "null");
    }
    const context = value;
    const proxy = undefined;
    if (ctx.customInspect) {
        const maybeCustom = value[customInspectSymbol];
        if (typeof maybeCustom === "function" && maybeCustom !== inspect && !(value.constructor && value.constructor.prototype === value)) {
            const depth = ctx.depth === null ? null : ctx.depth - recurseTimes;
            const isCrossContext = proxy !== undefined || !(context instanceof Object);
            const ret = maybeCustom.call(context, depth, getUserOptions(ctx, isCrossContext));
            if (ret !== context) {
                if (typeof ret !== "string") {
                    return formatValue(ctx, ret, recurseTimes);
                }
                return ret.replace(/\n/g, `\n${" ".repeat(ctx.indentationLvl)}`);
            }
        }
    }
    if (ctx.seen.includes(value)) {
        let index = 1;
        if (ctx.circular === undefined) {
            ctx.circular = new Map();
            ctx.circular.set(value, index);
        } else {
            index = ctx.circular.get(value);
            if (index === undefined) {
                index = ctx.circular.size + 1;
                ctx.circular.set(value, index);
            }
        }
        return ctx.stylize(`[Circular *${index}]`, "special");
    }
    return formatRaw(ctx, value, recurseTimes, typedArray);
}
function formatRaw(ctx, value, recurseTimes, typedArray) {
    let keys;
    let protoProps;
    if (ctx.showHidden && (recurseTimes <= ctx.depth || ctx.depth === null)) {
        protoProps = [];
    }
    const constructor = getConstructorName(value, ctx, recurseTimes, protoProps);
    if (protoProps !== undefined && protoProps.length === 0) {
        protoProps = undefined;
    }
    let tag = value[Symbol.toStringTag];
    if (typeof tag !== "string") {
        tag = "";
    }
    let base = "";
    let formatter = getEmptyFormatArray;
    let braces;
    let noIterator = true;
    let i = 0;
    const filter = ctx.showHidden ? 0 : 2;
    let extrasType = 0;
    if (value[Symbol.iterator] || constructor === null) {
        noIterator = false;
        if (Array.isArray(value)) {
            const prefix = constructor !== "Array" || tag !== "" ? getPrefix(constructor, tag, "Array", `(${value.length})`) : "";
            keys = getOwnNonIndexProperties(value, filter);
            braces = [
                `${prefix}[`,
                "]"
            ];
            if (value.length === 0 && keys.length === 0 && protoProps === undefined) {
                return `${braces[0]}]`;
            }
            extrasType = kArrayExtrasType;
            formatter = formatArray;
        } else if (isSet1(value)) {
            const size = value.size;
            const prefix1 = getPrefix(constructor, tag, "Set", `(${size})`);
            keys = getKeys(value, ctx.showHidden);
            formatter = constructor !== null ? formatSet.bind(null, value) : formatSet.bind(null, value.values());
            if (size === 0 && keys.length === 0 && protoProps === undefined) {
                return `${prefix1}{}`;
            }
            braces = [
                `${prefix1}{`,
                "}"
            ];
        } else if (isMap1(value)) {
            const size1 = value.size;
            const prefix2 = getPrefix(constructor, tag, "Map", `(${size1})`);
            keys = getKeys(value, ctx.showHidden);
            formatter = constructor !== null ? formatMap.bind(null, value) : formatMap.bind(null, value.entries());
            if (size1 === 0 && keys.length === 0 && protoProps === undefined) {
                return `${prefix2}{}`;
            }
            braces = [
                `${prefix2}{`,
                "}"
            ];
        } else if (isTypedArray(value)) {
            keys = getOwnNonIndexProperties(value, filter);
            const bound = value;
            const fallback = "";
            const size2 = value.length;
            const prefix3 = getPrefix(constructor, tag, fallback, `(${size2})`);
            braces = [
                `${prefix3}[`,
                "]"
            ];
            if (value.length === 0 && keys.length === 0 && !ctx.showHidden) {
                return `${braces[0]}]`;
            }
            formatter = formatTypedArray.bind(null, bound, size2);
            extrasType = kArrayExtrasType;
        } else if (isMapIterator1(value)) {
            keys = getKeys(value, ctx.showHidden);
            braces = getIteratorBraces("Map", tag);
            formatter = formatIterator.bind(null, braces);
        } else if (isSetIterator1(value)) {
            keys = getKeys(value, ctx.showHidden);
            braces = getIteratorBraces("Set", tag);
            formatter = formatIterator.bind(null, braces);
        } else {
            noIterator = true;
        }
    }
    if (noIterator) {
        keys = getKeys(value, ctx.showHidden);
        braces = [
            "{",
            "}"
        ];
        if (constructor === "Object") {
            if (isArgumentsObject1(value)) {
                braces[0] = "[Arguments] {";
            } else if (tag !== "") {
                braces[0] = `${getPrefix(constructor, tag, "Object")}{`;
            }
            if (keys.length === 0 && protoProps === undefined) {
                return `${braces[0]}}`;
            }
        } else if (typeof value === "function") {
            base = getFunctionBase(value, constructor, tag);
            if (keys.length === 0 && protoProps === undefined) {
                return ctx.stylize(base, "special");
            }
        } else if (isRegExp1(value)) {
            base = RegExp(constructor !== null ? value : new RegExp(value)).toString();
            const prefix4 = getPrefix(constructor, tag, "RegExp");
            if (prefix4 !== "RegExp ") {
                base = `${prefix4}${base}`;
            }
            if (keys.length === 0 && protoProps === undefined || recurseTimes > ctx.depth && ctx.depth !== null) {
                return ctx.stylize(base, "regexp");
            }
        } else if (isDate1(value)) {
            base = Number.isNaN(value.getTime()) ? value.toString() : value.toISOString();
            const prefix5 = getPrefix(constructor, tag, "Date");
            if (prefix5 !== "Date ") {
                base = `${prefix5}${base}`;
            }
            if (keys.length === 0 && protoProps === undefined) {
                return ctx.stylize(base, "date");
            }
        } else if (value instanceof Error) {
            base = formatError(value, constructor, tag, ctx, keys);
            if (keys.length === 0 && protoProps === undefined) {
                return base;
            }
        } else if (isAnyArrayBuffer1(value)) {
            const arrayType = isArrayBuffer1(value) ? "ArrayBuffer" : "SharedArrayBuffer";
            const prefix6 = getPrefix(constructor, tag, arrayType);
            if (typedArray === undefined) {
                formatter = formatArrayBuffer;
            } else if (keys.length === 0 && protoProps === undefined) {
                return prefix6 + `{ byteLength: ${formatNumber(ctx.stylize, value.byteLength)} }`;
            }
            braces[0] = `${prefix6}{`;
            Array.prototype.unshift.call(keys, "byteLength");
        } else if (isDataView1(value)) {
            braces[0] = `${getPrefix(constructor, tag, "DataView")}{`;
            Array.prototype.unshift.call(keys, "byteLength", "byteOffset", "buffer");
        } else if (isPromise1(value)) {
            braces[0] = `${getPrefix(constructor, tag, "Promise")}{`;
            formatter = formatPromise;
        } else if (isWeakSet1(value)) {
            braces[0] = `${getPrefix(constructor, tag, "WeakSet")}{`;
            formatter = ctx.showHidden ? formatWeakSet : formatWeakCollection;
        } else if (isWeakMap1(value)) {
            braces[0] = `${getPrefix(constructor, tag, "WeakMap")}{`;
            formatter = ctx.showHidden ? formatWeakMap : formatWeakCollection;
        } else if (isModuleNamespaceObject1(value)) {
            braces[0] = `${getPrefix(constructor, tag, "Module")}{`;
            formatter = formatNamespaceObject.bind(null, keys);
        } else if (isBoxedPrimitive1(value)) {
            base = getBoxedBase(value, ctx, keys, constructor, tag);
            if (keys.length === 0 && protoProps === undefined) {
                return base;
            }
        } else {
            if (keys.length === 0 && protoProps === undefined) {
                return `${getCtxStyle(value, constructor, tag)}{}`;
            }
            braces[0] = `${getCtxStyle(value, constructor, tag)}{`;
        }
    }
    if (recurseTimes > ctx.depth && ctx.depth !== null) {
        let constructorName = getCtxStyle(value, constructor, tag).slice(0, -1);
        if (constructor !== null) {
            constructorName = `[${constructorName}]`;
        }
        return ctx.stylize(constructorName, "special");
    }
    recurseTimes += 1;
    ctx.seen.push(value);
    ctx.currentDepth = recurseTimes;
    let output;
    const indentationLvl = ctx.indentationLvl;
    try {
        output = formatter(ctx, value, recurseTimes);
        for(i = 0; i < keys.length; i++){
            output.push(formatProperty(ctx, value, recurseTimes, keys[i], extrasType));
        }
        if (protoProps !== undefined) {
            output.push(...protoProps);
        }
    } catch (err) {
        const constructorName1 = getCtxStyle(value, constructor, tag).slice(0, -1);
        return handleMaxCallStackSize(ctx, err, constructorName1, indentationLvl);
    }
    if (ctx.circular !== undefined) {
        const index = ctx.circular.get(value);
        if (index !== undefined) {
            const reference = ctx.stylize(`<ref *${index}>`, "special");
            if (ctx.compact !== true) {
                base = base === "" ? reference : `${reference} ${base}`;
            } else {
                braces[0] = `${reference} ${braces[0]}`;
            }
        }
    }
    ctx.seen.pop();
    if (ctx.sorted) {
        const comparator = ctx.sorted === true ? undefined : ctx.sorted;
        if (extrasType === 0) {
            output = output.sort(comparator);
        } else if (keys.length > 1) {
            const sorted = output.slice(output.length - keys.length).sort(comparator);
            output.splice(output.length - keys.length, keys.length, ...sorted);
        }
    }
    const res = reduceToSingleString(ctx, output, base, braces, extrasType, recurseTimes, value);
    const budget = ctx.budget[ctx.indentationLvl] || 0;
    const newLength = budget + res.length;
    ctx.budget[ctx.indentationLvl] = newLength;
    if (newLength > 2 ** 27) {
        ctx.depth = -1;
    }
    return res;
}
const builtInObjects = new Set(Object.getOwnPropertyNames(globalThis).filter((e)=>/^[A-Z][a-zA-Z0-9]+$/.test(e)));
function addPrototypeProperties(ctx, main, obj, recurseTimes, output) {
    let depth = 0;
    let keys;
    let keySet;
    do {
        if (depth !== 0 || main === obj) {
            obj = Object.getPrototypeOf(obj);
            if (obj === null) {
                return;
            }
            const descriptor = Object.getOwnPropertyDescriptor(obj, "constructor");
            if (descriptor !== undefined && typeof descriptor.value === "function" && builtInObjects.has(descriptor.value.name)) {
                return;
            }
        }
        if (depth === 0) {
            keySet = new Set();
        } else {
            Array.prototype.forEach.call(keys, (key)=>keySet.add(key));
        }
        keys = Reflect.ownKeys(obj);
        Array.prototype.push.call(ctx.seen, main);
        for (const key of keys){
            if (key === "constructor" || main.hasOwnProperty(key) || depth !== 0 && keySet.has(key)) {
                continue;
            }
            const desc = Object.getOwnPropertyDescriptor(obj, key);
            if (typeof desc.value === "function") {
                continue;
            }
            const value = formatProperty(ctx, obj, recurseTimes, key, 0, desc, main);
            if (ctx.colors) {
                Array.prototype.push.call(output, `\u001b[2m${value}\u001b[22m`);
            } else {
                Array.prototype.push.call(output, value);
            }
        }
        Array.prototype.pop.call(ctx.seen);
    }while (++depth !== 3)
}
function getConstructorName(obj, ctx, recurseTimes, protoProps) {
    let firstProto;
    const tmp = obj;
    while(obj || isUndetectableObject(obj)){
        const descriptor = Object.getOwnPropertyDescriptor(obj, "constructor");
        if (descriptor !== undefined && typeof descriptor.value === "function" && descriptor.value.name !== "" && isInstanceof(tmp, descriptor.value)) {
            if (protoProps !== undefined && (firstProto !== obj || !builtInObjects.has(descriptor.value.name))) {
                addPrototypeProperties(ctx, tmp, firstProto || tmp, recurseTimes, protoProps);
            }
            return descriptor.value.name;
        }
        obj = Object.getPrototypeOf(obj);
        if (firstProto === undefined) {
            firstProto = obj;
        }
    }
    if (firstProto === null) {
        return null;
    }
    const res = undefined;
    if (recurseTimes > ctx.depth && ctx.depth !== null) {
        return `${res} <Complex prototype>`;
    }
    const protoConstr = getConstructorName(firstProto, ctx, recurseTimes + 1, protoProps);
    if (protoConstr === null) {
        return `${res} <${inspect(firstProto, {
            ...ctx,
            customInspect: false,
            depth: -1
        })}>`;
    }
    return `${res} <${protoConstr}>`;
}
function formatPrimitive(fn, value, ctx) {
    if (typeof value === "string") {
        let trailer = "";
        if (value.length > ctx.maxStringLength) {
            const remaining = value.length - ctx.maxStringLength;
            value = value.slice(0, ctx.maxStringLength);
            trailer = `... ${remaining} more character${remaining > 1 ? "s" : ""}`;
        }
        if (ctx.compact !== true && value.length > 16 && value.length > ctx.breakLength - ctx.indentationLvl - 4) {
            return value.split(/(?<=\n)/).map((line)=>fn(strEscape(line), "string")).join(` +\n${" ".repeat(ctx.indentationLvl + 2)}`) + trailer;
        }
        return fn(strEscape(value), "string") + trailer;
    }
    if (typeof value === "number") {
        return formatNumber(fn, value);
    }
    if (typeof value === "bigint") {
        return formatBigInt(fn, value);
    }
    if (typeof value === "boolean") {
        return fn(`${value}`, "boolean");
    }
    if (typeof value === "undefined") {
        return fn("undefined", "undefined");
    }
    return fn(value.toString(), "symbol");
}
function getEmptyFormatArray() {
    return [];
}
function isInstanceof(object, proto) {
    try {
        return object instanceof proto;
    } catch  {
        return false;
    }
}
function getPrefix(constructor, tag, fallback, size = "") {
    if (constructor === null) {
        if (tag !== "" && fallback !== tag) {
            return `[${fallback}${size}: null prototype] [${tag}] `;
        }
        return `[${fallback}${size}: null prototype] `;
    }
    if (tag !== "" && constructor !== tag) {
        return `${constructor}${size} [${tag}] `;
    }
    return `${constructor}${size} `;
}
function formatArray(ctx, value, recurseTimes) {
    const valLen = value.length;
    const len = Math.min(Math.max(0, ctx.maxArrayLength), valLen);
    const remaining = valLen - len;
    const output = [];
    for(let i = 0; i < len; i++){
        if (!value.hasOwnProperty(i)) {
            return formatSpecialArray(ctx, value, recurseTimes, len, output, i);
        }
        output.push(formatProperty(ctx, value, recurseTimes, i, 1));
    }
    if (remaining > 0) {
        output.push(`... ${remaining} more item${remaining > 1 ? "s" : ""}`);
    }
    return output;
}
function getCtxStyle(_value, constructor, tag) {
    let fallback = "";
    if (constructor === null) {
        if (fallback === tag) {
            fallback = "Object";
        }
    }
    return getPrefix(constructor, tag, fallback);
}
function getKeys(value, showHidden) {
    let keys;
    const symbols = Object.getOwnPropertySymbols(value);
    if (showHidden) {
        keys = Object.getOwnPropertyNames(value);
        if (symbols.length !== 0) {
            Array.prototype.push.apply(keys, symbols);
        }
    } else {
        try {
            keys = Object.keys(value);
        } catch (_err) {
            keys = Object.getOwnPropertyNames(value);
        }
        if (symbols.length !== 0) {}
    }
    return keys;
}
function formatSet(value, ctx, _ignored, recurseTimes) {
    const output = [];
    ctx.indentationLvl += 2;
    for (const v of value){
        Array.prototype.push.call(output, formatValue(ctx, v, recurseTimes));
    }
    ctx.indentationLvl -= 2;
    return output;
}
function formatMap(value, ctx, _gnored, recurseTimes) {
    const output = [];
    ctx.indentationLvl += 2;
    for (const { 0: k , 1: v  } of value){
        output.push(`${formatValue(ctx, k, recurseTimes)} => ${formatValue(ctx, v, recurseTimes)}`);
    }
    ctx.indentationLvl -= 2;
    return output;
}
function formatTypedArray(value, length, ctx, _ignored, recurseTimes) {
    const maxLength = Math.min(Math.max(0, ctx.maxArrayLength), length);
    const remaining = value.length - maxLength;
    const output = new Array(maxLength);
    const elementFormatter = value.length > 0 && typeof value[0] === "number" ? formatNumber : formatBigInt;
    for(let i = 0; i < maxLength; ++i){
        output[i] = elementFormatter(ctx.stylize, value[i]);
    }
    if (remaining > 0) {
        output[maxLength] = `... ${remaining} more item${remaining > 1 ? "s" : ""}`;
    }
    if (ctx.showHidden) {
        ctx.indentationLvl += 2;
        for (const key of [
            "BYTES_PER_ELEMENT",
            "length",
            "byteLength",
            "byteOffset",
            "buffer", 
        ]){
            const str = formatValue(ctx, value[key], recurseTimes, true);
            Array.prototype.push.call(output, `[${key}]: ${str}`);
        }
        ctx.indentationLvl -= 2;
    }
    return output;
}
function getIteratorBraces(type, tag) {
    if (tag !== `${type} Iterator`) {
        if (tag !== "") {
            tag += "] [";
        }
        tag += `${type} Iterator`;
    }
    return [
        `[${tag}] {`,
        "}"
    ];
}
function formatIterator(braces, ctx, value, recurseTimes) {
    const { 0: entries , 1: isKeyValue  } = value;
    if (isKeyValue) {
        braces[0] = braces[0].replace(/ Iterator] {$/, " Entries] {");
        return formatMapIterInner(ctx, recurseTimes, entries, 2);
    }
    return formatSetIterInner(ctx, recurseTimes, entries, 1);
}
function getFunctionBase(value, constructor, tag) {
    const stringified = Function.prototype.toString.call(value);
    if (stringified.slice(0, 5) === "class" && stringified.endsWith("}")) {
        const slice = stringified.slice(5, -1);
        const bracketIndex = slice.indexOf("{");
        if (bracketIndex !== -1 && (!slice.slice(0, bracketIndex).includes("(") || classRegExp.test(slice.replace(stripCommentsRegExp)))) {
            return getClassBase(value, constructor, tag);
        }
    }
    let type = "Function";
    if (isGeneratorFunction1(value)) {
        type = `Generator${type}`;
    }
    if (isAsyncFunction1(value)) {
        type = `Async${type}`;
    }
    let base = `[${type}`;
    if (constructor === null) {
        base += " (null prototype)";
    }
    if (value.name === "") {
        base += " (anonymous)";
    } else {
        base += `: ${value.name}`;
    }
    base += "]";
    if (constructor !== type && constructor !== null) {
        base += ` ${constructor}`;
    }
    if (tag !== "" && constructor !== tag) {
        base += ` [${tag}]`;
    }
    return base;
}
function formatError(err, constructor, tag, ctx, keys) {
    const name = err.name != null ? String(err.name) : "Error";
    let len = name.length;
    let stack = err.stack ? String(err.stack) : err.toString();
    if (!ctx.showHidden && keys.length !== 0) {
        for (const name1 of [
            "name",
            "message",
            "stack"
        ]){
            const index = keys.indexOf(name1);
            if (index !== -1 && stack.includes(err[name1])) {
                keys.splice(index, 1);
            }
        }
    }
    if (constructor === null || name.endsWith("Error") && stack.startsWith(name) && (stack.length === len || stack[len] === ":" || stack[len] === "\n")) {
        let fallback = "Error";
        if (constructor === null) {
            const start = stack.match(/^([A-Z][a-z_ A-Z0-9[\]()-]+)(?::|\n {4}at)/) || stack.match(/^([a-z_A-Z0-9-]*Error)$/);
            fallback = start && start[1] || "";
            len = fallback.length;
            fallback = fallback || "Error";
        }
        const prefix = getPrefix(constructor, tag, fallback).slice(0, -1);
        if (name !== prefix) {
            if (prefix.includes(name)) {
                if (len === 0) {
                    stack = `${prefix}: ${stack}`;
                } else {
                    stack = `${prefix}${stack.slice(len)}`;
                }
            } else {
                stack = `${prefix} [${name}]${stack.slice(len)}`;
            }
        }
    }
    let pos = err.message && stack.indexOf(err.message) || -1;
    if (pos !== -1) {
        pos += err.message.length;
    }
    const stackStart = stack.indexOf("\n    at", pos);
    if (stackStart === -1) {
        stack = `[${stack}]`;
    } else if (ctx.colors) {
        let newStack = stack.slice(0, stackStart);
        const lines = stack.slice(stackStart + 1).split("\n");
        for (const line of lines){
            let nodeModule;
            newStack += "\n";
            let pos1 = 0;
            while(nodeModule = nodeModulesRegExp.exec(line)){
                newStack += line.slice(pos1, nodeModule.index + 14);
                newStack += ctx.stylize(nodeModule[1], "module");
                pos1 = nodeModule.index + nodeModule[0].length;
            }
            newStack += pos1 === 0 ? line : line.slice(pos1);
        }
        stack = newStack;
    }
    if (ctx.indentationLvl !== 0) {
        const indentation = " ".repeat(ctx.indentationLvl);
        stack = stack.replace(/\n/g, `\n${indentation}`);
    }
    return stack;
}
let hexSlice;
function formatArrayBuffer(ctx, value) {
    let buffer;
    try {
        buffer = new Uint8Array(value);
    } catch  {
        return [
            ctx.stylize("(detached)", "special")
        ];
    }
    let str = hexSlice(buffer, 0, Math.min(ctx.maxArrayLength, buffer.length)).replace(/(.{2})/g, "$1 ").trim();
    const remaining = buffer.length - ctx.maxArrayLength;
    if (remaining > 0) {
        str += ` ... ${remaining} more byte${remaining > 1 ? "s" : ""}`;
    }
    return [
        `${ctx.stylize("[Uint8Contents]", "special")}: <${str}>`
    ];
}
function formatNumber(fn, value) {
    return fn(Object.is(value, -0) ? "-0" : `${value}`, "number");
}
function formatPromise(ctx, value, recurseTimes) {
    let output;
    const { 0: state , 1: result  } = value;
    if (state === 0) {
        output = [
            ctx.stylize("<pending>", "special")
        ];
    } else {
        ctx.indentationLvl += 2;
        const str = formatValue(ctx, result, recurseTimes);
        ctx.indentationLvl -= 2;
        output = [
            state === kRejected ? `${ctx.stylize("<rejected>", "special")} ${str}` : str, 
        ];
    }
    return output;
}
function formatWeakCollection(ctx) {
    return [
        ctx.stylize("<items unknown>", "special")
    ];
}
function formatWeakSet(ctx, value, recurseTimes) {
    const entries = value;
    return formatSetIterInner(ctx, recurseTimes, entries, 0);
}
function formatWeakMap(ctx, value, recurseTimes) {
    const entries = value;
    return formatMapIterInner(ctx, recurseTimes, entries, 0);
}
function formatProperty(ctx, value, recurseTimes, key, type, desc, original = value) {
    let name, str;
    let extra = " ";
    desc = desc || Object.getOwnPropertyDescriptor(value, key) || {
        value: value[key],
        enumerable: true
    };
    if (desc.value !== undefined) {
        const diff = ctx.compact !== true || type !== 0 ? 2 : 3;
        ctx.indentationLvl += diff;
        str = formatValue(ctx, desc.value, recurseTimes);
        if (diff === 3 && ctx.breakLength < getStringWidth(str, ctx.colors)) {
            extra = `\n${" ".repeat(ctx.indentationLvl)}`;
        }
        ctx.indentationLvl -= diff;
    } else if (desc.get !== undefined) {
        const label = desc.set !== undefined ? "Getter/Setter" : "Getter";
        const s = ctx.stylize;
        const sp = "special";
        if (ctx.getters && (ctx.getters === true || ctx.getters === "get" && desc.set === undefined || ctx.getters === "set" && desc.set !== undefined)) {
            try {
                const tmp = desc.get.call(original);
                ctx.indentationLvl += 2;
                if (tmp === null) {
                    str = `${s(`[${label}:`, sp)} ${s("null", "null")}${s("]", sp)}`;
                } else if (typeof tmp === "object") {
                    str = `${s(`[${label}]`, sp)} ${formatValue(ctx, tmp, recurseTimes)}`;
                } else {
                    const primitive = formatPrimitive(s, tmp, ctx);
                    str = `${s(`[${label}:`, sp)} ${primitive}${s("]", sp)}`;
                }
                ctx.indentationLvl -= 2;
            } catch (err) {
                const message = `<Inspection threw (${err.message})>`;
                str = `${s(`[${label}:`, sp)} ${message}${s("]", sp)}`;
            }
        } else {
            str = ctx.stylize(`[${label}]`, sp);
        }
    } else if (desc.set !== undefined) {
        str = ctx.stylize("[Setter]", "special");
    } else {
        str = ctx.stylize("undefined", "undefined");
    }
    if (type === 1) {
        return str;
    }
    if (typeof key === "symbol") {
        const tmp1 = key.toString().replace(strEscapeSequencesReplacer, escapeFn);
        name = `[${ctx.stylize(tmp1, "symbol")}]`;
    } else if (key === "__proto__") {
        name = "['__proto__']";
    } else if (desc.enumerable === false) {
        const tmp2 = key.replace(strEscapeSequencesReplacer, escapeFn);
        name = `[${tmp2}]`;
    } else if (keyStrRegExp.test(key)) {
        name = ctx.stylize(key, "name");
    } else {
        name = ctx.stylize(strEscape(key), "string");
    }
    return `${name}:${extra}${str}`;
}
function handleMaxCallStackSize(_ctx, _err, _constructorName, _indentationLvl) {}
const colorRegExp = /\u001b\[\d\d?m/g;
function removeColors(str) {
    return str.replace(colorRegExp, "");
}
function isBelowBreakLength(ctx, output, start, base) {
    let totalLength = output.length + start;
    if (totalLength + output.length > ctx.breakLength) {
        return false;
    }
    for(let i = 0; i < output.length; i++){
        if (ctx.colors) {
            totalLength += removeColors(output[i]).length;
        } else {
            totalLength += output[i].length;
        }
        if (totalLength > ctx.breakLength) {
            return false;
        }
    }
    return base === "" || !base.includes("\n");
}
function formatBigInt(fn, value) {
    return fn(`${value}n`, "bigint");
}
function formatNamespaceObject(keys, ctx, value, recurseTimes) {
    const output = new Array(keys.length);
    for(let i = 0; i < keys.length; i++){
        try {
            output[i] = formatProperty(ctx, value, recurseTimes, keys[i], kObjectType);
        } catch (_err) {
            const tmp = {
                [keys[i]]: ""
            };
            output[i] = formatProperty(ctx, tmp, recurseTimes, keys[i], kObjectType);
            const pos = output[i].lastIndexOf(" ");
            output[i] = output[i].slice(0, pos + 1) + ctx.stylize("<uninitialized>", "special");
        }
    }
    keys.length = 0;
    return output;
}
function formatSpecialArray(ctx, value, recurseTimes, maxLength, output, i) {
    const keys = Object.keys(value);
    let index = i;
    for(; i < keys.length && output.length < maxLength; i++){
        const key = keys[i];
        const tmp = +key;
        if (tmp > 2 ** 32 - 2) {
            break;
        }
        if (`${index}` !== key) {
            if (!numberRegExp.test(key)) {
                break;
            }
            const emptyItems = tmp - index;
            const ending = emptyItems > 1 ? "s" : "";
            const message = `<${emptyItems} empty item${ending}>`;
            output.push(ctx.stylize(message, "undefined"));
            index = tmp;
            if (output.length === maxLength) {
                break;
            }
        }
        output.push(formatProperty(ctx, value, recurseTimes, key, 1));
        index++;
    }
    const remaining = value.length - index;
    if (output.length !== maxLength) {
        if (remaining > 0) {
            const ending1 = remaining > 1 ? "s" : "";
            const message1 = `<${remaining} empty item${ending1}>`;
            output.push(ctx.stylize(message1, "undefined"));
        }
    } else if (remaining > 0) {
        output.push(`... ${remaining} more item${remaining > 1 ? "s" : ""}`);
    }
    return output;
}
function getBoxedBase(value, ctx, keys, constructor, tag) {
    let type;
    if (isNumberObject1(value)) {
        type = "Number";
    } else if (isStringObject1(value)) {
        type = "String";
        keys.splice(0, value.length);
    } else if (isBooleanObject1(value)) {
        type = "Boolean";
    } else if (isBigIntObject1(value)) {
        type = "BigInt";
    } else {
        type = "Symbol";
    }
    let base = `[${type}`;
    if (type !== constructor) {
        if (constructor === null) {
            base += " (null prototype)";
        } else {
            base += ` (${constructor})`;
        }
    }
    base += `: ${formatPrimitive(stylizeNoColor, value.valueOf(), ctx)}]`;
    if (tag !== "" && tag !== constructor) {
        base += ` [${tag}]`;
    }
    if (keys.length !== 0 || ctx.stylize === stylizeNoColor) {
        return base;
    }
    return ctx.stylize(base, type.toLowerCase());
}
function getClassBase(value, constructor, tag) {
    const hasName = value.hasOwnProperty("name");
    const name = hasName && value.name || "(anonymous)";
    let base = `class ${name}`;
    if (constructor !== "Function" && constructor !== null) {
        base += ` [${constructor}]`;
    }
    if (tag !== "" && constructor !== tag) {
        base += ` [${tag}]`;
    }
    if (constructor !== null) {
        const superName = Object.getPrototypeOf(value).name;
        if (superName) {
            base += ` extends ${superName}`;
        }
    } else {
        base += " extends [null prototype]";
    }
    return `[${base}]`;
}
function reduceToSingleString(ctx, output, base, braces, extrasType, recurseTimes, value) {
    if (ctx.compact !== true) {
        if (typeof ctx.compact === "number" && ctx.compact >= 1) {
            const entries = output.length;
            if (extrasType === 2 && entries > 6) {
                output = groupArrayElements(ctx, output, value);
            }
            if (ctx.currentDepth - recurseTimes < ctx.compact && entries === output.length) {
                const start = output.length + ctx.indentationLvl + braces[0].length + base.length + 10;
                if (isBelowBreakLength(ctx, output, start, base)) {
                    return `${base ? `${base} ` : ""}${braces[0]} ${join4(output, ", ")}` + ` ${braces[1]}`;
                }
            }
        }
        const indentation = `\n${" ".repeat(ctx.indentationLvl)}`;
        return `${base ? `${base} ` : ""}${braces[0]}${indentation}  ` + `${join4(output, `,${indentation}  `)}${indentation}${braces[1]}`;
    }
    if (isBelowBreakLength(ctx, output, 0, base)) {
        return `${braces[0]}${base ? ` ${base}` : ""} ${join4(output, ", ")} ` + braces[1];
    }
    const indentation1 = " ".repeat(ctx.indentationLvl);
    const ln = base === "" && braces[0].length === 1 ? " " : `${base ? ` ${base}` : ""}\n${indentation1}  `;
    return `${braces[0]}${ln}${join4(output, `,\n${indentation1}  `)} ${braces[1]}`;
}
function join4(output, separator) {
    let str = "";
    if (output.length !== 0) {
        const lastIndex = output.length - 1;
        for(let i = 0; i < lastIndex; i++){
            str += output[i];
            str += separator;
        }
        str += output[lastIndex];
    }
    return str;
}
function groupArrayElements(ctx, output, value) {
    let totalLength = 0;
    let maxLength = 0;
    let i = 0;
    let outputLength = output.length;
    if (ctx.maxArrayLength < output.length) {
        outputLength--;
    }
    const separatorSpace = 2;
    const dataLen = new Array(outputLength);
    for(; i < outputLength; i++){
        const len = getStringWidth(output[i], ctx.colors);
        dataLen[i] = len;
        totalLength += len + separatorSpace;
        if (maxLength < len) {
            maxLength = len;
        }
    }
    const actualMax = maxLength + 2;
    if (actualMax * 3 + ctx.indentationLvl < ctx.breakLength && (totalLength / actualMax > 5 || maxLength <= 6)) {
        const averageBias = Math.sqrt(actualMax - totalLength / output.length);
        const biasedMax = Math.max(actualMax - 3 - averageBias, 1);
        const columns = Math.min(Math.round(Math.sqrt(2.5 * biasedMax * outputLength) / biasedMax), Math.floor((ctx.breakLength - ctx.indentationLvl) / actualMax), ctx.compact * 4, 15);
        if (columns <= 1) {
            return output;
        }
        const tmp = [];
        const maxLineLength = [];
        for(let i1 = 0; i1 < columns; i1++){
            let lineMaxLength = 0;
            for(let j = i1; j < output.length; j += columns){
                if (dataLen[j] > lineMaxLength) {
                    lineMaxLength = dataLen[j];
                }
            }
            lineMaxLength += separatorSpace;
            maxLineLength[i1] = lineMaxLength;
        }
        let order = String.prototype.padStart;
        if (value !== undefined) {
            for(let i2 = 0; i2 < output.length; i2++){
                if (typeof value[i2] !== "number" && typeof value[i2] !== "bigint") {
                    order = String.prototype.padEnd;
                    break;
                }
            }
        }
        for(let i3 = 0; i3 < outputLength; i3 += columns){
            const max = Math.min(i3 + columns, outputLength);
            let str = "";
            let j1 = i3;
            for(; j1 < max - 1; j1++){
                const padding = maxLineLength[j1 - i3] + output[j1].length - dataLen[j1];
                str += `${output[j1]}, `.padStart(padding, " ");
            }
            if (order === String.prototype.padStart) {
                const padding1 = maxLineLength[j1 - i3] + output[j1].length - dataLen[j1] - 2;
                str += output[j1].padStart(padding1, " ");
            } else {
                str += output[j1];
            }
            Array.prototype.push.call(tmp, str);
        }
        if (ctx.maxArrayLength < output.length) {
            Array.prototype.push.call(tmp, output[outputLength]);
        }
        output = tmp;
    }
    return output;
}
function formatMapIterInner(ctx, recurseTimes, entries, state) {
    const maxArrayLength = Math.max(ctx.maxArrayLength, 0);
    const len = entries.length / 2;
    const remaining = len - maxArrayLength;
    const maxLength = Math.min(maxArrayLength, len);
    let output = new Array(maxLength);
    let i = 0;
    ctx.indentationLvl += 2;
    if (state === 0) {
        for(; i < maxLength; i++){
            const pos = i * 2;
            output[i] = `${formatValue(ctx, entries[pos], recurseTimes)} => ${formatValue(ctx, entries[pos + 1], recurseTimes)}`;
        }
        if (!ctx.sorted) {
            output = output.sort();
        }
    } else {
        for(; i < maxLength; i++){
            const pos1 = i * 2;
            const res = [
                formatValue(ctx, entries[pos1], recurseTimes),
                formatValue(ctx, entries[pos1 + 1], recurseTimes), 
            ];
            output[i] = reduceToSingleString(ctx, res, "", [
                "[",
                "]"
            ], kArrayExtrasType, recurseTimes);
        }
    }
    ctx.indentationLvl -= 2;
    if (remaining > 0) {
        output.push(`... ${remaining} more item${remaining > 1 ? "s" : ""}`);
    }
    return output;
}
function formatSetIterInner(ctx, recurseTimes, entries, state) {
    const maxArrayLength = Math.max(ctx.maxArrayLength, 0);
    const maxLength = Math.min(maxArrayLength, entries.length);
    const output = new Array(maxLength);
    ctx.indentationLvl += 2;
    for(let i = 0; i < maxLength; i++){
        output[i] = formatValue(ctx, entries[i], recurseTimes);
    }
    ctx.indentationLvl -= 2;
    if (state === 0 && !ctx.sorted) {
        output.sort();
    }
    const remaining = entries.length - maxLength;
    if (remaining > 0) {
        Array.prototype.push.call(output, `... ${remaining} more item${remaining > 1 ? "s" : ""}`);
    }
    return output;
}
const ansiPattern = "[\\u001B\\u009B][[\\]()#;?]*" + "(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*" + "|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)" + "|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))";
const ansi = new RegExp(ansiPattern, "g");
function getStringWidth(str, removeControlChars = true) {
    let width = 0;
    if (removeControlChars) {
        str = stripVTControlCharacters(str);
    }
    str = str.normalize("NFC");
    for (const __char of str[Symbol.iterator]()){
        const code = __char.codePointAt(0);
        if (isFullWidthCodePoint(code)) {
            width += 2;
        } else if (!isZeroWidthCodePoint(code)) {
            width++;
        }
    }
    return width;
}
const isFullWidthCodePoint = (code)=>{
    return code >= 0x1100 && (code <= 0x115f || code === 0x2329 || code === 0x232a || code >= 0x2e80 && code <= 0x3247 && code !== 0x303f || code >= 0x3250 && code <= 0x4dbf || code >= 0x4e00 && code <= 0xa4c6 || code >= 0xa960 && code <= 0xa97c || code >= 0xac00 && code <= 0xd7a3 || code >= 0xf900 && code <= 0xfaff || code >= 0xfe10 && code <= 0xfe19 || code >= 0xfe30 && code <= 0xfe6b || code >= 0xff01 && code <= 0xff60 || code >= 0xffe0 && code <= 0xffe6 || code >= 0x1b000 && code <= 0x1b001 || code >= 0x1f200 && code <= 0x1f251 || code >= 0x1f300 && code <= 0x1f64f || code >= 0x20000 && code <= 0x3fffd);
};
const isZeroWidthCodePoint = (code)=>{
    return code <= 0x1F || code >= 0x7F && code <= 0x9F || code >= 0x300 && code <= 0x36F || code >= 0x200B && code <= 0x200F || code >= 0x20D0 && code <= 0x20FF || code >= 0xFE00 && code <= 0xFE0F || code >= 0xFE20 && code <= 0xFE2F || code >= 0xE0100 && code <= 0xE01EF;
};
function stripVTControlCharacters(str) {
    validateString(str, "str");
    return str.replace(ansi, "");
}
let debugImpls;
function initializeDebugEnv(debugEnv) {
    debugImpls = Object.create(null);
    if (debugEnv) {
        debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replaceAll("*", ".*").replaceAll(",", "$|^");
        new RegExp(`^${debugEnv}$`, "i");
    } else {}
}
let debugEnv;
try {
    debugEnv = Deno.env.get("NODE_DEBUG") ?? "";
} catch (error2) {
    if (error2 instanceof Deno.errors.PermissionDenied) {
        debugEnv = "";
    } else {
        throw error2;
    }
}
initializeDebugEnv(debugEnv);
const osType1 = (()=>{
    const { Deno: Deno1  } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator  } = globalThis;
    if (navigator?.appVersion?.includes?.("Win")) {
        return "windows";
    }
    return "linux";
})();
const isWindows1 = osType1 === "windows";
const os = {
    UV_UDP_IPV6ONLY: 1,
    UV_UDP_PARTIAL: 2,
    UV_UDP_REUSEADDR: 4,
    UV_UDP_MMSG_CHUNK: 8,
    UV_UDP_MMSG_FREE: 16,
    UV_UDP_LINUX_RECVERR: 32,
    UV_UDP_RECVMMSG: 256,
    dlopen: {
        RTLD_LAZY: 1,
        RTLD_NOW: 2,
        RTLD_GLOBAL: 8,
        RTLD_LOCAL: 4
    },
    errno: {
        E2BIG: 7,
        EACCES: 13,
        EADDRINUSE: 48,
        EADDRNOTAVAIL: 49,
        EAFNOSUPPORT: 47,
        EAGAIN: 35,
        EALREADY: 37,
        EBADF: 9,
        EBADMSG: 94,
        EBUSY: 16,
        ECANCELED: 89,
        ECHILD: 10,
        ECONNABORTED: 53,
        ECONNREFUSED: 61,
        ECONNRESET: 54,
        EDEADLK: 11,
        EDESTADDRREQ: 39,
        EDOM: 33,
        EDQUOT: 69,
        EEXIST: 17,
        EFAULT: 14,
        EFBIG: 27,
        EHOSTUNREACH: 65,
        EIDRM: 90,
        EILSEQ: 92,
        EINPROGRESS: 36,
        EINTR: 4,
        EINVAL: 22,
        EIO: 5,
        EISCONN: 56,
        EISDIR: 21,
        ELOOP: 62,
        EMFILE: 24,
        EMLINK: 31,
        EMSGSIZE: 40,
        EMULTIHOP: 95,
        ENAMETOOLONG: 63,
        ENETDOWN: 50,
        ENETRESET: 52,
        ENETUNREACH: 51,
        ENFILE: 23,
        ENOBUFS: 55,
        ENODATA: 96,
        ENODEV: 19,
        ENOENT: 2,
        ENOEXEC: 8,
        ENOLCK: 77,
        ENOLINK: 97,
        ENOMEM: 12,
        ENOMSG: 91,
        ENOPROTOOPT: 42,
        ENOSPC: 28,
        ENOSR: 98,
        ENOSTR: 99,
        ENOSYS: 78,
        ENOTCONN: 57,
        ENOTDIR: 20,
        ENOTEMPTY: 66,
        ENOTSOCK: 38,
        ENOTSUP: 45,
        ENOTTY: 25,
        ENXIO: 6,
        EOPNOTSUPP: 102,
        EOVERFLOW: 84,
        EPERM: 1,
        EPIPE: 32,
        EPROTO: 100,
        EPROTONOSUPPORT: 43,
        EPROTOTYPE: 41,
        ERANGE: 34,
        EROFS: 30,
        ESPIPE: 29,
        ESRCH: 3,
        ESTALE: 70,
        ETIME: 101,
        ETIMEDOUT: 60,
        ETXTBSY: 26,
        EWOULDBLOCK: 35,
        EXDEV: 18
    },
    signals: {
        SIGHUP: 1,
        SIGINT: 2,
        SIGQUIT: 3,
        SIGILL: 4,
        SIGTRAP: 5,
        SIGABRT: 6,
        SIGIOT: 6,
        SIGBUS: 10,
        SIGFPE: 8,
        SIGKILL: 9,
        SIGUSR1: 30,
        SIGSEGV: 11,
        SIGUSR2: 31,
        SIGPIPE: 13,
        SIGALRM: 14,
        SIGTERM: 15,
        SIGCHLD: 20,
        SIGCONT: 19,
        SIGSTOP: 17,
        SIGTSTP: 18,
        SIGTTIN: 21,
        SIGBREAK: 21,
        SIGTTOU: 22,
        SIGURG: 16,
        SIGXCPU: 24,
        SIGXFSZ: 25,
        SIGVTALRM: 26,
        SIGPROF: 27,
        SIGWINCH: 28,
        SIGIO: 23,
        SIGINFO: 29,
        SIGSYS: 12,
        SIGEMT: 7,
        SIGPWR: 30,
        SIGSTKFLT: 16
    },
    priority: {
        PRIORITY_LOW: 19,
        PRIORITY_BELOW_NORMAL: 10,
        PRIORITY_NORMAL: 0,
        PRIORITY_ABOVE_NORMAL: -7,
        PRIORITY_HIGH: -14,
        PRIORITY_HIGHEST: -20
    }
};
os.errno.EEXIST;
os.errno.ENOENT;
const codeToErrorWindows = [
    [
        -4093,
        [
            "E2BIG",
            "argument list too long"
        ]
    ],
    [
        -4092,
        [
            "EACCES",
            "permission denied"
        ]
    ],
    [
        -4091,
        [
            "EADDRINUSE",
            "address already in use"
        ]
    ],
    [
        -4090,
        [
            "EADDRNOTAVAIL",
            "address not available"
        ]
    ],
    [
        -4089,
        [
            "EAFNOSUPPORT",
            "address family not supported"
        ]
    ],
    [
        -4088,
        [
            "EAGAIN",
            "resource temporarily unavailable"
        ]
    ],
    [
        -3000,
        [
            "EAI_ADDRFAMILY",
            "address family not supported"
        ]
    ],
    [
        -3001,
        [
            "EAI_AGAIN",
            "temporary failure"
        ]
    ],
    [
        -3002,
        [
            "EAI_BADFLAGS",
            "bad ai_flags value"
        ]
    ],
    [
        -3013,
        [
            "EAI_BADHINTS",
            "invalid value for hints"
        ]
    ],
    [
        -3003,
        [
            "EAI_CANCELED",
            "request canceled"
        ]
    ],
    [
        -3004,
        [
            "EAI_FAIL",
            "permanent failure"
        ]
    ],
    [
        -3005,
        [
            "EAI_FAMILY",
            "ai_family not supported"
        ]
    ],
    [
        -3006,
        [
            "EAI_MEMORY",
            "out of memory"
        ]
    ],
    [
        -3007,
        [
            "EAI_NODATA",
            "no address"
        ]
    ],
    [
        -3008,
        [
            "EAI_NONAME",
            "unknown node or service"
        ]
    ],
    [
        -3009,
        [
            "EAI_OVERFLOW",
            "argument buffer overflow"
        ]
    ],
    [
        -3014,
        [
            "EAI_PROTOCOL",
            "resolved protocol is unknown"
        ]
    ],
    [
        -3010,
        [
            "EAI_SERVICE",
            "service not available for socket type"
        ]
    ],
    [
        -3011,
        [
            "EAI_SOCKTYPE",
            "socket type not supported"
        ]
    ],
    [
        -4084,
        [
            "EALREADY",
            "connection already in progress"
        ]
    ],
    [
        -4083,
        [
            "EBADF",
            "bad file descriptor"
        ]
    ],
    [
        -4082,
        [
            "EBUSY",
            "resource busy or locked"
        ]
    ],
    [
        -4081,
        [
            "ECANCELED",
            "operation canceled"
        ]
    ],
    [
        -4080,
        [
            "ECHARSET",
            "invalid Unicode character"
        ]
    ],
    [
        -4079,
        [
            "ECONNABORTED",
            "software caused connection abort"
        ]
    ],
    [
        -4078,
        [
            "ECONNREFUSED",
            "connection refused"
        ]
    ],
    [
        -4077,
        [
            "ECONNRESET",
            "connection reset by peer"
        ]
    ],
    [
        -4076,
        [
            "EDESTADDRREQ",
            "destination address required"
        ]
    ],
    [
        -4075,
        [
            "EEXIST",
            "file already exists"
        ]
    ],
    [
        -4074,
        [
            "EFAULT",
            "bad address in system call argument"
        ]
    ],
    [
        -4036,
        [
            "EFBIG",
            "file too large"
        ]
    ],
    [
        -4073,
        [
            "EHOSTUNREACH",
            "host is unreachable"
        ]
    ],
    [
        -4072,
        [
            "EINTR",
            "interrupted system call"
        ]
    ],
    [
        -4071,
        [
            "EINVAL",
            "invalid argument"
        ]
    ],
    [
        -4070,
        [
            "EIO",
            "i/o error"
        ]
    ],
    [
        -4069,
        [
            "EISCONN",
            "socket is already connected"
        ]
    ],
    [
        -4068,
        [
            "EISDIR",
            "illegal operation on a directory"
        ]
    ],
    [
        -4067,
        [
            "ELOOP",
            "too many symbolic links encountered"
        ]
    ],
    [
        -4066,
        [
            "EMFILE",
            "too many open files"
        ]
    ],
    [
        -4065,
        [
            "EMSGSIZE",
            "message too long"
        ]
    ],
    [
        -4064,
        [
            "ENAMETOOLONG",
            "name too long"
        ]
    ],
    [
        -4063,
        [
            "ENETDOWN",
            "network is down"
        ]
    ],
    [
        -4062,
        [
            "ENETUNREACH",
            "network is unreachable"
        ]
    ],
    [
        -4061,
        [
            "ENFILE",
            "file table overflow"
        ]
    ],
    [
        -4060,
        [
            "ENOBUFS",
            "no buffer space available"
        ]
    ],
    [
        -4059,
        [
            "ENODEV",
            "no such device"
        ]
    ],
    [
        -4058,
        [
            "ENOENT",
            "no such file or directory"
        ]
    ],
    [
        -4057,
        [
            "ENOMEM",
            "not enough memory"
        ]
    ],
    [
        -4056,
        [
            "ENONET",
            "machine is not on the network"
        ]
    ],
    [
        -4035,
        [
            "ENOPROTOOPT",
            "protocol not available"
        ]
    ],
    [
        -4055,
        [
            "ENOSPC",
            "no space left on device"
        ]
    ],
    [
        -4054,
        [
            "ENOSYS",
            "function not implemented"
        ]
    ],
    [
        -4053,
        [
            "ENOTCONN",
            "socket is not connected"
        ]
    ],
    [
        -4052,
        [
            "ENOTDIR",
            "not a directory"
        ]
    ],
    [
        -4051,
        [
            "ENOTEMPTY",
            "directory not empty"
        ]
    ],
    [
        -4050,
        [
            "ENOTSOCK",
            "socket operation on non-socket"
        ]
    ],
    [
        -4049,
        [
            "ENOTSUP",
            "operation not supported on socket"
        ]
    ],
    [
        -4048,
        [
            "EPERM",
            "operation not permitted"
        ]
    ],
    [
        -4047,
        [
            "EPIPE",
            "broken pipe"
        ]
    ],
    [
        -4046,
        [
            "EPROTO",
            "protocol error"
        ]
    ],
    [
        -4045,
        [
            "EPROTONOSUPPORT",
            "protocol not supported"
        ]
    ],
    [
        -4044,
        [
            "EPROTOTYPE",
            "protocol wrong type for socket"
        ]
    ],
    [
        -4034,
        [
            "ERANGE",
            "result too large"
        ]
    ],
    [
        -4043,
        [
            "EROFS",
            "read-only file system"
        ]
    ],
    [
        -4042,
        [
            "ESHUTDOWN",
            "cannot send after transport endpoint shutdown"
        ]
    ],
    [
        -4041,
        [
            "ESPIPE",
            "invalid seek"
        ]
    ],
    [
        -4040,
        [
            "ESRCH",
            "no such process"
        ]
    ],
    [
        -4039,
        [
            "ETIMEDOUT",
            "connection timed out"
        ]
    ],
    [
        -4038,
        [
            "ETXTBSY",
            "text file is busy"
        ]
    ],
    [
        -4037,
        [
            "EXDEV",
            "cross-device link not permitted"
        ]
    ],
    [
        -4094,
        [
            "UNKNOWN",
            "unknown error"
        ]
    ],
    [
        -4095,
        [
            "EOF",
            "end of file"
        ]
    ],
    [
        -4033,
        [
            "ENXIO",
            "no such device or address"
        ]
    ],
    [
        -4032,
        [
            "EMLINK",
            "too many links"
        ]
    ],
    [
        -4031,
        [
            "EHOSTDOWN",
            "host is down"
        ]
    ],
    [
        -4030,
        [
            "EREMOTEIO",
            "remote I/O error"
        ]
    ],
    [
        -4029,
        [
            "ENOTTY",
            "inappropriate ioctl for device"
        ]
    ],
    [
        -4028,
        [
            "EFTYPE",
            "inappropriate file type or format"
        ]
    ],
    [
        -4027,
        [
            "EILSEQ",
            "illegal byte sequence"
        ]
    ], 
];
const errorToCodeWindows = codeToErrorWindows.map(([status, [error]])=>[
        error,
        status
    ]);
const codeToErrorDarwin = [
    [
        -7,
        [
            "E2BIG",
            "argument list too long"
        ]
    ],
    [
        -13,
        [
            "EACCES",
            "permission denied"
        ]
    ],
    [
        -48,
        [
            "EADDRINUSE",
            "address already in use"
        ]
    ],
    [
        -49,
        [
            "EADDRNOTAVAIL",
            "address not available"
        ]
    ],
    [
        -47,
        [
            "EAFNOSUPPORT",
            "address family not supported"
        ]
    ],
    [
        -35,
        [
            "EAGAIN",
            "resource temporarily unavailable"
        ]
    ],
    [
        -3000,
        [
            "EAI_ADDRFAMILY",
            "address family not supported"
        ]
    ],
    [
        -3001,
        [
            "EAI_AGAIN",
            "temporary failure"
        ]
    ],
    [
        -3002,
        [
            "EAI_BADFLAGS",
            "bad ai_flags value"
        ]
    ],
    [
        -3013,
        [
            "EAI_BADHINTS",
            "invalid value for hints"
        ]
    ],
    [
        -3003,
        [
            "EAI_CANCELED",
            "request canceled"
        ]
    ],
    [
        -3004,
        [
            "EAI_FAIL",
            "permanent failure"
        ]
    ],
    [
        -3005,
        [
            "EAI_FAMILY",
            "ai_family not supported"
        ]
    ],
    [
        -3006,
        [
            "EAI_MEMORY",
            "out of memory"
        ]
    ],
    [
        -3007,
        [
            "EAI_NODATA",
            "no address"
        ]
    ],
    [
        -3008,
        [
            "EAI_NONAME",
            "unknown node or service"
        ]
    ],
    [
        -3009,
        [
            "EAI_OVERFLOW",
            "argument buffer overflow"
        ]
    ],
    [
        -3014,
        [
            "EAI_PROTOCOL",
            "resolved protocol is unknown"
        ]
    ],
    [
        -3010,
        [
            "EAI_SERVICE",
            "service not available for socket type"
        ]
    ],
    [
        -3011,
        [
            "EAI_SOCKTYPE",
            "socket type not supported"
        ]
    ],
    [
        -37,
        [
            "EALREADY",
            "connection already in progress"
        ]
    ],
    [
        -9,
        [
            "EBADF",
            "bad file descriptor"
        ]
    ],
    [
        -16,
        [
            "EBUSY",
            "resource busy or locked"
        ]
    ],
    [
        -89,
        [
            "ECANCELED",
            "operation canceled"
        ]
    ],
    [
        -4080,
        [
            "ECHARSET",
            "invalid Unicode character"
        ]
    ],
    [
        -53,
        [
            "ECONNABORTED",
            "software caused connection abort"
        ]
    ],
    [
        -61,
        [
            "ECONNREFUSED",
            "connection refused"
        ]
    ],
    [
        -54,
        [
            "ECONNRESET",
            "connection reset by peer"
        ]
    ],
    [
        -39,
        [
            "EDESTADDRREQ",
            "destination address required"
        ]
    ],
    [
        -17,
        [
            "EEXIST",
            "file already exists"
        ]
    ],
    [
        -14,
        [
            "EFAULT",
            "bad address in system call argument"
        ]
    ],
    [
        -27,
        [
            "EFBIG",
            "file too large"
        ]
    ],
    [
        -65,
        [
            "EHOSTUNREACH",
            "host is unreachable"
        ]
    ],
    [
        -4,
        [
            "EINTR",
            "interrupted system call"
        ]
    ],
    [
        -22,
        [
            "EINVAL",
            "invalid argument"
        ]
    ],
    [
        -5,
        [
            "EIO",
            "i/o error"
        ]
    ],
    [
        -56,
        [
            "EISCONN",
            "socket is already connected"
        ]
    ],
    [
        -21,
        [
            "EISDIR",
            "illegal operation on a directory"
        ]
    ],
    [
        -62,
        [
            "ELOOP",
            "too many symbolic links encountered"
        ]
    ],
    [
        -24,
        [
            "EMFILE",
            "too many open files"
        ]
    ],
    [
        -40,
        [
            "EMSGSIZE",
            "message too long"
        ]
    ],
    [
        -63,
        [
            "ENAMETOOLONG",
            "name too long"
        ]
    ],
    [
        -50,
        [
            "ENETDOWN",
            "network is down"
        ]
    ],
    [
        -51,
        [
            "ENETUNREACH",
            "network is unreachable"
        ]
    ],
    [
        -23,
        [
            "ENFILE",
            "file table overflow"
        ]
    ],
    [
        -55,
        [
            "ENOBUFS",
            "no buffer space available"
        ]
    ],
    [
        -19,
        [
            "ENODEV",
            "no such device"
        ]
    ],
    [
        -2,
        [
            "ENOENT",
            "no such file or directory"
        ]
    ],
    [
        -12,
        [
            "ENOMEM",
            "not enough memory"
        ]
    ],
    [
        -4056,
        [
            "ENONET",
            "machine is not on the network"
        ]
    ],
    [
        -42,
        [
            "ENOPROTOOPT",
            "protocol not available"
        ]
    ],
    [
        -28,
        [
            "ENOSPC",
            "no space left on device"
        ]
    ],
    [
        -78,
        [
            "ENOSYS",
            "function not implemented"
        ]
    ],
    [
        -57,
        [
            "ENOTCONN",
            "socket is not connected"
        ]
    ],
    [
        -20,
        [
            "ENOTDIR",
            "not a directory"
        ]
    ],
    [
        -66,
        [
            "ENOTEMPTY",
            "directory not empty"
        ]
    ],
    [
        -38,
        [
            "ENOTSOCK",
            "socket operation on non-socket"
        ]
    ],
    [
        -45,
        [
            "ENOTSUP",
            "operation not supported on socket"
        ]
    ],
    [
        -1,
        [
            "EPERM",
            "operation not permitted"
        ]
    ],
    [
        -32,
        [
            "EPIPE",
            "broken pipe"
        ]
    ],
    [
        -100,
        [
            "EPROTO",
            "protocol error"
        ]
    ],
    [
        -43,
        [
            "EPROTONOSUPPORT",
            "protocol not supported"
        ]
    ],
    [
        -41,
        [
            "EPROTOTYPE",
            "protocol wrong type for socket"
        ]
    ],
    [
        -34,
        [
            "ERANGE",
            "result too large"
        ]
    ],
    [
        -30,
        [
            "EROFS",
            "read-only file system"
        ]
    ],
    [
        -58,
        [
            "ESHUTDOWN",
            "cannot send after transport endpoint shutdown"
        ]
    ],
    [
        -29,
        [
            "ESPIPE",
            "invalid seek"
        ]
    ],
    [
        -3,
        [
            "ESRCH",
            "no such process"
        ]
    ],
    [
        -60,
        [
            "ETIMEDOUT",
            "connection timed out"
        ]
    ],
    [
        -26,
        [
            "ETXTBSY",
            "text file is busy"
        ]
    ],
    [
        -18,
        [
            "EXDEV",
            "cross-device link not permitted"
        ]
    ],
    [
        -4094,
        [
            "UNKNOWN",
            "unknown error"
        ]
    ],
    [
        -4095,
        [
            "EOF",
            "end of file"
        ]
    ],
    [
        -6,
        [
            "ENXIO",
            "no such device or address"
        ]
    ],
    [
        -31,
        [
            "EMLINK",
            "too many links"
        ]
    ],
    [
        -64,
        [
            "EHOSTDOWN",
            "host is down"
        ]
    ],
    [
        -4030,
        [
            "EREMOTEIO",
            "remote I/O error"
        ]
    ],
    [
        -25,
        [
            "ENOTTY",
            "inappropriate ioctl for device"
        ]
    ],
    [
        -79,
        [
            "EFTYPE",
            "inappropriate file type or format"
        ]
    ],
    [
        -92,
        [
            "EILSEQ",
            "illegal byte sequence"
        ]
    ], 
];
const errorToCodeDarwin = codeToErrorDarwin.map(([status, [code]])=>[
        code,
        status
    ]);
const codeToErrorLinux = [
    [
        -7,
        [
            "E2BIG",
            "argument list too long"
        ]
    ],
    [
        -13,
        [
            "EACCES",
            "permission denied"
        ]
    ],
    [
        -98,
        [
            "EADDRINUSE",
            "address already in use"
        ]
    ],
    [
        -99,
        [
            "EADDRNOTAVAIL",
            "address not available"
        ]
    ],
    [
        -97,
        [
            "EAFNOSUPPORT",
            "address family not supported"
        ]
    ],
    [
        -11,
        [
            "EAGAIN",
            "resource temporarily unavailable"
        ]
    ],
    [
        -3000,
        [
            "EAI_ADDRFAMILY",
            "address family not supported"
        ]
    ],
    [
        -3001,
        [
            "EAI_AGAIN",
            "temporary failure"
        ]
    ],
    [
        -3002,
        [
            "EAI_BADFLAGS",
            "bad ai_flags value"
        ]
    ],
    [
        -3013,
        [
            "EAI_BADHINTS",
            "invalid value for hints"
        ]
    ],
    [
        -3003,
        [
            "EAI_CANCELED",
            "request canceled"
        ]
    ],
    [
        -3004,
        [
            "EAI_FAIL",
            "permanent failure"
        ]
    ],
    [
        -3005,
        [
            "EAI_FAMILY",
            "ai_family not supported"
        ]
    ],
    [
        -3006,
        [
            "EAI_MEMORY",
            "out of memory"
        ]
    ],
    [
        -3007,
        [
            "EAI_NODATA",
            "no address"
        ]
    ],
    [
        -3008,
        [
            "EAI_NONAME",
            "unknown node or service"
        ]
    ],
    [
        -3009,
        [
            "EAI_OVERFLOW",
            "argument buffer overflow"
        ]
    ],
    [
        -3014,
        [
            "EAI_PROTOCOL",
            "resolved protocol is unknown"
        ]
    ],
    [
        -3010,
        [
            "EAI_SERVICE",
            "service not available for socket type"
        ]
    ],
    [
        -3011,
        [
            "EAI_SOCKTYPE",
            "socket type not supported"
        ]
    ],
    [
        -114,
        [
            "EALREADY",
            "connection already in progress"
        ]
    ],
    [
        -9,
        [
            "EBADF",
            "bad file descriptor"
        ]
    ],
    [
        -16,
        [
            "EBUSY",
            "resource busy or locked"
        ]
    ],
    [
        -125,
        [
            "ECANCELED",
            "operation canceled"
        ]
    ],
    [
        -4080,
        [
            "ECHARSET",
            "invalid Unicode character"
        ]
    ],
    [
        -103,
        [
            "ECONNABORTED",
            "software caused connection abort"
        ]
    ],
    [
        -111,
        [
            "ECONNREFUSED",
            "connection refused"
        ]
    ],
    [
        -104,
        [
            "ECONNRESET",
            "connection reset by peer"
        ]
    ],
    [
        -89,
        [
            "EDESTADDRREQ",
            "destination address required"
        ]
    ],
    [
        -17,
        [
            "EEXIST",
            "file already exists"
        ]
    ],
    [
        -14,
        [
            "EFAULT",
            "bad address in system call argument"
        ]
    ],
    [
        -27,
        [
            "EFBIG",
            "file too large"
        ]
    ],
    [
        -113,
        [
            "EHOSTUNREACH",
            "host is unreachable"
        ]
    ],
    [
        -4,
        [
            "EINTR",
            "interrupted system call"
        ]
    ],
    [
        -22,
        [
            "EINVAL",
            "invalid argument"
        ]
    ],
    [
        -5,
        [
            "EIO",
            "i/o error"
        ]
    ],
    [
        -106,
        [
            "EISCONN",
            "socket is already connected"
        ]
    ],
    [
        -21,
        [
            "EISDIR",
            "illegal operation on a directory"
        ]
    ],
    [
        -40,
        [
            "ELOOP",
            "too many symbolic links encountered"
        ]
    ],
    [
        -24,
        [
            "EMFILE",
            "too many open files"
        ]
    ],
    [
        -90,
        [
            "EMSGSIZE",
            "message too long"
        ]
    ],
    [
        -36,
        [
            "ENAMETOOLONG",
            "name too long"
        ]
    ],
    [
        -100,
        [
            "ENETDOWN",
            "network is down"
        ]
    ],
    [
        -101,
        [
            "ENETUNREACH",
            "network is unreachable"
        ]
    ],
    [
        -23,
        [
            "ENFILE",
            "file table overflow"
        ]
    ],
    [
        -105,
        [
            "ENOBUFS",
            "no buffer space available"
        ]
    ],
    [
        -19,
        [
            "ENODEV",
            "no such device"
        ]
    ],
    [
        -2,
        [
            "ENOENT",
            "no such file or directory"
        ]
    ],
    [
        -12,
        [
            "ENOMEM",
            "not enough memory"
        ]
    ],
    [
        -64,
        [
            "ENONET",
            "machine is not on the network"
        ]
    ],
    [
        -92,
        [
            "ENOPROTOOPT",
            "protocol not available"
        ]
    ],
    [
        -28,
        [
            "ENOSPC",
            "no space left on device"
        ]
    ],
    [
        -38,
        [
            "ENOSYS",
            "function not implemented"
        ]
    ],
    [
        -107,
        [
            "ENOTCONN",
            "socket is not connected"
        ]
    ],
    [
        -20,
        [
            "ENOTDIR",
            "not a directory"
        ]
    ],
    [
        -39,
        [
            "ENOTEMPTY",
            "directory not empty"
        ]
    ],
    [
        -88,
        [
            "ENOTSOCK",
            "socket operation on non-socket"
        ]
    ],
    [
        -95,
        [
            "ENOTSUP",
            "operation not supported on socket"
        ]
    ],
    [
        -1,
        [
            "EPERM",
            "operation not permitted"
        ]
    ],
    [
        -32,
        [
            "EPIPE",
            "broken pipe"
        ]
    ],
    [
        -71,
        [
            "EPROTO",
            "protocol error"
        ]
    ],
    [
        -93,
        [
            "EPROTONOSUPPORT",
            "protocol not supported"
        ]
    ],
    [
        -91,
        [
            "EPROTOTYPE",
            "protocol wrong type for socket"
        ]
    ],
    [
        -34,
        [
            "ERANGE",
            "result too large"
        ]
    ],
    [
        -30,
        [
            "EROFS",
            "read-only file system"
        ]
    ],
    [
        -108,
        [
            "ESHUTDOWN",
            "cannot send after transport endpoint shutdown"
        ]
    ],
    [
        -29,
        [
            "ESPIPE",
            "invalid seek"
        ]
    ],
    [
        -3,
        [
            "ESRCH",
            "no such process"
        ]
    ],
    [
        -110,
        [
            "ETIMEDOUT",
            "connection timed out"
        ]
    ],
    [
        -26,
        [
            "ETXTBSY",
            "text file is busy"
        ]
    ],
    [
        -18,
        [
            "EXDEV",
            "cross-device link not permitted"
        ]
    ],
    [
        -4094,
        [
            "UNKNOWN",
            "unknown error"
        ]
    ],
    [
        -4095,
        [
            "EOF",
            "end of file"
        ]
    ],
    [
        -6,
        [
            "ENXIO",
            "no such device or address"
        ]
    ],
    [
        -31,
        [
            "EMLINK",
            "too many links"
        ]
    ],
    [
        -112,
        [
            "EHOSTDOWN",
            "host is down"
        ]
    ],
    [
        -121,
        [
            "EREMOTEIO",
            "remote I/O error"
        ]
    ],
    [
        -25,
        [
            "ENOTTY",
            "inappropriate ioctl for device"
        ]
    ],
    [
        -4028,
        [
            "EFTYPE",
            "inappropriate file type or format"
        ]
    ],
    [
        -84,
        [
            "EILSEQ",
            "illegal byte sequence"
        ]
    ], 
];
const errorToCodeLinux = codeToErrorLinux.map(([status, [code]])=>[
        code,
        status
    ]);
const errorMap = new Map(osType1 === "windows" ? codeToErrorWindows : osType1 === "darwin" ? codeToErrorDarwin : osType1 === "linux" ? codeToErrorLinux : unreachable());
const codeMap = new Map(osType1 === "windows" ? errorToCodeWindows : osType1 === "darwin" ? errorToCodeDarwin : osType1 === "linux" ? errorToCodeLinux : unreachable());
codeMap.get("EAI_MEMORY");
codeMap.get("UNKNOWN");
codeMap.get("EBADF");
codeMap.get("EINVAL");
codeMap.get("ENOTSOCK");
var Encodings;
(function(Encodings) {
    Encodings[Encodings["ASCII"] = 0] = "ASCII";
    Encodings[Encodings["UTF8"] = 1] = "UTF8";
    Encodings[Encodings["BASE64"] = 2] = "BASE64";
    Encodings[Encodings["UCS2"] = 3] = "UCS2";
    Encodings[Encodings["BINARY"] = 4] = "BINARY";
    Encodings[Encodings["HEX"] = 5] = "HEX";
    Encodings[Encodings["BUFFER"] = 6] = "BUFFER";
    Encodings[Encodings["BASE64URL"] = 7] = "BASE64URL";
    Encodings[Encodings["LATIN1"] = 4] = "LATIN1";
})(Encodings || (Encodings = {}));
const encodings = [];
encodings[Encodings.ASCII] = "ascii";
encodings[Encodings.BASE64] = "base64";
encodings[Encodings.BASE64URL] = "base64url";
encodings[Encodings.BUFFER] = "buffer";
encodings[Encodings.HEX] = "hex";
encodings[Encodings.LATIN1] = "latin1";
encodings[Encodings.UCS2] = "utf16le";
encodings[Encodings.UTF8] = "utf8";
function numberToBytes(n) {
    if (n === 0) return new Uint8Array([
        0
    ]);
    const bytes = [];
    bytes.unshift(n & 255);
    while(n >= 256){
        n = n >>> 8;
        bytes.unshift(n & 255);
    }
    return new Uint8Array(bytes);
}
function findLastIndex(targetBuffer, buffer, offset) {
    offset = offset > targetBuffer.length ? targetBuffer.length : offset;
    const searchableBuffer = targetBuffer.slice(0, offset + buffer.length);
    const searchableBufferLastIndex = searchableBuffer.length - 1;
    const bufferLastIndex = buffer.length - 1;
    let lastMatchIndex = -1;
    let matches = 0;
    let index = -1;
    for(let x = 0; x <= searchableBufferLastIndex; x++){
        if (searchableBuffer[searchableBufferLastIndex - x] === buffer[bufferLastIndex - matches]) {
            if (lastMatchIndex === -1) {
                lastMatchIndex = x;
            }
            matches++;
        } else {
            matches = 0;
            if (lastMatchIndex !== -1) {
                x = lastMatchIndex + 1;
                lastMatchIndex = -1;
            }
            continue;
        }
        if (matches === buffer.length) {
            index = x;
            break;
        }
    }
    if (index === -1) return index;
    return searchableBufferLastIndex - index;
}
function indexOfBuffer(targetBuffer, buffer, byteOffset, encoding, forwardDirection) {
    if (!Encodings[encoding] === undefined) {
        throw new Error(`Unknown encoding code ${encoding}`);
    }
    if (!forwardDirection) {
        if (byteOffset < 0) {
            byteOffset = targetBuffer.length + byteOffset;
        }
        if (buffer.length === 0) {
            return byteOffset <= targetBuffer.length ? byteOffset : targetBuffer.length;
        }
        return findLastIndex(targetBuffer, buffer, byteOffset);
    }
    if (buffer.length === 0) {
        return byteOffset <= targetBuffer.length ? byteOffset : targetBuffer.length;
    }
    return indexOfNeedle(targetBuffer, buffer, byteOffset);
}
function indexOfNumber(targetBuffer, number, byteOffset, forwardDirection) {
    const bytes = numberToBytes(number);
    if (bytes.length > 1) {
        throw new Error("Multi byte number search is not supported");
    }
    return indexOfBuffer(targetBuffer, numberToBytes(number), byteOffset, Encodings.UTF8, forwardDirection);
}
const base64abc = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "+",
    "/", 
];
function encode(data) {
    const uint8 = typeof data === "string" ? new TextEncoder().encode(data) : data instanceof Uint8Array ? data : new Uint8Array(data);
    let result = "", i;
    const l = uint8.length;
    for(i = 2; i < l; i += 3){
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[(uint8[i - 2] & 0x03) << 4 | uint8[i - 1] >> 4];
        result += base64abc[(uint8[i - 1] & 0x0f) << 2 | uint8[i] >> 6];
        result += base64abc[uint8[i] & 0x3f];
    }
    if (i === l + 1) {
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[(uint8[i - 2] & 0x03) << 4];
        result += "==";
    }
    if (i === l) {
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[(uint8[i - 2] & 0x03) << 4 | uint8[i - 1] >> 4];
        result += base64abc[(uint8[i - 1] & 0x0f) << 2];
        result += "=";
    }
    return result;
}
function decode(b64) {
    const binString = atob(b64);
    const size = binString.length;
    const bytes = new Uint8Array(size);
    for(let i = 0; i < size; i++){
        bytes[i] = binString.charCodeAt(i);
    }
    return bytes;
}
function addPaddingToBase64url(base64url) {
    if (base64url.length % 4 === 2) return base64url + "==";
    if (base64url.length % 4 === 3) return base64url + "=";
    if (base64url.length % 4 === 1) {
        throw new TypeError("Illegal base64url string!");
    }
    return base64url;
}
function convertBase64urlToBase64(b64url) {
    if (!/^[-_A-Z0-9]*?={0,2}$/i.test(b64url)) {
        throw new TypeError("Failed to decode base64url: invalid character");
    }
    return addPaddingToBase64url(b64url).replace(/\-/g, "+").replace(/_/g, "/");
}
function convertBase64ToBase64url(b64) {
    return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function encode1(data) {
    return convertBase64ToBase64url(encode(data));
}
function decode1(b64url) {
    return decode(convertBase64urlToBase64(b64url));
}
function asciiToBytes(str) {
    const byteArray = [];
    for(let i = 0; i < str.length; ++i){
        byteArray.push(str.charCodeAt(i) & 255);
    }
    return new Uint8Array(byteArray);
}
function base64ToBytes(str) {
    str = base64clean(str);
    str = str.replaceAll("-", "+").replaceAll("_", "/");
    return decode(str);
}
const INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
function base64clean(str) {
    str = str.split("=")[0];
    str = str.trim().replace(INVALID_BASE64_RE, "");
    if (str.length < 2) return "";
    while(str.length % 4 !== 0){
        str = str + "=";
    }
    return str;
}
function base64UrlToBytes(str) {
    str = base64clean(str);
    str = str.replaceAll("+", "-").replaceAll("/", "_");
    return decode1(str);
}
function hexToBytes(str) {
    const byteArray = new Uint8Array(Math.floor((str || "").length / 2));
    let i;
    for(i = 0; i < byteArray.length; i++){
        const a = Number.parseInt(str[i * 2], 16);
        const b = Number.parseInt(str[i * 2 + 1], 16);
        if (Number.isNaN(a) && Number.isNaN(b)) {
            break;
        }
        byteArray[i] = a << 4 | b;
    }
    return new Uint8Array(i === byteArray.length ? byteArray : byteArray.slice(0, i));
}
function utf16leToBytes(str, units) {
    let c, hi, lo;
    const byteArray = [];
    for(let i = 0; i < str.length; ++i){
        if ((units -= 2) < 0) {
            break;
        }
        c = str.charCodeAt(i);
        hi = c >> 8;
        lo = c % 256;
        byteArray.push(lo);
        byteArray.push(hi);
    }
    return new Uint8Array(byteArray);
}
function bytesToAscii(bytes) {
    let ret = "";
    for(let i = 0; i < bytes.length; ++i){
        ret += String.fromCharCode(bytes[i] & 127);
    }
    return ret;
}
function bytesToUtf16le(bytes) {
    let res = "";
    for(let i = 0; i < bytes.length - 1; i += 2){
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
    }
    return res;
}
const utf8Encoder = new TextEncoder();
const float32Array = new Float32Array(1);
const uInt8Float32Array = new Uint8Array(float32Array.buffer);
const float64Array = new Float64Array(1);
const uInt8Float64Array = new Uint8Array(float64Array.buffer);
float32Array[0] = -1;
const bigEndian = uInt8Float32Array[3] === 0;
function readUInt48LE(buf, offset = 0) {
    validateNumber(offset, "offset");
    const first = buf[offset];
    const last = buf[offset + 5];
    if (first === undefined || last === undefined) {
        boundsError(offset, buf.length - 6);
    }
    return first + buf[++offset] * 2 ** 8 + buf[++offset] * 2 ** 16 + buf[++offset] * 2 ** 24 + (buf[++offset] + last * 2 ** 8) * 2 ** 32;
}
function readUInt40LE(buf, offset = 0) {
    validateNumber(offset, "offset");
    const first = buf[offset];
    const last = buf[offset + 4];
    if (first === undefined || last === undefined) {
        boundsError(offset, buf.length - 5);
    }
    return first + buf[++offset] * 2 ** 8 + buf[++offset] * 2 ** 16 + buf[++offset] * 2 ** 24 + last * 2 ** 32;
}
function readUInt24LE(buf, offset = 0) {
    validateNumber(offset, "offset");
    const first = buf[offset];
    const last = buf[offset + 2];
    if (first === undefined || last === undefined) {
        boundsError(offset, buf.length - 3);
    }
    return first + buf[++offset] * 2 ** 8 + last * 2 ** 16;
}
function readUInt48BE(buf, offset = 0) {
    validateNumber(offset, "offset");
    const first = buf[offset];
    const last = buf[offset + 5];
    if (first === undefined || last === undefined) {
        boundsError(offset, buf.length - 6);
    }
    return (first * 2 ** 8 + buf[++offset]) * 2 ** 32 + buf[++offset] * 2 ** 24 + buf[++offset] * 2 ** 16 + buf[++offset] * 2 ** 8 + last;
}
function readUInt40BE(buf, offset = 0) {
    validateNumber(offset, "offset");
    const first = buf[offset];
    const last = buf[offset + 4];
    if (first === undefined || last === undefined) {
        boundsError(offset, buf.length - 5);
    }
    return first * 2 ** 32 + buf[++offset] * 2 ** 24 + buf[++offset] * 2 ** 16 + buf[++offset] * 2 ** 8 + last;
}
function readUInt24BE(buf, offset = 0) {
    validateNumber(offset, "offset");
    const first = buf[offset];
    const last = buf[offset + 2];
    if (first === undefined || last === undefined) {
        boundsError(offset, buf.length - 3);
    }
    return first * 2 ** 16 + buf[++offset] * 2 ** 8 + last;
}
function readUInt16BE(offset = 0) {
    validateNumber(offset, "offset");
    const first = this[offset];
    const last = this[offset + 1];
    if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 2);
    }
    return first * 2 ** 8 + last;
}
function readUInt32BE(offset = 0) {
    validateNumber(offset, "offset");
    const first = this[offset];
    const last = this[offset + 3];
    if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 4);
    }
    return first * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
}
function readDoubleBackwards(buffer, offset = 0) {
    validateNumber(offset, "offset");
    const first = buffer[offset];
    const last = buffer[offset + 7];
    if (first === undefined || last === undefined) {
        boundsError(offset, buffer.length - 8);
    }
    uInt8Float64Array[7] = first;
    uInt8Float64Array[6] = buffer[++offset];
    uInt8Float64Array[5] = buffer[++offset];
    uInt8Float64Array[4] = buffer[++offset];
    uInt8Float64Array[3] = buffer[++offset];
    uInt8Float64Array[2] = buffer[++offset];
    uInt8Float64Array[1] = buffer[++offset];
    uInt8Float64Array[0] = last;
    return float64Array[0];
}
function readDoubleForwards(buffer, offset = 0) {
    validateNumber(offset, "offset");
    const first = buffer[offset];
    const last = buffer[offset + 7];
    if (first === undefined || last === undefined) {
        boundsError(offset, buffer.length - 8);
    }
    uInt8Float64Array[0] = first;
    uInt8Float64Array[1] = buffer[++offset];
    uInt8Float64Array[2] = buffer[++offset];
    uInt8Float64Array[3] = buffer[++offset];
    uInt8Float64Array[4] = buffer[++offset];
    uInt8Float64Array[5] = buffer[++offset];
    uInt8Float64Array[6] = buffer[++offset];
    uInt8Float64Array[7] = last;
    return float64Array[0];
}
function writeDoubleForwards(buffer, val, offset = 0) {
    val = +val;
    checkBounds(buffer, offset, 7);
    float64Array[0] = val;
    buffer[offset++] = uInt8Float64Array[0];
    buffer[offset++] = uInt8Float64Array[1];
    buffer[offset++] = uInt8Float64Array[2];
    buffer[offset++] = uInt8Float64Array[3];
    buffer[offset++] = uInt8Float64Array[4];
    buffer[offset++] = uInt8Float64Array[5];
    buffer[offset++] = uInt8Float64Array[6];
    buffer[offset++] = uInt8Float64Array[7];
    return offset;
}
function writeDoubleBackwards(buffer, val, offset = 0) {
    val = +val;
    checkBounds(buffer, offset, 7);
    float64Array[0] = val;
    buffer[offset++] = uInt8Float64Array[7];
    buffer[offset++] = uInt8Float64Array[6];
    buffer[offset++] = uInt8Float64Array[5];
    buffer[offset++] = uInt8Float64Array[4];
    buffer[offset++] = uInt8Float64Array[3];
    buffer[offset++] = uInt8Float64Array[2];
    buffer[offset++] = uInt8Float64Array[1];
    buffer[offset++] = uInt8Float64Array[0];
    return offset;
}
function readFloatBackwards(buffer, offset = 0) {
    validateNumber(offset, "offset");
    const first = buffer[offset];
    const last = buffer[offset + 3];
    if (first === undefined || last === undefined) {
        boundsError(offset, buffer.length - 4);
    }
    uInt8Float32Array[3] = first;
    uInt8Float32Array[2] = buffer[++offset];
    uInt8Float32Array[1] = buffer[++offset];
    uInt8Float32Array[0] = last;
    return float32Array[0];
}
function readFloatForwards(buffer, offset = 0) {
    validateNumber(offset, "offset");
    const first = buffer[offset];
    const last = buffer[offset + 3];
    if (first === undefined || last === undefined) {
        boundsError(offset, buffer.length - 4);
    }
    uInt8Float32Array[0] = first;
    uInt8Float32Array[1] = buffer[++offset];
    uInt8Float32Array[2] = buffer[++offset];
    uInt8Float32Array[3] = last;
    return float32Array[0];
}
function writeFloatForwards(buffer, val, offset = 0) {
    val = +val;
    checkBounds(buffer, offset, 3);
    float32Array[0] = val;
    buffer[offset++] = uInt8Float32Array[0];
    buffer[offset++] = uInt8Float32Array[1];
    buffer[offset++] = uInt8Float32Array[2];
    buffer[offset++] = uInt8Float32Array[3];
    return offset;
}
function writeFloatBackwards(buffer, val, offset = 0) {
    val = +val;
    checkBounds(buffer, offset, 3);
    float32Array[0] = val;
    buffer[offset++] = uInt8Float32Array[3];
    buffer[offset++] = uInt8Float32Array[2];
    buffer[offset++] = uInt8Float32Array[1];
    buffer[offset++] = uInt8Float32Array[0];
    return offset;
}
function readInt24LE(buf, offset = 0) {
    validateNumber(offset, "offset");
    const first = buf[offset];
    const last = buf[offset + 2];
    if (first === undefined || last === undefined) {
        boundsError(offset, buf.length - 3);
    }
    const val = first + buf[++offset] * 2 ** 8 + last * 2 ** 16;
    return val | (val & 2 ** 23) * 0x1fe;
}
function readInt40LE(buf, offset = 0) {
    validateNumber(offset, "offset");
    const first = buf[offset];
    const last = buf[offset + 4];
    if (first === undefined || last === undefined) {
        boundsError(offset, buf.length - 5);
    }
    return (last | (last & 2 ** 7) * 0x1fffffe) * 2 ** 32 + first + buf[++offset] * 2 ** 8 + buf[++offset] * 2 ** 16 + buf[++offset] * 2 ** 24;
}
function readInt48LE(buf, offset = 0) {
    validateNumber(offset, "offset");
    const first = buf[offset];
    const last = buf[offset + 5];
    if (first === undefined || last === undefined) {
        boundsError(offset, buf.length - 6);
    }
    const val = buf[offset + 4] + last * 2 ** 8;
    return (val | (val & 2 ** 15) * 0x1fffe) * 2 ** 32 + first + buf[++offset] * 2 ** 8 + buf[++offset] * 2 ** 16 + buf[++offset] * 2 ** 24;
}
function readInt24BE(buf, offset = 0) {
    validateNumber(offset, "offset");
    const first = buf[offset];
    const last = buf[offset + 2];
    if (first === undefined || last === undefined) {
        boundsError(offset, buf.length - 3);
    }
    const val = first * 2 ** 16 + buf[++offset] * 2 ** 8 + last;
    return val | (val & 2 ** 23) * 0x1fe;
}
function readInt48BE(buf, offset = 0) {
    validateNumber(offset, "offset");
    const first = buf[offset];
    const last = buf[offset + 5];
    if (first === undefined || last === undefined) {
        boundsError(offset, buf.length - 6);
    }
    const val = buf[++offset] + first * 2 ** 8;
    return (val | (val & 2 ** 15) * 0x1fffe) * 2 ** 32 + buf[++offset] * 2 ** 24 + buf[++offset] * 2 ** 16 + buf[++offset] * 2 ** 8 + last;
}
function readInt40BE(buf, offset = 0) {
    validateNumber(offset, "offset");
    const first = buf[offset];
    const last = buf[offset + 4];
    if (first === undefined || last === undefined) {
        boundsError(offset, buf.length - 5);
    }
    return (first | (first & 2 ** 7) * 0x1fffffe) * 2 ** 32 + buf[++offset] * 2 ** 24 + buf[++offset] * 2 ** 16 + buf[++offset] * 2 ** 8 + last;
}
function byteLengthUtf8(str) {
    return utf8Encoder.encode(str).length;
}
function base64ByteLength(str, bytes) {
    if (str.charCodeAt(bytes - 1) === 0x3D) {
        bytes--;
    }
    if (bytes > 1 && str.charCodeAt(bytes - 1) === 0x3D) {
        bytes--;
    }
    return bytes * 3 >>> 2;
}
const encodingsMap = Object.create(null);
for(let i = 0; i < encodings.length; ++i){
    encodingsMap[encodings[i]] = i;
}
const encodingOps = {
    ascii: {
        byteLength: (string)=>string.length,
        encoding: "ascii",
        encodingVal: encodingsMap.ascii,
        indexOf: (buf, val, byteOffset, dir)=>indexOfBuffer(buf, asciiToBytes(val), byteOffset, encodingsMap.ascii, dir),
        slice: (buf, start, end)=>buf.asciiSlice(start, end),
        write: (buf, string, offset, len)=>buf.asciiWrite(string, offset, len)
    },
    base64: {
        byteLength: (string)=>base64ByteLength(string, string.length),
        encoding: "base64",
        encodingVal: encodingsMap.base64,
        indexOf: (buf, val, byteOffset, dir)=>indexOfBuffer(buf, base64ToBytes(val), byteOffset, encodingsMap.base64, dir),
        slice: (buf, start, end)=>buf.base64Slice(start, end),
        write: (buf, string, offset, len)=>buf.base64Write(string, offset, len)
    },
    base64url: {
        byteLength: (string)=>base64ByteLength(string, string.length),
        encoding: "base64url",
        encodingVal: encodingsMap.base64url,
        indexOf: (buf, val, byteOffset, dir)=>indexOfBuffer(buf, base64UrlToBytes(val), byteOffset, encodingsMap.base64url, dir),
        slice: (buf, start, end)=>buf.base64urlSlice(start, end),
        write: (buf, string, offset, len)=>buf.base64urlWrite(string, offset, len)
    },
    hex: {
        byteLength: (string)=>string.length >>> 1,
        encoding: "hex",
        encodingVal: encodingsMap.hex,
        indexOf: (buf, val, byteOffset, dir)=>indexOfBuffer(buf, hexToBytes(val), byteOffset, encodingsMap.hex, dir),
        slice: (buf, start, end)=>buf.hexSlice(start, end),
        write: (buf, string, offset, len)=>buf.hexWrite(string, offset, len)
    },
    latin1: {
        byteLength: (string)=>string.length,
        encoding: "latin1",
        encodingVal: encodingsMap.latin1,
        indexOf: (buf, val, byteOffset, dir)=>indexOfBuffer(buf, asciiToBytes(val), byteOffset, encodingsMap.latin1, dir),
        slice: (buf, start, end)=>buf.latin1Slice(start, end),
        write: (buf, string, offset, len)=>buf.latin1Write(string, offset, len)
    },
    ucs2: {
        byteLength: (string)=>string.length * 2,
        encoding: "ucs2",
        encodingVal: encodingsMap.utf16le,
        indexOf: (buf, val, byteOffset, dir)=>indexOfBuffer(buf, utf16leToBytes(val), byteOffset, encodingsMap.utf16le, dir),
        slice: (buf, start, end)=>buf.ucs2Slice(start, end),
        write: (buf, string, offset, len)=>buf.ucs2Write(string, offset, len)
    },
    utf8: {
        byteLength: byteLengthUtf8,
        encoding: "utf8",
        encodingVal: encodingsMap.utf8,
        indexOf: (buf, val, byteOffset, dir)=>indexOfBuffer(buf, utf8Encoder.encode(val), byteOffset, encodingsMap.utf8, dir),
        slice: (buf, start, end)=>buf.utf8Slice(start, end),
        write: (buf, string, offset, len)=>buf.utf8Write(string, offset, len)
    },
    utf16le: {
        byteLength: (string)=>string.length * 2,
        encoding: "utf16le",
        encodingVal: encodingsMap.utf16le,
        indexOf: (buf, val, byteOffset, dir)=>indexOfBuffer(buf, utf16leToBytes(val), byteOffset, encodingsMap.utf16le, dir),
        slice: (buf, start, end)=>buf.ucs2Slice(start, end),
        write: (buf, string, offset, len)=>buf.ucs2Write(string, offset, len)
    }
};
function getEncodingOps(encoding) {
    encoding = String(encoding).toLowerCase();
    switch(encoding.length){
        case 4:
            if (encoding === "utf8") return encodingOps.utf8;
            if (encoding === "ucs2") return encodingOps.ucs2;
            break;
        case 5:
            if (encoding === "utf-8") return encodingOps.utf8;
            if (encoding === "ascii") return encodingOps.ascii;
            if (encoding === "ucs-2") return encodingOps.ucs2;
            break;
        case 7:
            if (encoding === "utf16le") {
                return encodingOps.utf16le;
            }
            break;
        case 8:
            if (encoding === "utf-16le") {
                return encodingOps.utf16le;
            }
            break;
        case 6:
            if (encoding === "latin1" || encoding === "binary") {
                return encodingOps.latin1;
            }
            if (encoding === "base64") return encodingOps.base64;
        case 3:
            if (encoding === "hex") {
                return encodingOps.hex;
            }
            break;
        case 9:
            if (encoding === "base64url") {
                return encodingOps.base64url;
            }
            break;
    }
}
function _copyActual(source, target, targetStart, sourceStart, sourceEnd) {
    if (sourceEnd - sourceStart > target.length - targetStart) {
        sourceEnd = sourceStart + target.length - targetStart;
    }
    let nb = sourceEnd - sourceStart;
    const sourceLen = source.length - sourceStart;
    if (nb > sourceLen) {
        nb = sourceLen;
    }
    if (sourceStart !== 0 || sourceEnd < source.length) {
        source = new Uint8Array(source.buffer, source.byteOffset + sourceStart, nb);
    }
    target.set(source, targetStart);
    return nb;
}
function boundsError(value, length, type) {
    if (Math.floor(value) !== value) {
        validateNumber(value, type);
        throw new codes.ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
    }
    if (length < 0) {
        throw new codes.ERR_BUFFER_OUT_OF_BOUNDS();
    }
    throw new codes.ERR_OUT_OF_RANGE(type || "offset", `>= ${type ? 1 : 0} and <= ${length}`, value);
}
function validateNumber(value, name) {
    if (typeof value !== "number") {
        throw new codes.ERR_INVALID_ARG_TYPE(name, "number", value);
    }
}
function checkBounds(buf, offset, byteLength) {
    validateNumber(offset, "offset");
    if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
        boundsError(offset, buf.length - (byteLength + 1));
    }
}
function checkInt(value, min, max, buf, offset, byteLength) {
    if (value > max || value < min) {
        const n = typeof min === "bigint" ? "n" : "";
        let range;
        if (byteLength > 3) {
            if (min === 0 || min === 0n) {
                range = `>= 0${n} and < 2${n} ** ${(byteLength + 1) * 8}${n}`;
            } else {
                range = `>= -(2${n} ** ${(byteLength + 1) * 8 - 1}${n}) and ` + `< 2${n} ** ${(byteLength + 1) * 8 - 1}${n}`;
            }
        } else {
            range = `>= ${min}${n} and <= ${max}${n}`;
        }
        throw new codes.ERR_OUT_OF_RANGE("value", range, value);
    }
    checkBounds(buf, offset, byteLength);
}
function toInteger(n, defaultVal) {
    n = +n;
    if (!Number.isNaN(n) && n >= Number.MIN_SAFE_INTEGER && n <= Number.MAX_SAFE_INTEGER) {
        return n % 1 === 0 ? n : Math.floor(n);
    }
    return defaultVal;
}
function writeU_Int8(buf, value, offset, min, max) {
    value = +value;
    validateNumber(offset, "offset");
    if (value > max || value < min) {
        throw new codes.ERR_OUT_OF_RANGE("value", `>= ${min} and <= ${max}`, value);
    }
    if (buf[offset] === undefined) {
        boundsError(offset, buf.length - 1);
    }
    buf[offset] = value;
    return offset + 1;
}
function writeU_Int16BE(buf, value, offset, min, max) {
    value = +value;
    checkInt(value, min, max, buf, offset, 1);
    buf[offset++] = value >>> 8;
    buf[offset++] = value;
    return offset;
}
function _writeUInt32LE(buf, value, offset, min, max) {
    value = +value;
    checkInt(value, min, max, buf, offset, 3);
    buf[offset++] = value;
    value = value >>> 8;
    buf[offset++] = value;
    value = value >>> 8;
    buf[offset++] = value;
    value = value >>> 8;
    buf[offset++] = value;
    return offset;
}
function writeU_Int16LE(buf, value, offset, min, max) {
    value = +value;
    checkInt(value, min, max, buf, offset, 1);
    buf[offset++] = value;
    buf[offset++] = value >>> 8;
    return offset;
}
function _writeUInt32BE(buf, value, offset, min, max) {
    value = +value;
    checkInt(value, min, max, buf, offset, 3);
    buf[offset + 3] = value;
    value = value >>> 8;
    buf[offset + 2] = value;
    value = value >>> 8;
    buf[offset + 1] = value;
    value = value >>> 8;
    buf[offset] = value;
    return offset + 4;
}
function writeU_Int48BE(buf, value, offset, min, max) {
    value = +value;
    checkInt(value, min, max, buf, offset, 5);
    const newVal = Math.floor(value * 2 ** -32);
    buf[offset++] = newVal >>> 8;
    buf[offset++] = newVal;
    buf[offset + 3] = value;
    value = value >>> 8;
    buf[offset + 2] = value;
    value = value >>> 8;
    buf[offset + 1] = value;
    value = value >>> 8;
    buf[offset] = value;
    return offset + 4;
}
function writeU_Int40BE(buf, value, offset, min, max) {
    value = +value;
    checkInt(value, min, max, buf, offset, 4);
    buf[offset++] = Math.floor(value * 2 ** -32);
    buf[offset + 3] = value;
    value = value >>> 8;
    buf[offset + 2] = value;
    value = value >>> 8;
    buf[offset + 1] = value;
    value = value >>> 8;
    buf[offset] = value;
    return offset + 4;
}
function writeU_Int32BE(buf, value, offset, min, max) {
    value = +value;
    checkInt(value, min, max, buf, offset, 3);
    buf[offset + 3] = value;
    value = value >>> 8;
    buf[offset + 2] = value;
    value = value >>> 8;
    buf[offset + 1] = value;
    value = value >>> 8;
    buf[offset] = value;
    return offset + 4;
}
function writeU_Int24BE(buf, value, offset, min, max) {
    value = +value;
    checkInt(value, min, max, buf, offset, 2);
    buf[offset + 2] = value;
    value = value >>> 8;
    buf[offset + 1] = value;
    value = value >>> 8;
    buf[offset] = value;
    return offset + 3;
}
function validateOffset(value, name, min = 0, max = Number.MAX_SAFE_INTEGER) {
    if (typeof value !== "number") {
        throw new codes.ERR_INVALID_ARG_TYPE(name, "number", value);
    }
    if (!Number.isInteger(value)) {
        throw new codes.ERR_OUT_OF_RANGE(name, "an integer", value);
    }
    if (value < min || value > max) {
        throw new codes.ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
    }
}
function writeU_Int48LE(buf, value, offset, min, max) {
    value = +value;
    checkInt(value, min, max, buf, offset, 5);
    const newVal = Math.floor(value * 2 ** -32);
    buf[offset++] = value;
    value = value >>> 8;
    buf[offset++] = value;
    value = value >>> 8;
    buf[offset++] = value;
    value = value >>> 8;
    buf[offset++] = value;
    buf[offset++] = newVal;
    buf[offset++] = newVal >>> 8;
    return offset;
}
function writeU_Int40LE(buf, value, offset, min, max) {
    value = +value;
    checkInt(value, min, max, buf, offset, 4);
    const newVal = value;
    buf[offset++] = value;
    value = value >>> 8;
    buf[offset++] = value;
    value = value >>> 8;
    buf[offset++] = value;
    value = value >>> 8;
    buf[offset++] = value;
    buf[offset++] = Math.floor(newVal * 2 ** -32);
    return offset;
}
function writeU_Int32LE(buf, value, offset, min, max) {
    value = +value;
    checkInt(value, min, max, buf, offset, 3);
    buf[offset++] = value;
    value = value >>> 8;
    buf[offset++] = value;
    value = value >>> 8;
    buf[offset++] = value;
    value = value >>> 8;
    buf[offset++] = value;
    return offset;
}
function writeU_Int24LE(buf, value, offset, min, max) {
    value = +value;
    checkInt(value, min, max, buf, offset, 2);
    buf[offset++] = value;
    value = value >>> 8;
    buf[offset++] = value;
    value = value >>> 8;
    buf[offset++] = value;
    return offset;
}
const kMaxLength = 2147483647;
const MAX_UINT32 = 2 ** 32;
const customInspectSymbol1 = typeof Symbol === "function" && typeof Symbol["for"] === "function" ? Symbol["for"]("nodejs.util.inspect.custom") : null;
const INSPECT_MAX_BYTES = 50;
Object.defineProperty(Buffer.prototype, "parent", {
    enumerable: true,
    get: function() {
        if (!Buffer.isBuffer(this)) {
            return void 0;
        }
        return this.buffer;
    }
});
Object.defineProperty(Buffer.prototype, "offset", {
    enumerable: true,
    get: function() {
        if (!Buffer.isBuffer(this)) {
            return void 0;
        }
        return this.byteOffset;
    }
});
function createBuffer(length) {
    if (length > 2147483647) {
        throw new RangeError('The value "' + length + '" is invalid for option "size"');
    }
    const buf = new Uint8Array(length);
    Object.setPrototypeOf(buf, Buffer.prototype);
    return buf;
}
function Buffer(arg, encodingOrOffset, length) {
    if (typeof arg === "number") {
        if (typeof encodingOrOffset === "string") {
            throw new codes.ERR_INVALID_ARG_TYPE("string", "string", arg);
        }
        return _allocUnsafe(arg);
    }
    return _from(arg, encodingOrOffset, length);
}
Buffer.poolSize = 8192;
function _from(value, encodingOrOffset, length) {
    if (typeof value === "string") {
        return fromString(value, encodingOrOffset);
    }
    if (typeof value === "object" && value !== null) {
        if (isAnyArrayBuffer1(value)) {
            return fromArrayBuffer(value, encodingOrOffset, length);
        }
        const valueOf = value.valueOf && value.valueOf();
        if (valueOf != null && valueOf !== value && (typeof valueOf === "string" || typeof valueOf === "object")) {
            return _from(valueOf, encodingOrOffset, length);
        }
        const b = fromObject(value);
        if (b) {
            return b;
        }
        if (typeof value[Symbol.toPrimitive] === "function") {
            const primitive = value[Symbol.toPrimitive]("string");
            if (typeof primitive === "string") {
                return fromString(primitive, encodingOrOffset);
            }
        }
    }
    throw new codes.ERR_INVALID_ARG_TYPE("first argument", [
        "string",
        "Buffer",
        "ArrayBuffer",
        "Array",
        "Array-like Object"
    ], value);
}
Buffer.from = function from(value, encodingOrOffset, length) {
    return _from(value, encodingOrOffset, length);
};
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype);
Object.setPrototypeOf(Buffer, Uint8Array);
function assertSize(size) {
    validateNumber(size, "size");
    if (!(size >= 0 && size <= 2147483647)) {
        throw new codes.ERR_INVALID_ARG_VALUE.RangeError("size", size);
    }
}
function _alloc(size, fill, encoding) {
    assertSize(size);
    const buffer = createBuffer(size);
    if (fill !== undefined) {
        if (encoding !== undefined && typeof encoding !== "string") {
            throw new codes.ERR_INVALID_ARG_TYPE("encoding", "string", encoding);
        }
        return buffer.fill(fill, encoding);
    }
    return buffer;
}
Buffer.alloc = function alloc(size, fill, encoding) {
    return _alloc(size, fill, encoding);
};
function _allocUnsafe(size) {
    assertSize(size);
    return createBuffer(size < 0 ? 0 : checked(size) | 0);
}
Buffer.allocUnsafe = function allocUnsafe(size) {
    return _allocUnsafe(size);
};
Buffer.allocUnsafeSlow = function allocUnsafeSlow(size) {
    return _allocUnsafe(size);
};
function fromString(string, encoding) {
    if (typeof encoding !== "string" || encoding === "") {
        encoding = "utf8";
    }
    if (!Buffer.isEncoding(encoding)) {
        throw new codes.ERR_UNKNOWN_ENCODING(encoding);
    }
    const length = byteLength(string, encoding) | 0;
    let buf = createBuffer(length);
    const actual = buf.write(string, encoding);
    if (actual !== length) {
        buf = buf.slice(0, actual);
    }
    return buf;
}
function fromArrayLike(array) {
    const length = array.length < 0 ? 0 : checked(array.length) | 0;
    const buf = createBuffer(length);
    for(let i = 0; i < length; i += 1){
        buf[i] = array[i] & 255;
    }
    return buf;
}
function fromObject(obj) {
    if (obj.length !== undefined || isAnyArrayBuffer1(obj.buffer)) {
        if (typeof obj.length !== "number") {
            return createBuffer(0);
        }
        return fromArrayLike(obj);
    }
    if (obj.type === "Buffer" && Array.isArray(obj.data)) {
        return fromArrayLike(obj.data);
    }
}
function checked(length) {
    if (length >= 2147483647) {
        throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + 2147483647..toString(16) + " bytes");
    }
    return length | 0;
}
function SlowBuffer(length) {
    assertSize(length);
    return Buffer.alloc(+length);
}
Object.setPrototypeOf(SlowBuffer.prototype, Uint8Array.prototype);
Object.setPrototypeOf(SlowBuffer, Uint8Array);
Buffer.isBuffer = function isBuffer(b) {
    return b != null && b._isBuffer === true && b !== Buffer.prototype;
};
Buffer.compare = function compare(a, b) {
    if (isInstance(a, Uint8Array)) {
        a = Buffer.from(a, a.offset, a.byteLength);
    }
    if (isInstance(b, Uint8Array)) {
        b = Buffer.from(b, b.offset, b.byteLength);
    }
    if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
        throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
    }
    if (a === b) {
        return 0;
    }
    let x = a.length;
    let y = b.length;
    for(let i = 0, len = Math.min(x, y); i < len; ++i){
        if (a[i] !== b[i]) {
            x = a[i];
            y = b[i];
            break;
        }
    }
    if (x < y) {
        return -1;
    }
    if (y < x) {
        return 1;
    }
    return 0;
};
Buffer.isEncoding = function isEncoding(encoding) {
    return typeof encoding === "string" && encoding.length !== 0 && normalizeEncoding(encoding) !== undefined;
};
Buffer.concat = function concat(list, length) {
    if (!Array.isArray(list)) {
        throw new codes.ERR_INVALID_ARG_TYPE("list", "Array", list);
    }
    if (list.length === 0) {
        return Buffer.alloc(0);
    }
    if (length === undefined) {
        length = 0;
        for(let i = 0; i < list.length; i++){
            if (list[i].length) {
                length += list[i].length;
            }
        }
    } else {
        validateOffset(length, "length");
    }
    const buffer = Buffer.allocUnsafe(length);
    let pos = 0;
    for(let i1 = 0; i1 < list.length; i1++){
        const buf = list[i1];
        if (!isUint8Array(buf)) {
            throw new codes.ERR_INVALID_ARG_TYPE(`list[${i1}]`, [
                "Buffer",
                "Uint8Array"
            ], list[i1]);
        }
        pos += _copyActual(buf, buffer, pos, 0, buf.length);
    }
    if (pos < length) {
        buffer.fill(0, pos, length);
    }
    return buffer;
};
function byteLength(string, encoding) {
    if (typeof string !== "string") {
        if (isArrayBufferView(string) || isAnyArrayBuffer1(string)) {
            return string.byteLength;
        }
        throw new codes.ERR_INVALID_ARG_TYPE("string", [
            "string",
            "Buffer",
            "ArrayBuffer"
        ], string);
    }
    const len = string.length;
    const mustMatch = arguments.length > 2 && arguments[2] === true;
    if (!mustMatch && len === 0) {
        return 0;
    }
    if (!encoding) {
        return mustMatch ? -1 : byteLengthUtf8(string);
    }
    const ops = getEncodingOps(encoding);
    if (ops === undefined) {
        return mustMatch ? -1 : byteLengthUtf8(string);
    }
    return ops.byteLength(string);
}
Buffer.byteLength = byteLength;
Buffer.prototype._isBuffer = true;
function swap(b, n, m) {
    const i = b[n];
    b[n] = b[m];
    b[m] = i;
}
Buffer.prototype.swap16 = function swap16() {
    const len = this.length;
    if (len % 2 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 16-bits");
    }
    for(let i = 0; i < len; i += 2){
        swap(this, i, i + 1);
    }
    return this;
};
Buffer.prototype.swap32 = function swap32() {
    const len = this.length;
    if (len % 4 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 32-bits");
    }
    for(let i = 0; i < len; i += 4){
        swap(this, i, i + 3);
        swap(this, i + 1, i + 2);
    }
    return this;
};
Buffer.prototype.swap64 = function swap64() {
    const len = this.length;
    if (len % 8 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 64-bits");
    }
    for(let i = 0; i < len; i += 8){
        swap(this, i, i + 7);
        swap(this, i + 1, i + 6);
        swap(this, i + 2, i + 5);
        swap(this, i + 3, i + 4);
    }
    return this;
};
Buffer.prototype.toString = function toString(encoding, start, end) {
    if (arguments.length === 0) {
        return this.utf8Slice(0, this.length);
    }
    const len = this.length;
    if (start <= 0) {
        start = 0;
    } else if (start >= len) {
        return "";
    } else {
        start |= 0;
    }
    if (end === undefined || end > len) {
        end = len;
    } else {
        end |= 0;
    }
    if (end <= start) {
        return "";
    }
    if (encoding === undefined) {
        return this.utf8Slice(start, end);
    }
    const ops = getEncodingOps(encoding);
    if (ops === undefined) {
        throw new codes.ERR_UNKNOWN_ENCODING(encoding);
    }
    return ops.slice(this, start, end);
};
Buffer.prototype.toLocaleString = Buffer.prototype.toString;
Buffer.prototype.equals = function equals(b) {
    if (!isUint8Array(b)) {
        throw new codes.ERR_INVALID_ARG_TYPE("otherBuffer", [
            "Buffer",
            "Uint8Array"
        ], b);
    }
    if (this === b) {
        return true;
    }
    return Buffer.compare(this, b) === 0;
};
Buffer.prototype.inspect = function inspect() {
    let str = "";
    const max = INSPECT_MAX_BYTES;
    str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim();
    if (this.length > max) {
        str += " ... ";
    }
    return "<Buffer " + str + ">";
};
if (customInspectSymbol1) {
    Buffer.prototype[customInspectSymbol1] = Buffer.prototype.inspect;
}
Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
    if (isInstance(target, Uint8Array)) {
        target = Buffer.from(target, target.offset, target.byteLength);
    }
    if (!Buffer.isBuffer(target)) {
        throw new codes.ERR_INVALID_ARG_TYPE("target", [
            "Buffer",
            "Uint8Array"
        ], target);
    }
    if (start === undefined) {
        start = 0;
    } else {
        validateOffset(start, "targetStart", 0, kMaxLength);
    }
    if (end === undefined) {
        end = target.length;
    } else {
        validateOffset(end, "targetEnd", 0, target.length);
    }
    if (thisStart === undefined) {
        thisStart = 0;
    } else {
        validateOffset(start, "sourceStart", 0, kMaxLength);
    }
    if (thisEnd === undefined) {
        thisEnd = this.length;
    } else {
        validateOffset(end, "sourceEnd", 0, this.length);
    }
    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new codes.ERR_OUT_OF_RANGE("out of range index", "range");
    }
    if (thisStart >= thisEnd && start >= end) {
        return 0;
    }
    if (thisStart >= thisEnd) {
        return -1;
    }
    if (start >= end) {
        return 1;
    }
    start >>>= 0;
    end >>>= 0;
    thisStart >>>= 0;
    thisEnd >>>= 0;
    if (this === target) {
        return 0;
    }
    let x = thisEnd - thisStart;
    let y = end - start;
    const len = Math.min(x, y);
    const thisCopy = this.slice(thisStart, thisEnd);
    const targetCopy = target.slice(start, end);
    for(let i = 0; i < len; ++i){
        if (thisCopy[i] !== targetCopy[i]) {
            x = thisCopy[i];
            y = targetCopy[i];
            break;
        }
    }
    if (x < y) {
        return -1;
    }
    if (y < x) {
        return 1;
    }
    return 0;
};
function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
    validateBuffer(buffer);
    if (typeof byteOffset === "string") {
        encoding = byteOffset;
        byteOffset = undefined;
    } else if (byteOffset > 0x7fffffff) {
        byteOffset = 0x7fffffff;
    } else if (byteOffset < -0x80000000) {
        byteOffset = -0x80000000;
    }
    byteOffset = +byteOffset;
    if (Number.isNaN(byteOffset)) {
        byteOffset = dir ? 0 : buffer.length || buffer.byteLength;
    }
    dir = !!dir;
    if (typeof val === "number") {
        return indexOfNumber(buffer, val >>> 0, byteOffset, dir);
    }
    let ops;
    if (encoding === undefined) {
        ops = encodingOps.utf8;
    } else {
        ops = getEncodingOps(encoding);
    }
    if (typeof val === "string") {
        if (ops === undefined) {
            throw new codes.ERR_UNKNOWN_ENCODING(encoding);
        }
        return ops.indexOf(buffer, val, byteOffset, dir);
    }
    if (isUint8Array(val)) {
        const encodingVal = ops === undefined ? encodingsMap.utf8 : ops.encodingVal;
        return indexOfBuffer(buffer, val, byteOffset, encodingVal, dir);
    }
    throw new codes.ERR_INVALID_ARG_TYPE("value", [
        "number",
        "string",
        "Buffer",
        "Uint8Array"
    ], val);
}
Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1;
};
Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
};
Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
};
Buffer.prototype.asciiSlice = function asciiSlice(offset, length) {
    if (offset === 0 && length === this.length) {
        return bytesToAscii(this);
    } else {
        return bytesToAscii(this.slice(offset, length));
    }
};
Buffer.prototype.asciiWrite = function asciiWrite(string, offset, length) {
    return blitBuffer(asciiToBytes(string), this, offset, length);
};
Buffer.prototype.base64Slice = function base64Slice(offset, length) {
    if (offset === 0 && length === this.length) {
        return encode(this);
    } else {
        return encode(this.slice(offset, length));
    }
};
Buffer.prototype.base64Write = function base64Write(string, offset, length) {
    return blitBuffer(base64ToBytes(string), this, offset, length);
};
Buffer.prototype.base64urlSlice = function base64urlSlice(offset, length) {
    if (offset === 0 && length === this.length) {
        return encode1(this);
    } else {
        return encode1(this.slice(offset, length));
    }
};
Buffer.prototype.base64urlWrite = function base64urlWrite(string, offset, length) {
    return blitBuffer(base64UrlToBytes(string), this, offset, length);
};
Buffer.prototype.hexWrite = function hexWrite(string, offset, length) {
    return blitBuffer(hexToBytes(string, this.length - offset), this, offset, length);
};
Buffer.prototype.hexSlice = function hexSlice(string, offset, length) {
    return _hexSlice(this, string, offset, length);
};
Buffer.prototype.latin1Slice = function latin1Slice(string, offset, length) {
    return _latin1Slice(this, string, offset, length);
};
Buffer.prototype.latin1Write = function latin1Write(string, offset, length) {
    return blitBuffer(asciiToBytes(string), this, offset, length);
};
Buffer.prototype.ucs2Slice = function ucs2Slice(offset, length) {
    if (offset === 0 && length === this.length) {
        return bytesToUtf16le(this);
    } else {
        return bytesToUtf16le(this.slice(offset, length));
    }
};
Buffer.prototype.ucs2Write = function ucs2Write(string, offset, length) {
    return blitBuffer(utf16leToBytes(string, this.length - offset), this, offset, length);
};
Buffer.prototype.utf8Slice = function utf8Slice(string, offset, length) {
    return _utf8Slice(this, string, offset, length);
};
Buffer.prototype.utf8Write = function utf8Write(string, offset, length) {
    return blitBuffer(utf8ToBytes(string, this.length - offset), this, offset, length);
};
Buffer.prototype.write = function write(string, offset, length, encoding) {
    if (offset === undefined) {
        return this.utf8Write(string, 0, this.length);
    }
    if (length === undefined && typeof offset === "string") {
        encoding = offset;
        length = this.length;
        offset = 0;
    } else {
        validateOffset(offset, "offset", 0, this.length);
        const remaining = this.length - offset;
        if (length === undefined) {
            length = remaining;
        } else if (typeof length === "string") {
            encoding = length;
            length = remaining;
        } else {
            validateOffset(length, "length", 0, this.length);
            if (length > remaining) {
                length = remaining;
            }
        }
    }
    if (!encoding) {
        return this.utf8Write(string, offset, length);
    }
    const ops = getEncodingOps(encoding);
    if (ops === undefined) {
        throw new codes.ERR_UNKNOWN_ENCODING(encoding);
    }
    return ops.write(this, string, offset, length);
};
Buffer.prototype.toJSON = function toJSON() {
    return {
        type: "Buffer",
        data: Array.prototype.slice.call(this._arr || this, 0)
    };
};
function fromArrayBuffer(obj, byteOffset, length) {
    if (byteOffset === undefined) {
        byteOffset = 0;
    } else {
        byteOffset = +byteOffset;
        if (Number.isNaN(byteOffset)) {
            byteOffset = 0;
        }
    }
    const maxLength = obj.byteLength - byteOffset;
    if (maxLength < 0) {
        throw new codes.ERR_BUFFER_OUT_OF_BOUNDS("offset");
    }
    if (length === undefined) {
        length = maxLength;
    } else {
        length = +length;
        if (length > 0) {
            if (length > maxLength) {
                throw new codes.ERR_BUFFER_OUT_OF_BOUNDS("length");
            }
        } else {
            length = 0;
        }
    }
    const buffer = new Uint8Array(obj, byteOffset, length);
    Object.setPrototypeOf(buffer, Buffer.prototype);
    return buffer;
}
function _utf8Slice(buf, start, end) {
    end = Math.min(buf.length, end);
    const res = [];
    let i = start;
    while(i < end){
        const firstByte = buf[i];
        let codePoint = null;
        let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
        if (i + bytesPerSequence <= end) {
            let secondByte, thirdByte, fourthByte, tempCodePoint;
            switch(bytesPerSequence){
                case 1:
                    if (firstByte < 128) {
                        codePoint = firstByte;
                    }
                    break;
                case 2:
                    secondByte = buf[i + 1];
                    if ((secondByte & 192) === 128) {
                        tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
                        if (tempCodePoint > 127) {
                            codePoint = tempCodePoint;
                        }
                    }
                    break;
                case 3:
                    secondByte = buf[i + 1];
                    thirdByte = buf[i + 2];
                    if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                        tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
                        if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                            codePoint = tempCodePoint;
                        }
                    }
                    break;
                case 4:
                    secondByte = buf[i + 1];
                    thirdByte = buf[i + 2];
                    fourthByte = buf[i + 3];
                    if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                        tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
                        if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                            codePoint = tempCodePoint;
                        }
                    }
            }
        }
        if (codePoint === null) {
            codePoint = 65533;
            bytesPerSequence = 1;
        } else if (codePoint > 65535) {
            codePoint -= 65536;
            res.push(codePoint >>> 10 & 1023 | 55296);
            codePoint = 56320 | codePoint & 1023;
        }
        res.push(codePoint);
        i += bytesPerSequence;
    }
    return decodeCodePointsArray(res);
}
const MAX_ARGUMENTS_LENGTH = 4096;
function decodeCodePointsArray(codePoints) {
    const len = codePoints.length;
    if (len <= 4096) {
        return String.fromCharCode.apply(String, codePoints);
    }
    let res = "";
    let i = 0;
    while(i < len){
        res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
    }
    return res;
}
function _latin1Slice(buf, start, end) {
    let ret = "";
    end = Math.min(buf.length, end);
    for(let i = start; i < end; ++i){
        ret += String.fromCharCode(buf[i]);
    }
    return ret;
}
function _hexSlice(buf, start, end) {
    const len = buf.length;
    if (!start || start < 0) {
        start = 0;
    }
    if (!end || end < 0 || end > len) {
        end = len;
    }
    let out = "";
    for(let i = start; i < end; ++i){
        out += hexSliceLookupTable[buf[i]];
    }
    return out;
}
Buffer.prototype.slice = function slice(start, end) {
    const len = this.length;
    start = ~~start;
    end = end === void 0 ? len : ~~end;
    if (start < 0) {
        start += len;
        if (start < 0) {
            start = 0;
        }
    } else if (start > len) {
        start = len;
    }
    if (end < 0) {
        end += len;
        if (end < 0) {
            end = 0;
        }
    } else if (end > len) {
        end = len;
    }
    if (end < start) {
        end = start;
    }
    const newBuf = this.subarray(start, end);
    Object.setPrototypeOf(newBuf, Buffer.prototype);
    return newBuf;
};
Buffer.prototype.readUintLE = Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength) {
    if (offset === undefined) {
        throw new codes.ERR_INVALID_ARG_TYPE("offset", "number", offset);
    }
    if (byteLength === 6) {
        return readUInt48LE(this, offset);
    }
    if (byteLength === 5) {
        return readUInt40LE(this, offset);
    }
    if (byteLength === 3) {
        return readUInt24LE(this, offset);
    }
    if (byteLength === 4) {
        return this.readUInt32LE(offset);
    }
    if (byteLength === 2) {
        return this.readUInt16LE(offset);
    }
    if (byteLength === 1) {
        return this.readUInt8(offset);
    }
    boundsError(byteLength, 6, "byteLength");
};
Buffer.prototype.readUintBE = Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength) {
    if (offset === undefined) {
        throw new codes.ERR_INVALID_ARG_TYPE("offset", "number", offset);
    }
    if (byteLength === 6) {
        return readUInt48BE(this, offset);
    }
    if (byteLength === 5) {
        return readUInt40BE(this, offset);
    }
    if (byteLength === 3) {
        return readUInt24BE(this, offset);
    }
    if (byteLength === 4) {
        return this.readUInt32BE(offset);
    }
    if (byteLength === 2) {
        return this.readUInt16BE(offset);
    }
    if (byteLength === 1) {
        return this.readUInt8(offset);
    }
    boundsError(byteLength, 6, "byteLength");
};
Buffer.prototype.readUint8 = Buffer.prototype.readUInt8 = function readUInt8(offset = 0) {
    validateNumber(offset, "offset");
    const val = this[offset];
    if (val === undefined) {
        boundsError(offset, this.length - 1);
    }
    return val;
};
Buffer.prototype.readUint16BE = Buffer.prototype.readUInt16BE = readUInt16BE;
Buffer.prototype.readUint16LE = Buffer.prototype.readUInt16LE = function readUInt16LE(offset = 0) {
    validateNumber(offset, "offset");
    const first = this[offset];
    const last = this[offset + 1];
    if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 2);
    }
    return first + last * 2 ** 8;
};
Buffer.prototype.readUint32LE = Buffer.prototype.readUInt32LE = function readUInt32LE(offset = 0) {
    validateNumber(offset, "offset");
    const first = this[offset];
    const last = this[offset + 3];
    if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 4);
    }
    return first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
};
Buffer.prototype.readUint32BE = Buffer.prototype.readUInt32BE = readUInt32BE;
Buffer.prototype.readBigUint64LE = Buffer.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, "offset");
    const first = this[offset];
    const last = this[offset + 7];
    if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
    }
    const lo = first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24;
    const hi = this[++offset] + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
    return BigInt(lo) + (BigInt(hi) << BigInt(32));
});
Buffer.prototype.readBigUint64BE = Buffer.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, "offset");
    const first = this[offset];
    const last = this[offset + 7];
    if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
    }
    const hi = first * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
    const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
    return (BigInt(hi) << BigInt(32)) + BigInt(lo);
});
Buffer.prototype.readIntLE = function readIntLE(offset, byteLength) {
    if (offset === undefined) {
        throw new codes.ERR_INVALID_ARG_TYPE("offset", "number", offset);
    }
    if (byteLength === 6) {
        return readInt48LE(this, offset);
    }
    if (byteLength === 5) {
        return readInt40LE(this, offset);
    }
    if (byteLength === 3) {
        return readInt24LE(this, offset);
    }
    if (byteLength === 4) {
        return this.readInt32LE(offset);
    }
    if (byteLength === 2) {
        return this.readInt16LE(offset);
    }
    if (byteLength === 1) {
        return this.readInt8(offset);
    }
    boundsError(byteLength, 6, "byteLength");
};
Buffer.prototype.readIntBE = function readIntBE(offset, byteLength) {
    if (offset === undefined) {
        throw new codes.ERR_INVALID_ARG_TYPE("offset", "number", offset);
    }
    if (byteLength === 6) {
        return readInt48BE(this, offset);
    }
    if (byteLength === 5) {
        return readInt40BE(this, offset);
    }
    if (byteLength === 3) {
        return readInt24BE(this, offset);
    }
    if (byteLength === 4) {
        return this.readInt32BE(offset);
    }
    if (byteLength === 2) {
        return this.readInt16BE(offset);
    }
    if (byteLength === 1) {
        return this.readInt8(offset);
    }
    boundsError(byteLength, 6, "byteLength");
};
Buffer.prototype.readInt8 = function readInt8(offset = 0) {
    validateNumber(offset, "offset");
    const val = this[offset];
    if (val === undefined) {
        boundsError(offset, this.length - 1);
    }
    return val | (val & 2 ** 7) * 0x1fffffe;
};
Buffer.prototype.readInt16LE = function readInt16LE(offset = 0) {
    validateNumber(offset, "offset");
    const first = this[offset];
    const last = this[offset + 1];
    if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 2);
    }
    const val = first + last * 2 ** 8;
    return val | (val & 2 ** 15) * 0x1fffe;
};
Buffer.prototype.readInt16BE = function readInt16BE(offset = 0) {
    validateNumber(offset, "offset");
    const first = this[offset];
    const last = this[offset + 1];
    if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 2);
    }
    const val = first * 2 ** 8 + last;
    return val | (val & 2 ** 15) * 0x1fffe;
};
Buffer.prototype.readInt32LE = function readInt32LE(offset = 0) {
    validateNumber(offset, "offset");
    const first = this[offset];
    const last = this[offset + 3];
    if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 4);
    }
    return first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + (last << 24);
};
Buffer.prototype.readInt32BE = function readInt32BE(offset = 0) {
    validateNumber(offset, "offset");
    const first = this[offset];
    const last = this[offset + 3];
    if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 4);
    }
    return (first << 24) + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
};
Buffer.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, "offset");
    const first = this[offset];
    const last = this[offset + 7];
    if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
    }
    const val = this[offset + 4] + this[offset + 5] * 2 ** 8 + this[offset + 6] * 2 ** 16 + (last << 24);
    return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24);
});
Buffer.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, "offset");
    const first = this[offset];
    const last = this[offset + 7];
    if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
    }
    const val = (first << 24) + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
    return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last);
});
Buffer.prototype.readFloatLE = function readFloatLE(offset) {
    return bigEndian ? readFloatBackwards(this, offset) : readFloatForwards(this, offset);
};
Buffer.prototype.readFloatBE = function readFloatBE(offset) {
    return bigEndian ? readFloatForwards(this, offset) : readFloatBackwards(this, offset);
};
Buffer.prototype.readDoubleLE = function readDoubleLE(offset) {
    return bigEndian ? readDoubleBackwards(this, offset) : readDoubleForwards(this, offset);
};
Buffer.prototype.readDoubleBE = function readDoubleBE(offset) {
    return bigEndian ? readDoubleForwards(this, offset) : readDoubleBackwards(this, offset);
};
Buffer.prototype.writeUintLE = Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength) {
    if (byteLength === 6) {
        return writeU_Int48LE(this, value, offset, 0, 0xffffffffffff);
    }
    if (byteLength === 5) {
        return writeU_Int40LE(this, value, offset, 0, 0xffffffffff);
    }
    if (byteLength === 3) {
        return writeU_Int24LE(this, value, offset, 0, 0xffffff);
    }
    if (byteLength === 4) {
        return writeU_Int32LE(this, value, offset, 0, 0xffffffff);
    }
    if (byteLength === 2) {
        return writeU_Int16LE(this, value, offset, 0, 0xffff);
    }
    if (byteLength === 1) {
        return writeU_Int8(this, value, offset, 0, 0xff);
    }
    boundsError(byteLength, 6, "byteLength");
};
Buffer.prototype.writeUintBE = Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength) {
    if (byteLength === 6) {
        return writeU_Int48BE(this, value, offset, 0, 0xffffffffffff);
    }
    if (byteLength === 5) {
        return writeU_Int40BE(this, value, offset, 0, 0xffffffffff);
    }
    if (byteLength === 3) {
        return writeU_Int24BE(this, value, offset, 0, 0xffffff);
    }
    if (byteLength === 4) {
        return writeU_Int32BE(this, value, offset, 0, 0xffffffff);
    }
    if (byteLength === 2) {
        return writeU_Int16BE(this, value, offset, 0, 0xffff);
    }
    if (byteLength === 1) {
        return writeU_Int8(this, value, offset, 0, 0xff);
    }
    boundsError(byteLength, 6, "byteLength");
};
Buffer.prototype.writeUint8 = Buffer.prototype.writeUInt8 = function writeUInt8(value, offset = 0) {
    return writeU_Int8(this, value, offset, 0, 0xff);
};
Buffer.prototype.writeUint16LE = Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset = 0) {
    return writeU_Int16LE(this, value, offset, 0, 0xffff);
};
Buffer.prototype.writeUint16BE = Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset = 0) {
    return writeU_Int16BE(this, value, offset, 0, 0xffff);
};
Buffer.prototype.writeUint32LE = Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset = 0) {
    return _writeUInt32LE(this, value, offset, 0, 0xffffffff);
};
Buffer.prototype.writeUint32BE = Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset = 0) {
    return _writeUInt32BE(this, value, offset, 0, 0xffffffff);
};
function wrtBigUInt64LE(buf, value, offset, min, max) {
    checkIntBI(value, min, max, buf, offset, 7);
    let lo = Number(value & BigInt(4294967295));
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    let hi = Number(value >> BigInt(32) & BigInt(4294967295));
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    return offset;
}
function wrtBigUInt64BE(buf, value, offset, min, max) {
    checkIntBI(value, min, max, buf, offset, 7);
    let lo = Number(value & BigInt(4294967295));
    buf[offset + 7] = lo;
    lo = lo >> 8;
    buf[offset + 6] = lo;
    lo = lo >> 8;
    buf[offset + 5] = lo;
    lo = lo >> 8;
    buf[offset + 4] = lo;
    let hi = Number(value >> BigInt(32) & BigInt(4294967295));
    buf[offset + 3] = hi;
    hi = hi >> 8;
    buf[offset + 2] = hi;
    hi = hi >> 8;
    buf[offset + 1] = hi;
    hi = hi >> 8;
    buf[offset] = hi;
    return offset + 8;
}
Buffer.prototype.writeBigUint64LE = Buffer.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
    return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
});
Buffer.prototype.writeBigUint64BE = Buffer.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
    return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
});
Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength) {
    if (byteLength === 6) {
        return writeU_Int48LE(this, value, offset, -0x800000000000, 0x7fffffffffff);
    }
    if (byteLength === 5) {
        return writeU_Int40LE(this, value, offset, -0x8000000000, 0x7fffffffff);
    }
    if (byteLength === 3) {
        return writeU_Int24LE(this, value, offset, -0x800000, 0x7fffff);
    }
    if (byteLength === 4) {
        return writeU_Int32LE(this, value, offset, -0x80000000, 0x7fffffff);
    }
    if (byteLength === 2) {
        return writeU_Int16LE(this, value, offset, -0x8000, 0x7fff);
    }
    if (byteLength === 1) {
        return writeU_Int8(this, value, offset, -0x80, 0x7f);
    }
    boundsError(byteLength, 6, "byteLength");
};
Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength) {
    if (byteLength === 6) {
        return writeU_Int48BE(this, value, offset, -0x800000000000, 0x7fffffffffff);
    }
    if (byteLength === 5) {
        return writeU_Int40BE(this, value, offset, -0x8000000000, 0x7fffffffff);
    }
    if (byteLength === 3) {
        return writeU_Int24BE(this, value, offset, -0x800000, 0x7fffff);
    }
    if (byteLength === 4) {
        return writeU_Int32BE(this, value, offset, -0x80000000, 0x7fffffff);
    }
    if (byteLength === 2) {
        return writeU_Int16BE(this, value, offset, -0x8000, 0x7fff);
    }
    if (byteLength === 1) {
        return writeU_Int8(this, value, offset, -0x80, 0x7f);
    }
    boundsError(byteLength, 6, "byteLength");
};
Buffer.prototype.writeInt8 = function writeInt8(value, offset = 0) {
    return writeU_Int8(this, value, offset, -0x80, 0x7f);
};
Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset = 0) {
    return writeU_Int16LE(this, value, offset, -0x8000, 0x7fff);
};
Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset = 0) {
    return writeU_Int16BE(this, value, offset, -0x8000, 0x7fff);
};
Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset = 0) {
    return writeU_Int32LE(this, value, offset, -0x80000000, 0x7fffffff);
};
Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset = 0) {
    return writeU_Int32BE(this, value, offset, -0x80000000, 0x7fffffff);
};
Buffer.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
    return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
});
Buffer.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
    return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
});
Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset) {
    return bigEndian ? writeFloatBackwards(this, value, offset) : writeFloatForwards(this, value, offset);
};
Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset) {
    return bigEndian ? writeFloatForwards(this, value, offset) : writeFloatBackwards(this, value, offset);
};
Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset) {
    return bigEndian ? writeDoubleBackwards(this, value, offset) : writeDoubleForwards(this, value, offset);
};
Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset) {
    return bigEndian ? writeDoubleForwards(this, value, offset) : writeDoubleBackwards(this, value, offset);
};
Buffer.prototype.copy = function copy(target, targetStart, sourceStart, sourceEnd) {
    if (!isUint8Array(this)) {
        throw new codes.ERR_INVALID_ARG_TYPE("source", [
            "Buffer",
            "Uint8Array"
        ], this);
    }
    if (!isUint8Array(target)) {
        throw new codes.ERR_INVALID_ARG_TYPE("target", [
            "Buffer",
            "Uint8Array"
        ], target);
    }
    if (targetStart === undefined) {
        targetStart = 0;
    } else {
        targetStart = toInteger(targetStart, 0);
        if (targetStart < 0) {
            throw new codes.ERR_OUT_OF_RANGE("targetStart", ">= 0", targetStart);
        }
    }
    if (sourceStart === undefined) {
        sourceStart = 0;
    } else {
        sourceStart = toInteger(sourceStart, 0);
        if (sourceStart < 0) {
            throw new codes.ERR_OUT_OF_RANGE("sourceStart", ">= 0", sourceStart);
        }
        if (sourceStart >= MAX_UINT32) {
            throw new codes.ERR_OUT_OF_RANGE("sourceStart", `< ${MAX_UINT32}`, sourceStart);
        }
    }
    if (sourceEnd === undefined) {
        sourceEnd = this.length;
    } else {
        sourceEnd = toInteger(sourceEnd, 0);
        if (sourceEnd < 0) {
            throw new codes.ERR_OUT_OF_RANGE("sourceEnd", ">= 0", sourceEnd);
        }
        if (sourceEnd >= MAX_UINT32) {
            throw new codes.ERR_OUT_OF_RANGE("sourceEnd", `< ${MAX_UINT32}`, sourceEnd);
        }
    }
    if (targetStart >= target.length) {
        return 0;
    }
    if (sourceEnd > 0 && sourceEnd < sourceStart) {
        sourceEnd = sourceStart;
    }
    if (sourceEnd === sourceStart) {
        return 0;
    }
    if (target.length === 0 || this.length === 0) {
        return 0;
    }
    if (sourceEnd > this.length) {
        sourceEnd = this.length;
    }
    if (target.length - targetStart < sourceEnd - sourceStart) {
        sourceEnd = target.length - targetStart + sourceStart;
    }
    const len = sourceEnd - sourceStart;
    if (this === target && typeof Uint8Array.prototype.copyWithin === "function") {
        this.copyWithin(targetStart, sourceStart, sourceEnd);
    } else {
        Uint8Array.prototype.set.call(target, this.subarray(sourceStart, sourceEnd), targetStart);
    }
    return len;
};
Buffer.prototype.fill = function fill(val, start, end, encoding) {
    if (typeof val === "string") {
        if (typeof start === "string") {
            encoding = start;
            start = 0;
            end = this.length;
        } else if (typeof end === "string") {
            encoding = end;
            end = this.length;
        }
        if (encoding !== void 0 && typeof encoding !== "string") {
            throw new TypeError("encoding must be a string");
        }
        if (typeof encoding === "string" && !Buffer.isEncoding(encoding)) {
            throw new TypeError("Unknown encoding: " + encoding);
        }
        if (val.length === 1) {
            const code = val.charCodeAt(0);
            if (encoding === "utf8" && code < 128 || encoding === "latin1") {
                val = code;
            }
        }
    } else if (typeof val === "number") {
        val = val & 255;
    } else if (typeof val === "boolean") {
        val = Number(val);
    }
    if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError("Out of range index");
    }
    if (end <= start) {
        return this;
    }
    start = start >>> 0;
    end = end === void 0 ? this.length : end >>> 0;
    if (!val) {
        val = 0;
    }
    let i;
    if (typeof val === "number") {
        for(i = start; i < end; ++i){
            this[i] = val;
        }
    } else {
        const bytes = Buffer.isBuffer(val) ? val : Buffer.from(val, encoding);
        const len = bytes.length;
        if (len === 0) {
            throw new codes.ERR_INVALID_ARG_VALUE("value", val);
        }
        for(i = 0; i < end - start; ++i){
            this[i + start] = bytes[i % len];
        }
    }
    return this;
};
function checkBounds1(buf, offset, byteLength2) {
    validateNumber(offset, "offset");
    if (buf[offset] === void 0 || buf[offset + byteLength2] === void 0) {
        boundsError(offset, buf.length - (byteLength2 + 1));
    }
}
function checkIntBI(value, min, max, buf, offset, byteLength2) {
    if (value > max || value < min) {
        const n = typeof min === "bigint" ? "n" : "";
        let range;
        if (byteLength2 > 3) {
            if (min === 0 || min === BigInt(0)) {
                range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
            } else {
                range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
            }
        } else {
            range = `>= ${min}${n} and <= ${max}${n}`;
        }
        throw new codes.ERR_OUT_OF_RANGE("value", range, value);
    }
    checkBounds1(buf, offset, byteLength2);
}
function utf8ToBytes(string, units) {
    units = units || Infinity;
    let codePoint;
    const length = string.length;
    let leadSurrogate = null;
    const bytes = [];
    for(let i = 0; i < length; ++i){
        codePoint = string.charCodeAt(i);
        if (codePoint > 55295 && codePoint < 57344) {
            if (!leadSurrogate) {
                if (codePoint > 56319) {
                    if ((units -= 3) > -1) {
                        bytes.push(239, 191, 189);
                    }
                    continue;
                } else if (i + 1 === length) {
                    if ((units -= 3) > -1) {
                        bytes.push(239, 191, 189);
                    }
                    continue;
                }
                leadSurrogate = codePoint;
                continue;
            }
            if (codePoint < 56320) {
                if ((units -= 3) > -1) {
                    bytes.push(239, 191, 189);
                }
                leadSurrogate = codePoint;
                continue;
            }
            codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
        } else if (leadSurrogate) {
            if ((units -= 3) > -1) {
                bytes.push(239, 191, 189);
            }
        }
        leadSurrogate = null;
        if (codePoint < 128) {
            if ((units -= 1) < 0) {
                break;
            }
            bytes.push(codePoint);
        } else if (codePoint < 2048) {
            if ((units -= 2) < 0) {
                break;
            }
            bytes.push(codePoint >> 6 | 192, codePoint & 63 | 128);
        } else if (codePoint < 65536) {
            if ((units -= 3) < 0) {
                break;
            }
            bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
        } else if (codePoint < 1114112) {
            if ((units -= 4) < 0) {
                break;
            }
            bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
        } else {
            throw new Error("Invalid code point");
        }
    }
    return bytes;
}
function blitBuffer(src, dst, offset, byteLength) {
    let i;
    const length = byteLength === undefined ? src.length : byteLength;
    for(i = 0; i < length; ++i){
        if (i + offset >= dst.length || i >= src.length) {
            break;
        }
        dst[i + offset] = src[i];
    }
    return i;
}
function isInstance(obj, type) {
    return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
}
const hexSliceLookupTable = function() {
    const alphabet = "0123456789abcdef";
    const table = new Array(256);
    for(let i = 0; i < 16; ++i){
        const i16 = i * 16;
        for(let j = 0; j < 16; ++j){
            table[i16 + j] = alphabet[i] + alphabet[j];
        }
    }
    return table;
}();
function defineBigIntMethod(fn) {
    return typeof BigInt === "undefined" ? BufferBigIntNotDefined : fn;
}
function BufferBigIntNotDefined() {
    throw new Error("BigInt not supported");
}
globalThis.atob;
globalThis.Blob;
globalThis.btoa;
var valueType;
(function(valueType) {
    valueType[valueType["noIterator"] = 0] = "noIterator";
    valueType[valueType["isArray"] = 1] = "isArray";
    valueType[valueType["isSet"] = 2] = "isSet";
    valueType[valueType["isMap"] = 3] = "isMap";
})(valueType || (valueType = {}));
let memo;
function innerDeepEqual(val1, val2, strict, memos = memo) {
    if (val1 === val2) {
        if (val1 !== 0) return true;
        return strict ? Object.is(val1, val2) : true;
    }
    if (strict) {
        if (typeof val1 !== "object") {
            return typeof val1 === "number" && Number.isNaN(val1) && Number.isNaN(val2);
        }
        if (typeof val2 !== "object" || val1 === null || val2 === null) {
            return false;
        }
        if (Object.getPrototypeOf(val1) !== Object.getPrototypeOf(val2)) {
            return false;
        }
    } else {
        if (val1 === null || typeof val1 !== "object") {
            if (val2 === null || typeof val2 !== "object") {
                return val1 == val2 || Number.isNaN(val1) && Number.isNaN(val2);
            }
            return false;
        }
        if (val2 === null || typeof val2 !== "object") {
            return false;
        }
    }
    const val1Tag = Object.prototype.toString.call(val1);
    const val2Tag = Object.prototype.toString.call(val2);
    if (val1Tag !== val2Tag) {
        return false;
    }
    if (Array.isArray(val1)) {
        if (!Array.isArray(val2) || val1.length !== val2.length) {
            return false;
        }
        const filter = strict ? 2 : 2 | 16;
        const keys1 = getOwnNonIndexProperties(val1, filter);
        const keys2 = getOwnNonIndexProperties(val2, filter);
        if (keys1.length !== keys2.length) {
            return false;
        }
        return keyCheck(val1, val2, strict, memos, valueType.isArray, keys1);
    } else if (val1Tag === "[object Object]") {
        return keyCheck(val1, val2, strict, memos, valueType.noIterator);
    } else if (val1 instanceof Date) {
        if (!(val2 instanceof Date) || val1.getTime() !== val2.getTime()) {
            return false;
        }
    } else if (val1 instanceof RegExp) {
        if (!(val2 instanceof RegExp) || !areSimilarRegExps(val1, val2)) {
            return false;
        }
    } else if (isNativeError1(val1) || val1 instanceof Error) {
        if (!isNativeError1(val2) && !(val2 instanceof Error) || val1.message !== val2.message || val1.name !== val2.name) {
            return false;
        }
    } else if (isArrayBufferView(val1)) {
        const TypedArrayPrototypeGetSymbolToStringTag = (val)=>Object.getOwnPropertySymbols(val).map((item)=>item.toString()).toString();
        if (isTypedArray(val1) && isTypedArray(val2) && TypedArrayPrototypeGetSymbolToStringTag(val1) !== TypedArrayPrototypeGetSymbolToStringTag(val2)) {
            return false;
        }
        if (!strict && (isFloat32Array(val1) || isFloat64Array(val1))) {
            if (!areSimilarFloatArrays(val1, val2)) {
                return false;
            }
        } else if (!areSimilarTypedArrays(val1, val2)) {
            return false;
        }
        const filter1 = strict ? 2 : 2 | 16;
        const keysVal1 = getOwnNonIndexProperties(val1, filter1);
        const keysVal2 = getOwnNonIndexProperties(val2, filter1);
        if (keysVal1.length !== keysVal2.length) {
            return false;
        }
        return keyCheck(val1, val2, strict, memos, valueType.noIterator, keysVal1);
    } else if (isSet1(val1)) {
        if (!isSet1(val2) || val1.size !== val2.size) {
            return false;
        }
        return keyCheck(val1, val2, strict, memos, valueType.isSet);
    } else if (isMap1(val1)) {
        if (!isMap1(val2) || val1.size !== val2.size) {
            return false;
        }
        return keyCheck(val1, val2, strict, memos, valueType.isMap);
    } else if (isAnyArrayBuffer1(val1)) {
        if (!isAnyArrayBuffer1(val2) || !areEqualArrayBuffers(val1, val2)) {
            return false;
        }
    } else if (isBoxedPrimitive1(val1)) {
        if (!isEqualBoxedPrimitive(val1, val2)) {
            return false;
        }
    } else if (Array.isArray(val2) || isArrayBufferView(val2) || isSet1(val2) || isMap1(val2) || isDate1(val2) || isRegExp1(val2) || isAnyArrayBuffer1(val2) || isBoxedPrimitive1(val2) || isNativeError1(val2) || val2 instanceof Error) {
        return false;
    }
    return keyCheck(val1, val2, strict, memos, valueType.noIterator);
}
function keyCheck(val1, val2, strict, memos, iterationType, aKeys = []) {
    if (arguments.length === 5) {
        aKeys = Object.keys(val1);
        const bKeys = Object.keys(val2);
        if (aKeys.length !== bKeys.length) {
            return false;
        }
    }
    let i = 0;
    for(; i < aKeys.length; i++){
        if (!val2.propertyIsEnumerable(aKeys[i])) {
            return false;
        }
    }
    if (strict && arguments.length === 5) {
        const symbolKeysA = Object.getOwnPropertySymbols(val1);
        if (symbolKeysA.length !== 0) {
            let count = 0;
            for(i = 0; i < symbolKeysA.length; i++){
                const key = symbolKeysA[i];
                if (val1.propertyIsEnumerable(key)) {
                    if (!val2.propertyIsEnumerable(key)) {
                        return false;
                    }
                    aKeys.push(key.toString());
                    count++;
                } else if (val2.propertyIsEnumerable(key)) {
                    return false;
                }
            }
            const symbolKeysB = Object.getOwnPropertySymbols(val2);
            if (symbolKeysA.length !== symbolKeysB.length && getEnumerables(val2, symbolKeysB).length !== count) {
                return false;
            }
        } else {
            const symbolKeysB1 = Object.getOwnPropertySymbols(val2);
            if (symbolKeysB1.length !== 0 && getEnumerables(val2, symbolKeysB1).length !== 0) {
                return false;
            }
        }
    }
    if (aKeys.length === 0 && (iterationType === valueType.noIterator || iterationType === valueType.isArray && val1.length === 0 || val1.size === 0)) {
        return true;
    }
    if (memos === undefined) {
        memos = {
            val1: new Map(),
            val2: new Map(),
            position: 0
        };
    } else {
        const val2MemoA = memos.val1.get(val1);
        if (val2MemoA !== undefined) {
            const val2MemoB = memos.val2.get(val2);
            if (val2MemoB !== undefined) {
                return val2MemoA === val2MemoB;
            }
        }
        memos.position++;
    }
    memos.val1.set(val1, memos.position);
    memos.val2.set(val2, memos.position);
    const areEq = objEquiv(val1, val2, strict, aKeys, memos, iterationType);
    memos.val1.delete(val1);
    memos.val2.delete(val2);
    return areEq;
}
function areSimilarRegExps(a, b) {
    return a.source === b.source && a.flags === b.flags && a.lastIndex === b.lastIndex;
}
function areSimilarFloatArrays(arr1, arr2) {
    if (arr1.byteLength !== arr2.byteLength) {
        return false;
    }
    for(let i = 0; i < arr1.byteLength; i++){
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
}
function areSimilarTypedArrays(arr1, arr2) {
    if (arr1.byteLength !== arr2.byteLength) {
        return false;
    }
    return Buffer.compare(new Uint8Array(arr1.buffer, arr1.byteOffset, arr1.byteLength), new Uint8Array(arr2.buffer, arr2.byteOffset, arr2.byteLength)) === 0;
}
function areEqualArrayBuffers(buf1, buf2) {
    return buf1.byteLength === buf2.byteLength && Buffer.compare(new Uint8Array(buf1), new Uint8Array(buf2)) === 0;
}
function isEqualBoxedPrimitive(a, b) {
    if (Object.getOwnPropertyNames(a).length !== Object.getOwnPropertyNames(b).length) {
        return false;
    }
    if (Object.getOwnPropertySymbols(a).length !== Object.getOwnPropertySymbols(b).length) {
        return false;
    }
    if (isNumberObject1(a)) {
        return isNumberObject1(b) && Object.is(Number.prototype.valueOf.call(a), Number.prototype.valueOf.call(b));
    }
    if (isStringObject1(a)) {
        return isStringObject1(b) && String.prototype.valueOf.call(a) === String.prototype.valueOf.call(b);
    }
    if (isBooleanObject1(a)) {
        return isBooleanObject1(b) && Boolean.prototype.valueOf.call(a) === Boolean.prototype.valueOf.call(b);
    }
    if (isBigIntObject1(a)) {
        return isBigIntObject1(b) && BigInt.prototype.valueOf.call(a) === BigInt.prototype.valueOf.call(b);
    }
    if (isSymbolObject1(a)) {
        return isSymbolObject1(b) && Symbol.prototype.valueOf.call(a) === Symbol.prototype.valueOf.call(b);
    }
    throw Error(`Unknown boxed type`);
}
function getEnumerables(val, keys) {
    return keys.filter((key)=>val.propertyIsEnumerable(key));
}
function objEquiv(obj1, obj2, strict, keys, memos, iterationType) {
    let i = 0;
    if (iterationType === valueType.isSet) {
        if (!setEquiv(obj1, obj2, strict, memos)) {
            return false;
        }
    } else if (iterationType === valueType.isMap) {
        if (!mapEquiv(obj1, obj2, strict, memos)) {
            return false;
        }
    } else if (iterationType === valueType.isArray) {
        for(; i < obj1.length; i++){
            if (obj1.hasOwnProperty(i)) {
                if (!obj2.hasOwnProperty(i) || !innerDeepEqual(obj1[i], obj2[i], strict, memos)) {
                    return false;
                }
            } else if (obj2.hasOwnProperty(i)) {
                return false;
            } else {
                const keys1 = Object.keys(obj1);
                for(; i < keys1.length; i++){
                    const key = keys1[i];
                    if (!obj2.hasOwnProperty(key) || !innerDeepEqual(obj1[key], obj2[key], strict, memos)) {
                        return false;
                    }
                }
                if (keys1.length !== Object.keys(obj2).length) {
                    return false;
                }
                if (keys1.length !== Object.keys(obj2).length) {
                    return false;
                }
                return true;
            }
        }
    }
    for(i = 0; i < keys.length; i++){
        const key1 = keys[i];
        if (!innerDeepEqual(obj1[key1], obj2[key1], strict, memos)) {
            return false;
        }
    }
    return true;
}
function findLooseMatchingPrimitives(primitive) {
    switch(typeof primitive){
        case "undefined":
            return null;
        case "object":
            return undefined;
        case "symbol":
            return false;
        case "string":
            primitive = +primitive;
        case "number":
            if (Number.isNaN(primitive)) {
                return false;
            }
    }
    return true;
}
function setMightHaveLoosePrim(set1, set2, primitive) {
    const altValue = findLooseMatchingPrimitives(primitive);
    if (altValue != null) return altValue;
    return set2.has(altValue) && !set1.has(altValue);
}
function setHasEqualElement(set, val1, strict, memos) {
    for (const val2 of set){
        if (innerDeepEqual(val1, val2, strict, memos)) {
            set.delete(val2);
            return true;
        }
    }
    return false;
}
function setEquiv(set1, set2, strict, memos) {
    let set = null;
    for (const item of set1){
        if (typeof item === "object" && item !== null) {
            if (set === null) {
                set = new Set();
            }
            set.add(item);
        } else if (!set2.has(item)) {
            if (strict) return false;
            if (!setMightHaveLoosePrim(set1, set2, item)) {
                return false;
            }
            if (set === null) {
                set = new Set();
            }
            set.add(item);
        }
    }
    if (set !== null) {
        for (const item1 of set2){
            if (typeof item1 === "object" && item1 !== null) {
                if (!setHasEqualElement(set, item1, strict, memos)) return false;
            } else if (!strict && !set1.has(item1) && !setHasEqualElement(set, item1, strict, memos)) {
                return false;
            }
        }
        return set.size === 0;
    }
    return true;
}
function mapMightHaveLoosePrimitive(map1, map2, primitive, item, memos) {
    const altValue = findLooseMatchingPrimitives(primitive);
    if (altValue != null) {
        return altValue;
    }
    const curB = map2.get(altValue);
    if (curB === undefined && !map2.has(altValue) || !innerDeepEqual(item, curB, false, memo)) {
        return false;
    }
    return !map1.has(altValue) && innerDeepEqual(item, curB, false, memos);
}
function mapEquiv(map1, map2, strict, memos) {
    let set = null;
    for (const { 0: key , 1: item1  } of map1){
        if (typeof key === "object" && key !== null) {
            if (set === null) {
                set = new Set();
            }
            set.add(key);
        } else {
            const item2 = map2.get(key);
            if (item2 === undefined && !map2.has(key) || !innerDeepEqual(item1, item2, strict, memos)) {
                if (strict) return false;
                if (!mapMightHaveLoosePrimitive(map1, map2, key, item1, memos)) {
                    return false;
                }
                if (set === null) {
                    set = new Set();
                }
                set.add(key);
            }
        }
    }
    if (set !== null) {
        for (const { 0: key1 , 1: item  } of map2){
            if (typeof key1 === "object" && key1 !== null) {
                if (!mapHasEqualEntry(set, map1, key1, item, strict, memos)) {
                    return false;
                }
            } else if (!strict && (!map1.has(key1) || !innerDeepEqual(map1.get(key1), item, false, memos)) && !mapHasEqualEntry(set, map1, key1, item, false, memos)) {
                return false;
            }
        }
        return set.size === 0;
    }
    return true;
}
function mapHasEqualEntry(set, map, key1, item1, strict, memos) {
    for (const key2 of set){
        if (innerDeepEqual(key1, key2, strict, memos) && innerDeepEqual(item1, map.get(key2), strict, memos)) {
            set.delete(key2);
            return true;
        }
    }
    return false;
}
const NumberIsSafeInteger = Number.isSafeInteger;
function getSystemErrorName(code) {
    if (typeof code !== "number") {
        throw new codes.ERR_INVALID_ARG_TYPE("err", "number", code);
    }
    if (code >= 0 || !NumberIsSafeInteger(code)) {
        throw new codes.ERR_OUT_OF_RANGE("err", "a negative integer", code);
    }
    return errorMap.get(code)?.[0];
}
const { errno: { ENOTDIR , ENOENT  } ,  } = os;
const kIsNodeError = Symbol("kIsNodeError");
const classRegExp1 = /^([A-Z][a-z0-9]*)+$/;
const kTypes = [
    "string",
    "function",
    "number",
    "object",
    "Function",
    "Object",
    "boolean",
    "bigint",
    "symbol", 
];
function addNumericalSeparator(val) {
    let res = "";
    let i = val.length;
    const start = val[0] === "-" ? 1 : 0;
    for(; i >= start + 4; i -= 3){
        res = `_${val.slice(i - 3, i)}${res}`;
    }
    return `${val.slice(0, i)}${res}`;
}
const captureLargerStackTrace = hideStackFrames(function captureLargerStackTrace(err) {
    Error.captureStackTrace(err);
    return err;
});
hideStackFrames(function uvExceptionWithHostPort(err, syscall, address, port) {
    const { 0: code , 1: uvmsg  } = uvErrmapGet(err) || uvUnmappedError;
    const message = `${syscall} ${code}: ${uvmsg}`;
    let details = "";
    if (port && port > 0) {
        details = ` ${address}:${port}`;
    } else if (address) {
        details = ` ${address}`;
    }
    const ex = new Error(`${message}${details}`);
    ex.code = code;
    ex.errno = err;
    ex.syscall = syscall;
    ex.address = address;
    if (port) {
        ex.port = port;
    }
    return captureLargerStackTrace(ex);
});
hideStackFrames(function errnoException(err, syscall, original) {
    const code = getSystemErrorName(err);
    const message = original ? `${syscall} ${code} ${original}` : `${syscall} ${code}`;
    const ex = new Error(message);
    ex.errno = err;
    ex.code = code;
    ex.syscall = syscall;
    return captureLargerStackTrace(ex);
});
function uvErrmapGet(name) {
    return errorMap.get(name);
}
const uvUnmappedError = [
    "UNKNOWN",
    "unknown error"
];
hideStackFrames(function uvException(ctx) {
    const { 0: code , 1: uvmsg  } = uvErrmapGet(ctx.errno) || uvUnmappedError;
    let message = `${code}: ${ctx.message || uvmsg}, ${ctx.syscall}`;
    let path;
    let dest;
    if (ctx.path) {
        path = ctx.path.toString();
        message += ` '${path}'`;
    }
    if (ctx.dest) {
        dest = ctx.dest.toString();
        message += ` -> '${dest}'`;
    }
    const err = new Error(message);
    for (const prop of Object.keys(ctx)){
        if (prop === "message" || prop === "path" || prop === "dest") {
            continue;
        }
        err[prop] = ctx[prop];
    }
    err.code = code;
    if (path) {
        err.path = path;
    }
    if (dest) {
        err.dest = dest;
    }
    return captureLargerStackTrace(err);
});
hideStackFrames(function exceptionWithHostPort(err, syscall, address, port, additional) {
    const code = getSystemErrorName(err);
    let details = "";
    if (port && port > 0) {
        details = ` ${address}:${port}`;
    } else if (address) {
        details = ` ${address}`;
    }
    if (additional) {
        details += ` - Local (${additional})`;
    }
    const ex = new Error(`${syscall} ${code}${details}`);
    ex.errno = err;
    ex.code = code;
    ex.syscall = syscall;
    ex.address = address;
    if (port) {
        ex.port = port;
    }
    return captureLargerStackTrace(ex);
});
hideStackFrames(function(code, syscall, hostname) {
    let errno;
    if (typeof code === "number") {
        errno = code;
        if (code === codeMap.get("EAI_NODATA") || code === codeMap.get("EAI_NONAME")) {
            code = "ENOTFOUND";
        } else {
            code = getSystemErrorName(code);
        }
    }
    const message = `${syscall} ${code}${hostname ? ` ${hostname}` : ""}`;
    const ex = new Error(message);
    ex.errno = errno;
    ex.code = code;
    ex.syscall = syscall;
    if (hostname) {
        ex.hostname = hostname;
    }
    return captureLargerStackTrace(ex);
});
class NodeErrorAbstraction extends Error {
    code;
    constructor(name, code, message){
        super(message);
        this.code = code;
        this.name = name;
        this.stack = this.stack && `${name} [${this.code}]${this.stack.slice(20)}`;
    }
    toString() {
        return `${this.name} [${this.code}]: ${this.message}`;
    }
}
class NodeError extends NodeErrorAbstraction {
    constructor(code, message){
        super(Error.prototype.name, code, message);
    }
}
class NodeRangeError extends NodeErrorAbstraction {
    constructor(code, message){
        super(RangeError.prototype.name, code, message);
        Object.setPrototypeOf(this, RangeError.prototype);
        this.toString = function() {
            return `${this.name} [${this.code}]: ${this.message}`;
        };
    }
}
class NodeTypeError extends NodeErrorAbstraction {
    constructor(code, message){
        super(TypeError.prototype.name, code, message);
        Object.setPrototypeOf(this, TypeError.prototype);
        this.toString = function() {
            return `${this.name} [${this.code}]: ${this.message}`;
        };
    }
}
class NodeURIError extends NodeErrorAbstraction {
    constructor(code, message){
        super(URIError.prototype.name, code, message);
        Object.setPrototypeOf(this, URIError.prototype);
        this.toString = function() {
            return `${this.name} [${this.code}]: ${this.message}`;
        };
    }
}
class NodeSystemError extends NodeErrorAbstraction {
    constructor(key, context, msgPrefix){
        let message = `${msgPrefix}: ${context.syscall} returned ` + `${context.code} (${context.message})`;
        if (context.path !== undefined) {
            message += ` ${context.path}`;
        }
        if (context.dest !== undefined) {
            message += ` => ${context.dest}`;
        }
        super("SystemError", key, message);
        captureLargerStackTrace(this);
        Object.defineProperties(this, {
            [kIsNodeError]: {
                value: true,
                enumerable: false,
                writable: false,
                configurable: true
            },
            info: {
                value: context,
                enumerable: true,
                configurable: true,
                writable: false
            },
            errno: {
                get () {
                    return context.errno;
                },
                set: (value)=>{
                    context.errno = value;
                },
                enumerable: true,
                configurable: true
            },
            syscall: {
                get () {
                    return context.syscall;
                },
                set: (value)=>{
                    context.syscall = value;
                },
                enumerable: true,
                configurable: true
            }
        });
        if (context.path !== undefined) {
            Object.defineProperty(this, "path", {
                get () {
                    return context.path;
                },
                set: (value)=>{
                    context.path = value;
                },
                enumerable: true,
                configurable: true
            });
        }
        if (context.dest !== undefined) {
            Object.defineProperty(this, "dest", {
                get () {
                    return context.dest;
                },
                set: (value)=>{
                    context.dest = value;
                },
                enumerable: true,
                configurable: true
            });
        }
    }
    toString() {
        return `${this.name} [${this.code}]: ${this.message}`;
    }
}
function makeSystemErrorWithCode(key, msgPrfix) {
    return class NodeError extends NodeSystemError {
        constructor(ctx){
            super(key, ctx, msgPrfix);
        }
    };
}
makeSystemErrorWithCode("ERR_FS_EISDIR", "Path is a directory");
function createInvalidArgType(name, expected) {
    expected = Array.isArray(expected) ? expected : [
        expected
    ];
    let msg = "The ";
    if (name.endsWith(" argument")) {
        msg += `${name} `;
    } else {
        const type = name.includes(".") ? "property" : "argument";
        msg += `"${name}" ${type} `;
    }
    msg += "must be ";
    const types = [];
    const instances = [];
    const other = [];
    for (const value of expected){
        if (kTypes.includes(value)) {
            types.push(value.toLocaleLowerCase());
        } else if (classRegExp1.test(value)) {
            instances.push(value);
        } else {
            other.push(value);
        }
    }
    if (instances.length > 0) {
        const pos = types.indexOf("object");
        if (pos !== -1) {
            types.splice(pos, 1);
            instances.push("Object");
        }
    }
    if (types.length > 0) {
        if (types.length > 2) {
            const last = types.pop();
            msg += `one of type ${types.join(", ")}, or ${last}`;
        } else if (types.length === 2) {
            msg += `one of type ${types[0]} or ${types[1]}`;
        } else {
            msg += `of type ${types[0]}`;
        }
        if (instances.length > 0 || other.length > 0) {
            msg += " or ";
        }
    }
    if (instances.length > 0) {
        if (instances.length > 2) {
            const last1 = instances.pop();
            msg += `an instance of ${instances.join(", ")}, or ${last1}`;
        } else {
            msg += `an instance of ${instances[0]}`;
            if (instances.length === 2) {
                msg += ` or ${instances[1]}`;
            }
        }
        if (other.length > 0) {
            msg += " or ";
        }
    }
    if (other.length > 0) {
        if (other.length > 2) {
            const last2 = other.pop();
            msg += `one of ${other.join(", ")}, or ${last2}`;
        } else if (other.length === 2) {
            msg += `one of ${other[0]} or ${other[1]}`;
        } else {
            if (other[0].toLowerCase() !== other[0]) {
                msg += "an ";
            }
            msg += `${other[0]}`;
        }
    }
    return msg;
}
class ERR_INVALID_ARG_TYPE_RANGE extends NodeRangeError {
    constructor(name, expected, actual){
        const msg = createInvalidArgType(name, expected);
        super("ERR_INVALID_ARG_TYPE", `${msg}.${invalidArgTypeHelper(actual)}`);
    }
}
class ERR_INVALID_ARG_TYPE extends NodeTypeError {
    constructor(name, expected, actual){
        const msg = createInvalidArgType(name, expected);
        super("ERR_INVALID_ARG_TYPE", `${msg}.${invalidArgTypeHelper(actual)}`);
    }
    static RangeError = ERR_INVALID_ARG_TYPE_RANGE;
}
class ERR_INVALID_ARG_VALUE_RANGE extends NodeRangeError {
    constructor(name, value, reason = "is invalid"){
        const type = name.includes(".") ? "property" : "argument";
        const inspected = inspect(value);
        super("ERR_INVALID_ARG_VALUE", `The ${type} '${name}' ${reason}. Received ${inspected}`);
    }
}
class ERR_INVALID_ARG_VALUE extends NodeTypeError {
    constructor(name, value, reason = "is invalid"){
        const type = name.includes(".") ? "property" : "argument";
        const inspected = inspect(value);
        super("ERR_INVALID_ARG_VALUE", `The ${type} '${name}' ${reason}. Received ${inspected}`);
    }
    static RangeError = ERR_INVALID_ARG_VALUE_RANGE;
}
function invalidArgTypeHelper(input) {
    if (input == null) {
        return ` Received ${input}`;
    }
    if (typeof input === "function" && input.name) {
        return ` Received function ${input.name}`;
    }
    if (typeof input === "object") {
        if (input.constructor && input.constructor.name) {
            return ` Received an instance of ${input.constructor.name}`;
        }
        return ` Received ${inspect(input, {
            depth: -1
        })}`;
    }
    let inspected = inspect(input, {
        colors: false
    });
    if (inspected.length > 25) {
        inspected = `${inspected.slice(0, 25)}...`;
    }
    return ` Received type ${typeof input} (${inspected})`;
}
class ERR_OUT_OF_RANGE extends RangeError {
    code = "ERR_OUT_OF_RANGE";
    constructor(str, range, input, replaceDefaultBoolean = false){
        assert1(range, 'Missing "range" argument');
        let msg = replaceDefaultBoolean ? str : `The value of "${str}" is out of range.`;
        let received;
        if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
            received = addNumericalSeparator(String(input));
        } else if (typeof input === "bigint") {
            received = String(input);
            if (input > 2n ** 32n || input < -(2n ** 32n)) {
                received = addNumericalSeparator(received);
            }
            received += "n";
        } else {
            received = inspect(input);
        }
        msg += ` It must be ${range}. Received ${received}`;
        super(msg);
        const { name  } = this;
        this.name = `${name} [${this.code}]`;
        this.stack;
        this.name = name;
    }
}
class ERR_BUFFER_OUT_OF_BOUNDS extends NodeRangeError {
    constructor(name){
        super("ERR_BUFFER_OUT_OF_BOUNDS", name ? `"${name}" is outside of buffer bounds` : "Attempt to access memory outside buffer bounds");
    }
}
class ERR_INVALID_CALLBACK extends NodeTypeError {
    constructor(object){
        super("ERR_INVALID_CALLBACK", `Callback must be a function. Received ${inspect(object)}`);
    }
}
class ERR_INVALID_FILE_URL_HOST extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_FILE_URL_HOST", `File URL host must be "localhost" or empty on ${x}`);
    }
}
class ERR_INVALID_FILE_URL_PATH extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_FILE_URL_PATH", `File URL path ${x}`);
    }
}
class ERR_INVALID_URI extends NodeURIError {
    constructor(){
        super("ERR_INVALID_URI", `URI malformed`);
    }
}
class ERR_IPC_CHANNEL_CLOSED extends NodeError {
    constructor(){
        super("ERR_IPC_CHANNEL_CLOSED", `Channel closed`);
    }
}
class ERR_SOCKET_BAD_PORT extends NodeRangeError {
    constructor(name, port, allowZero = true){
        assert1(typeof allowZero === "boolean", "The 'allowZero' argument must be of type boolean.");
        const operator = allowZero ? ">=" : ">";
        super("ERR_SOCKET_BAD_PORT", `${name} should be ${operator} 0 and < 65536. Received ${port}.`);
    }
}
class ERR_UNKNOWN_ENCODING extends NodeTypeError {
    constructor(x){
        super("ERR_UNKNOWN_ENCODING", `Unknown encoding: ${x}`);
    }
}
class ERR_INVALID_URL_SCHEME extends NodeTypeError {
    constructor(expected){
        expected = Array.isArray(expected) ? expected : [
            expected
        ];
        const res = expected.length === 2 ? `one of scheme ${expected[0]} or ${expected[1]}` : `of scheme ${expected[0]}`;
        super("ERR_INVALID_URL_SCHEME", `The URL must be ${res}`);
    }
}
codes.ERR_IPC_CHANNEL_CLOSED = ERR_IPC_CHANNEL_CLOSED;
codes.ERR_INVALID_ARG_TYPE = ERR_INVALID_ARG_TYPE;
codes.ERR_INVALID_ARG_VALUE = ERR_INVALID_ARG_VALUE;
codes.ERR_INVALID_CALLBACK = ERR_INVALID_CALLBACK;
codes.ERR_OUT_OF_RANGE = ERR_OUT_OF_RANGE;
codes.ERR_SOCKET_BAD_PORT = ERR_SOCKET_BAD_PORT;
codes.ERR_BUFFER_OUT_OF_BOUNDS = ERR_BUFFER_OUT_OF_BOUNDS;
codes.ERR_UNKNOWN_ENCODING = ERR_UNKNOWN_ENCODING;
hideStackFrames(function genericNodeError(message, errorProperties) {
    const err = new Error(message);
    Object.assign(err, errorProperties);
    return err;
});
const CHAR_FORWARD_SLASH1 = 47;
const CHAR_FORWARD_SLASH2 = 47;
function assertPath1(path) {
    if (typeof path !== "string") {
        throw new ERR_INVALID_ARG_TYPE("path", [
            "string"
        ], path);
    }
}
function isPosixPathSeparator1(code) {
    return code === 47;
}
function isPathSeparator1(code) {
    return isPosixPathSeparator1(code) || code === 92;
}
function isWindowsDeviceRoot1(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString1(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path.length; i <= len; ++i){
        if (i < len) code = path.charCodeAt(i);
        else if (isPathSeparator(code)) break;
        else code = CHAR_FORWARD_SLASH2;
        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {} else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
                else res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function _format1(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (dir === pathObject.root) return dir + base;
    return dir + sep + base;
}
const WHITESPACE_ENCODINGS1 = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace1(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS1[c] ?? c;
    });
}
const sep3 = "\\";
const delimiter3 = ";";
function resolve3(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno: Deno1  } = globalThis;
        if (i >= 0) {
            path = pathSegments[i];
        } else if (!resolvedDevice) {
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path = Deno1.cwd();
        } else {
            if (typeof Deno1?.env?.get !== "function" || typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
            if (path === undefined || path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path = `${resolvedDevice}\\`;
            }
        }
        assertPath1(path);
        const len = path.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator1(code)) {
                isAbsolute = true;
                if (isPathSeparator1(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator1(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator1(path.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator1(path.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                device = `\\\\${firstPart}\\${path.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot1(code)) {
                if (path.charCodeAt(1) === 58) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator1(path.charCodeAt(2))) {
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator1(code)) {
            rootEnd = 1;
            isAbsolute = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString1(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator1);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize4(path) {
    assertPath1(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator1(code)) {
            isAbsolute = true;
            if (isPathSeparator1(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator1(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator1(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator1(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return `\\\\${firstPart}\\${path.slice(last)}\\`;
                        } else if (j !== last) {
                            device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot1(code)) {
            if (path.charCodeAt(1) === 58) {
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator1(path.charCodeAt(2))) {
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator1(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString1(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator1);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute) tail = ".";
    if (tail.length > 0 && isPathSeparator1(path.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function isAbsolute3(path) {
    assertPath1(path);
    const len = path.length;
    if (len === 0) return false;
    const code = path.charCodeAt(0);
    if (isPathSeparator1(code)) {
        return true;
    } else if (isWindowsDeviceRoot1(code)) {
        if (len > 2 && path.charCodeAt(1) === 58) {
            if (isPathSeparator1(path.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join5(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < pathsCount; ++i){
        const path = paths[i];
        assertPath1(path);
        if (path.length > 0) {
            if (joined === undefined) joined = firstPart = path;
            else joined += `\\${path}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert1(firstPart != null);
    if (isPathSeparator1(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator1(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator1(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator1(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize4(joined);
}
function relative3(from, to) {
    assertPath1(from);
    assertPath1(to);
    if (from === to) return "";
    const fromOrig = resolve3(from);
    const toOrig = resolve3(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 92) {
                    return toOrig.slice(toStart + i + 1);
                } else if (i === 2) {
                    return toOrig.slice(toStart + i);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 92) {
                    lastCommonSep = i;
                } else if (i === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i;
    }
    if (i !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
function toNamespacedPath3(path) {
    if (typeof path !== "string") return path;
    if (path.length === 0) return "";
    const resolvedPath = resolve3(path);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot1(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path;
}
function dirname3(path) {
    assertPath1(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator1(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator1(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator1(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator1(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator1(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return path;
                        }
                        if (j !== last) {
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot1(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator1(path.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator1(code)) {
        return path;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator1(path.charCodeAt(i))) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return path.slice(0, end);
}
function basename3(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new ERR_INVALID_ARG_TYPE("ext", [
            "string"
        ], ext);
    }
    assertPath1(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot1(drive)) {
            if (path.charCodeAt(1) === 58) start = 2;
        }
    }
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= start; --i){
            const code = path.charCodeAt(i);
            if (isPathSeparator1(code)) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path.length;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= start; --i){
            if (isPathSeparator1(path.charCodeAt(i))) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
function extname3(path) {
    assertPath1(path);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path.length >= 2 && path.charCodeAt(1) === 58 && isWindowsDeviceRoot1(path.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path.length - 1; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPathSeparator1(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format3(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new ERR_INVALID_ARG_TYPE("pathObject", [
            "Object"
        ], pathObject);
    }
    return _format1("\\", pathObject);
}
function parse4(path) {
    assertPath1(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator1(code)) {
            rootEnd = 1;
            if (isPathSeparator1(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator1(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator1(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator1(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot1(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator1(path.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path;
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator1(code)) {
        ret.root = ret.dir = path;
        return ret;
    }
    if (rootEnd > 0) ret.root = path.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= rootEnd; --i){
        code = path.charCodeAt(i);
        if (isPathSeparator1(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path.slice(startPart, end);
        }
    } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function fromFileUrl3(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path = `\\\\${url.hostname}${path}`;
    }
    return path;
}
function toFileUrl3(path) {
    if (!isAbsolute3(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace1(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const __default1 = {
    basename: basename3,
    delimiter: delimiter3,
    dirname: dirname3,
    extname: extname3,
    format: format3,
    fromFileUrl: fromFileUrl3,
    isAbsolute: isAbsolute3,
    join: join5,
    normalize: normalize4,
    parse: parse4,
    relative: relative3,
    resolve: resolve3,
    sep: sep3,
    toFileUrl: toFileUrl3,
    toNamespacedPath: toNamespacedPath3
};
const mod3 = {
    sep: sep3,
    delimiter: delimiter3,
    resolve: resolve3,
    normalize: normalize4,
    isAbsolute: isAbsolute3,
    join: join5,
    relative: relative3,
    toNamespacedPath: toNamespacedPath3,
    dirname: dirname3,
    basename: basename3,
    extname: extname3,
    format: format3,
    parse: parse4,
    fromFileUrl: fromFileUrl3,
    toFileUrl: toFileUrl3,
    default: __default1
};
const sep4 = "/";
const delimiter4 = ":";
function resolve4(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            const { Deno: Deno1  } = globalThis;
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
        }
        assertPath1(path);
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH2;
    }
    resolvedPath = normalizeString1(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator1);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize5(path) {
    assertPath1(path);
    if (path.length === 0) return ".";
    const isAbsolute = path.charCodeAt(0) === 47;
    const trailingSeparator = path.charCodeAt(path.length - 1) === 47;
    path = normalizeString1(path, !isAbsolute, "/", isPosixPathSeparator1);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
function isAbsolute4(path) {
    assertPath1(path);
    return path.length > 0 && path.charCodeAt(0) === 47;
}
function join6(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path = paths[i];
        assertPath1(path);
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `/${path}`;
        }
    }
    if (!joined) return ".";
    return normalize5(joined);
}
function relative4(from, to) {
    assertPath1(from);
    assertPath1(to);
    if (from === to) return "";
    from = resolve4(from);
    to = resolve4(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 47) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 47) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 47) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 47) {
                    lastCommonSep = i;
                } else if (i === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 47) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 47) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (to.charCodeAt(toStart) === 47) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath4(path) {
    return path;
}
function dirname4(path) {
    assertPath1(path);
    if (path.length === 0) return ".";
    const hasRoot = path.charCodeAt(0) === 47;
    let end = -1;
    let matchedSlash = true;
    for(let i = path.length - 1; i >= 1; --i){
        if (path.charCodeAt(i) === 47) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) return hasRoot ? "/" : ".";
    if (hasRoot && end === 1) return "//";
    return path.slice(0, end);
}
function basename4(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new ERR_INVALID_ARG_TYPE("ext", [
            "string"
        ], ext);
    }
    assertPath1(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= 0; --i){
            const code = path.charCodeAt(i);
            if (code === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path.length;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= 0; --i){
            if (path.charCodeAt(i) === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
function extname4(path) {
    assertPath1(path);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path.length - 1; i >= 0; --i){
        const code = path.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format4(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new ERR_INVALID_ARG_TYPE("pathObject", [
            "Object"
        ], pathObject);
    }
    return _format1("/", pathObject);
}
function parse5(path) {
    assertPath1(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = path.charCodeAt(0) === 47;
    let start;
    if (isAbsolute) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= start; --i){
        const code = path.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute) {
                ret.base = ret.name = path.slice(1, end);
            } else {
                ret.base = ret.name = path.slice(startPart, end);
            }
        }
    } else {
        if (startPart === 0 && isAbsolute) {
            ret.name = path.slice(1, startDot);
            ret.base = path.slice(1, end);
        } else {
            ret.name = path.slice(startPart, startDot);
            ret.base = path.slice(startPart, end);
        }
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);
    else if (isAbsolute) ret.dir = "/";
    return ret;
}
function fromFileUrl4(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl4(path) {
    if (!isAbsolute4(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace1(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const __default2 = {
    basename: basename4,
    delimiter: delimiter4,
    dirname: dirname4,
    extname: extname4,
    format: format4,
    fromFileUrl: fromFileUrl4,
    isAbsolute: isAbsolute4,
    join: join6,
    normalize: normalize5,
    parse: parse5,
    relative: relative4,
    resolve: resolve4,
    sep: sep4,
    toFileUrl: toFileUrl4,
    toNamespacedPath: toNamespacedPath4
};
const mod4 = {
    sep: sep4,
    delimiter: delimiter4,
    resolve: resolve4,
    normalize: normalize5,
    isAbsolute: isAbsolute4,
    join: join6,
    relative: relative4,
    toNamespacedPath: toNamespacedPath4,
    dirname: dirname4,
    basename: basename4,
    extname: extname4,
    format: format4,
    parse: parse5,
    fromFileUrl: fromFileUrl4,
    toFileUrl: toFileUrl4,
    default: __default2
};
const path2 = isWindows1 ? mod3 : mod4;
const { join: join7 , normalize: normalize6  } = path2;
const path3 = isWindows1 ? __default1 : __default2;
const { basename: basename5 , delimiter: delimiter5 , dirname: dirname5 , extname: extname5 , format: format5 , fromFileUrl: fromFileUrl5 , isAbsolute: isAbsolute5 , join: join8 , normalize: normalize7 , parse: parse6 , relative: relative5 , resolve: resolve5 , sep: sep5 , toFileUrl: toFileUrl5 , toNamespacedPath: toNamespacedPath5 ,  } = path3;
"use strict";
const base = 36;
const damp = 700;
const delimiter6 = "-";
const regexNonASCII = /[^\0-\x7E]/;
const regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g;
const errors = {
    "overflow": "Overflow: input needs wider integers to process",
    "not-basic": "Illegal input >= 0x80 (not a basic code point)",
    "invalid-input": "Invalid input"
};
const baseMinusTMin = 36 - 1;
function error3(type) {
    throw new RangeError(errors[type]);
}
function mapDomain(str, fn) {
    const parts = str.split("@");
    let result = "";
    if (parts.length > 1) {
        result = parts[0] + "@";
        str = parts[1];
    }
    str = str.replace(regexSeparators, "\x2E");
    const labels = str.split(".");
    const encoded = labels.map(fn).join(".");
    return result + encoded;
}
function ucs2decode(str) {
    const output = [];
    let counter = 0;
    const length = str.length;
    while(counter < length){
        const value = str.charCodeAt(counter++);
        if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
            const extra = str.charCodeAt(counter++);
            if ((extra & 0xFC00) == 0xDC00) {
                output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
            } else {
                output.push(value);
                counter--;
            }
        } else {
            output.push(value);
        }
    }
    return output;
}
function digitToBasic(digit, flag) {
    return digit + 22 + 75 * Number(digit < 26) - (Number(flag != 0) << 5);
}
function adapt(delta, numPoints, firstTime) {
    let k = 0;
    delta = firstTime ? Math.floor(delta / damp) : delta >> 1;
    delta += Math.floor(delta / numPoints);
    for(; delta > baseMinusTMin * 26 >> 1; k += base){
        delta = Math.floor(delta / baseMinusTMin);
    }
    return Math.floor(k + (baseMinusTMin + 1) * delta / (delta + 38));
}
function encode2(str) {
    const output = [];
    const input = ucs2decode(str);
    const inputLength = input.length;
    let n = 128;
    let delta = 0;
    let bias = 72;
    for (const currentValue of input){
        if (currentValue < 0x80) {
            output.push(String.fromCharCode(currentValue));
        }
    }
    const basicLength = output.length;
    let handledCPCount = basicLength;
    if (basicLength) {
        output.push(delimiter6);
    }
    while(handledCPCount < inputLength){
        let m = 2147483647;
        for (const currentValue1 of input){
            if (currentValue1 >= n && currentValue1 < m) {
                m = currentValue1;
            }
        }
        const handledCPCountPlusOne = handledCPCount + 1;
        if (m - n > Math.floor((2147483647 - delta) / handledCPCountPlusOne)) {
            error3("overflow");
        }
        delta += (m - n) * handledCPCountPlusOne;
        n = m;
        for (const currentValue2 of input){
            if (currentValue2 < n && ++delta > 2147483647) {
                error3("overflow");
            }
            if (currentValue2 == n) {
                let q = delta;
                for(let k = 36;; k += base){
                    const t = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;
                    if (q < t) {
                        break;
                    }
                    const qMinusT = q - t;
                    const baseMinusT = 36 - t;
                    output.push(String.fromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
                    q = Math.floor(qMinusT / baseMinusT);
                }
                output.push(String.fromCharCode(digitToBasic(q, 0)));
                bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
                delta = 0;
                ++handledCPCount;
            }
        }
        ++delta;
        ++n;
    }
    return output.join("");
}
function toASCII(input) {
    return mapDomain(input, function(str) {
        return regexNonASCII.test(str) ? "xn--" + encode2(str) : str;
    });
}
const hexTable = new Array(256);
for(let i1 = 0; i1 < 256; ++i1){
    hexTable[i1] = "%" + ((i1 < 16 ? "0" : "") + i1.toString(16)).toUpperCase();
}
new Int8Array([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
]);
function encodeStr(str, noEscapeTable, hexTable) {
    const len = str.length;
    if (len === 0) return "";
    let out = "";
    let lastPos = 0;
    for(let i = 0; i < len; i++){
        let c = str.charCodeAt(i);
        if (c < 0x80) {
            if (noEscapeTable[c] === 1) continue;
            if (lastPos < i) out += str.slice(lastPos, i);
            lastPos = i + 1;
            out += hexTable[c];
            continue;
        }
        if (lastPos < i) out += str.slice(lastPos, i);
        if (c < 0x800) {
            lastPos = i + 1;
            out += hexTable[0xc0 | c >> 6] + hexTable[0x80 | c & 0x3f];
            continue;
        }
        if (c < 0xd800 || c >= 0xe000) {
            lastPos = i + 1;
            out += hexTable[0xe0 | c >> 12] + hexTable[0x80 | c >> 6 & 0x3f] + hexTable[0x80 | c & 0x3f];
            continue;
        }
        ++i;
        if (i >= len) throw new ERR_INVALID_URI();
        const c2 = str.charCodeAt(i) & 0x3ff;
        lastPos = i + 1;
        c = 0x10000 + ((c & 0x3ff) << 10 | c2);
        out += hexTable[0xf0 | c >> 18] + hexTable[0x80 | c >> 12 & 0x3f] + hexTable[0x80 | c >> 6 & 0x3f] + hexTable[0x80 | c & 0x3f];
    }
    if (lastPos === 0) return str;
    if (lastPos < len) return out + str.slice(lastPos);
    return out;
}
const decode2 = parse7;
const encode3 = stringify;
function qsEscape(str) {
    if (typeof str !== "string") {
        if (typeof str === "object") {
            str = String(str);
        } else {
            str += "";
        }
    }
    return encodeStr(str, noEscape, hexTable);
}
const escape = qsEscape;
const isHexTable = new Int8Array([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
]);
function charCodes(str) {
    const ret = new Array(str.length);
    for(let i = 0; i < str.length; ++i){
        ret[i] = str.charCodeAt(i);
    }
    return ret;
}
function addKeyVal(obj, key, value, keyEncoded, valEncoded, decode) {
    if (key.length > 0 && keyEncoded) {
        key = decode(key);
    }
    if (value.length > 0 && valEncoded) {
        value = decode(value);
    }
    if (obj[key] === undefined) {
        obj[key] = value;
    } else {
        const curValue = obj[key];
        if (curValue.pop) {
            curValue[curValue.length] = value;
        } else {
            obj[key] = [
                curValue,
                value
            ];
        }
    }
}
function parse7(str, sep = "&", eq = "=", { decodeURIComponent: decodeURIComponent1 = unescape1 , maxKeys =1000  } = {}) {
    const obj = Object.create(null);
    if (typeof str !== "string" || str.length === 0) {
        return obj;
    }
    const sepCodes = !sep ? [
        38
    ] : charCodes(String(sep));
    const eqCodes = !eq ? [
        61
    ] : charCodes(String(eq));
    const sepLen = sepCodes.length;
    const eqLen = eqCodes.length;
    let pairs = 1000;
    if (typeof maxKeys === "number") {
        pairs = maxKeys > 0 ? maxKeys : -1;
    }
    let decode = unescape1;
    if (decodeURIComponent1) {
        decode = decodeURIComponent1;
    }
    const customDecode = decode !== unescape1;
    let lastPos = 0;
    let sepIdx = 0;
    let eqIdx = 0;
    let key = "";
    let value = "";
    let keyEncoded = customDecode;
    let valEncoded = customDecode;
    const plusChar = customDecode ? "%20" : " ";
    let encodeCheck = 0;
    for(let i = 0; i < str.length; ++i){
        const code = str.charCodeAt(i);
        if (code === sepCodes[sepIdx]) {
            if (++sepIdx === sepLen) {
                const end = i - sepIdx + 1;
                if (eqIdx < eqLen) {
                    if (lastPos < end) {
                        key += str.slice(lastPos, end);
                    } else if (key.length === 0) {
                        if (--pairs === 0) {
                            return obj;
                        }
                        lastPos = i + 1;
                        sepIdx = eqIdx = 0;
                        continue;
                    }
                } else if (lastPos < end) {
                    value += str.slice(lastPos, end);
                }
                addKeyVal(obj, key, value, keyEncoded, valEncoded, decode);
                if (--pairs === 0) {
                    return obj;
                }
                key = value = "";
                encodeCheck = 0;
                lastPos = i + 1;
                sepIdx = eqIdx = 0;
            }
        } else {
            sepIdx = 0;
            if (eqIdx < eqLen) {
                if (code === eqCodes[eqIdx]) {
                    if (++eqIdx === eqLen) {
                        const end1 = i - eqIdx + 1;
                        if (lastPos < end1) {
                            key += str.slice(lastPos, end1);
                        }
                        encodeCheck = 0;
                        lastPos = i + 1;
                    }
                    continue;
                } else {
                    eqIdx = 0;
                    if (!keyEncoded) {
                        if (code === 37) {
                            encodeCheck = 1;
                            continue;
                        } else if (encodeCheck > 0) {
                            if (isHexTable[code] === 1) {
                                if (++encodeCheck === 3) {
                                    keyEncoded = true;
                                }
                                continue;
                            } else {
                                encodeCheck = 0;
                            }
                        }
                    }
                }
                if (code === 43) {
                    if (lastPos < i) {
                        key += str.slice(lastPos, i);
                    }
                    key += plusChar;
                    lastPos = i + 1;
                    continue;
                }
            }
            if (code === 43) {
                if (lastPos < i) {
                    value += str.slice(lastPos, i);
                }
                value += plusChar;
                lastPos = i + 1;
            } else if (!valEncoded) {
                if (code === 37) {
                    encodeCheck = 1;
                } else if (encodeCheck > 0) {
                    if (isHexTable[code] === 1) {
                        if (++encodeCheck === 3) {
                            valEncoded = true;
                        }
                    } else {
                        encodeCheck = 0;
                    }
                }
            }
        }
    }
    if (lastPos < str.length) {
        if (eqIdx < eqLen) {
            key += str.slice(lastPos);
        } else if (sepIdx < sepLen) {
            value += str.slice(lastPos);
        }
    } else if (eqIdx === 0 && key.length === 0) {
        return obj;
    }
    addKeyVal(obj, key, value, keyEncoded, valEncoded, decode);
    return obj;
}
const noEscape = new Int8Array([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    1,
    0
]);
function stringifyPrimitive(v) {
    if (typeof v === "string") {
        return v;
    }
    if (typeof v === "number" && isFinite(v)) {
        return "" + v;
    }
    if (typeof v === "bigint") {
        return "" + v;
    }
    if (typeof v === "boolean") {
        return v ? "true" : "false";
    }
    return "";
}
function encodeStringifiedCustom(v, encode) {
    return encode(stringifyPrimitive(v));
}
function encodeStringified(v, encode) {
    if (typeof v === "string") {
        return v.length ? encode(v) : "";
    }
    if (typeof v === "number" && isFinite(v)) {
        return Math.abs(v) < 1e21 ? "" + v : encode("" + v);
    }
    if (typeof v === "bigint") {
        return "" + v;
    }
    if (typeof v === "boolean") {
        return v ? "true" : "false";
    }
    return "";
}
function stringify(obj, sep, eq, options) {
    sep ||= "&";
    eq ||= "=";
    const encode = options ? options.encodeURIComponent : qsEscape;
    const convert = options ? encodeStringifiedCustom : encodeStringified;
    if (obj !== null && typeof obj === "object") {
        const keys = Object.keys(obj);
        const len = keys.length;
        let fields = "";
        for(let i = 0; i < len; ++i){
            const k = keys[i];
            const v = obj[k];
            let ks = convert(k, encode);
            ks += eq;
            if (Array.isArray(v)) {
                const vlen = v.length;
                if (vlen === 0) continue;
                if (fields) {
                    fields += sep;
                }
                for(let j = 0; j < vlen; ++j){
                    if (j) {
                        fields += sep;
                    }
                    fields += ks;
                    fields += convert(v[j], encode);
                }
            } else {
                if (fields) {
                    fields += sep;
                }
                fields += ks;
                fields += convert(v, encode);
            }
        }
        return fields;
    }
    return "";
}
const unhexTable = new Int8Array([
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    +0,
    +1,
    +2,
    +3,
    +4,
    +5,
    +6,
    +7,
    +8,
    +9,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    10,
    11,
    12,
    13,
    14,
    15,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    10,
    11,
    12,
    13,
    14,
    15,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1
]);
function unescapeBuffer(s, decodeSpaces = false) {
    const out = new Buffer(s.length);
    let index = 0;
    let outIndex = 0;
    let currentChar;
    let nextChar;
    let hexHigh;
    let hexLow;
    const maxLength = s.length - 2;
    let hasHex = false;
    while(index < s.length){
        currentChar = s.charCodeAt(index);
        if (currentChar === 43 && decodeSpaces) {
            out[outIndex++] = 32;
            index++;
            continue;
        }
        if (currentChar === 37 && index < maxLength) {
            currentChar = s.charCodeAt(++index);
            hexHigh = unhexTable[currentChar];
            if (!(hexHigh >= 0)) {
                out[outIndex++] = 37;
                continue;
            } else {
                nextChar = s.charCodeAt(++index);
                hexLow = unhexTable[nextChar];
                if (!(hexLow >= 0)) {
                    out[outIndex++] = 37;
                    index--;
                } else {
                    hasHex = true;
                    currentChar = hexHigh * 16 + hexLow;
                }
            }
        }
        out[outIndex++] = currentChar;
        index++;
    }
    return hasHex ? out.slice(0, outIndex) : out;
}
function qsUnescape(s) {
    try {
        return decodeURIComponent(s);
    } catch  {
        return unescapeBuffer(s).toString();
    }
}
const unescape1 = qsUnescape;
const __default3 = {
    parse: parse7,
    stringify,
    decode: decode2,
    encode: encode3,
    unescape: unescape1,
    escape,
    unescapeBuffer
};
const forwardSlashRegEx = /\//g;
const percentRegEx = /%/g;
const backslashRegEx = /\\/g;
const newlineRegEx = /\n/g;
const carriageReturnRegEx = /\r/g;
const tabRegEx = /\t/g;
const protocolPattern = /^[a-z0-9.+-]+:/i;
const portPattern = /:[0-9]*$/;
const hostPattern = /^\/\/[^@/]+@[^@/]+/;
const simplePathPattern = /^(\/\/?(?!\/)[^?\s]*)(\?[^\s]*)?$/;
const unsafeProtocol = new Set([
    "javascript",
    "javascript:"
]);
const hostlessProtocol = new Set([
    "javascript",
    "javascript:"
]);
const slashedProtocol = new Set([
    "http",
    "http:",
    "https",
    "https:",
    "ftp",
    "ftp:",
    "gopher",
    "gopher:",
    "file",
    "file:",
    "ws",
    "ws:",
    "wss",
    "wss:", 
]);
const noEscapeAuth = new Int8Array([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    1,
    0
]);
URL;
class Url {
    protocol;
    slashes;
    auth;
    host;
    port;
    hostname;
    hash;
    search;
    query;
    pathname;
    path;
    href;
    constructor(){
        this.protocol = null;
        this.slashes = null;
        this.auth = null;
        this.host = null;
        this.port = null;
        this.hostname = null;
        this.hash = null;
        this.search = null;
        this.query = null;
        this.pathname = null;
        this.path = null;
        this.href = null;
    }
     #parseHost() {
        let host = this.host || "";
        let port = portPattern.exec(host);
        if (port) {
            port = port[0];
            if (port !== ":") {
                this.port = port.slice(1);
            }
            host = host.slice(0, host.length - port.length);
        }
        if (host) this.hostname = host;
    }
    resolve(relative) {
        return this.resolveObject(parse8(relative, false, true)).format();
    }
    resolveObject(relative) {
        if (typeof relative === "string") {
            const rel = new Url();
            rel.urlParse(relative, false, true);
            relative = rel;
        }
        const result = new Url();
        const tkeys = Object.keys(this);
        for(let tk = 0; tk < tkeys.length; tk++){
            const tkey = tkeys[tk];
            result[tkey] = this[tkey];
        }
        result.hash = relative.hash;
        if (relative.href === "") {
            result.href = result.format();
            return result;
        }
        if (relative.slashes && !relative.protocol) {
            const rkeys = Object.keys(relative);
            for(let rk = 0; rk < rkeys.length; rk++){
                const rkey = rkeys[rk];
                if (rkey !== "protocol") result[rkey] = relative[rkey];
            }
            if (result.protocol && slashedProtocol.has(result.protocol) && result.hostname && !result.pathname) {
                result.path = result.pathname = "/";
            }
            result.href = result.format();
            return result;
        }
        if (relative.protocol && relative.protocol !== result.protocol) {
            if (!slashedProtocol.has(relative.protocol)) {
                const keys = Object.keys(relative);
                for(let v = 0; v < keys.length; v++){
                    const k = keys[v];
                    result[k] = relative[k];
                }
                result.href = result.format();
                return result;
            }
            result.protocol = relative.protocol;
            if (!relative.host && !/^file:?$/.test(relative.protocol) && !hostlessProtocol.has(relative.protocol)) {
                const relPath = (relative.pathname || "").split("/");
                while(relPath.length && !(relative.host = relPath.shift() || null));
                if (!relative.host) relative.host = "";
                if (!relative.hostname) relative.hostname = "";
                if (relPath[0] !== "") relPath.unshift("");
                if (relPath.length < 2) relPath.unshift("");
                result.pathname = relPath.join("/");
            } else {
                result.pathname = relative.pathname;
            }
            result.search = relative.search;
            result.query = relative.query;
            result.host = relative.host || "";
            result.auth = relative.auth;
            result.hostname = relative.hostname || relative.host;
            result.port = relative.port;
            if (result.pathname || result.search) {
                const p = result.pathname || "";
                const s = result.search || "";
                result.path = p + s;
            }
            result.slashes = result.slashes || relative.slashes;
            result.href = result.format();
            return result;
        }
        const isSourceAbs = result.pathname && result.pathname.charAt(0) === "/";
        const isRelAbs = relative.host || relative.pathname && relative.pathname.charAt(0) === "/";
        let mustEndAbs = isRelAbs || isSourceAbs || result.host && relative.pathname;
        const removeAllDots = mustEndAbs;
        let srcPath = result.pathname && result.pathname.split("/") || [];
        const relPath1 = relative.pathname && relative.pathname.split("/") || [];
        const noLeadingSlashes = result.protocol && !slashedProtocol.has(result.protocol);
        if (noLeadingSlashes) {
            result.hostname = "";
            result.port = null;
            if (result.host) {
                if (srcPath[0] === "") srcPath[0] = result.host;
                else srcPath.unshift(result.host);
            }
            result.host = "";
            if (relative.protocol) {
                relative.hostname = null;
                relative.port = null;
                result.auth = null;
                if (relative.host) {
                    if (relPath1[0] === "") relPath1[0] = relative.host;
                    else relPath1.unshift(relative.host);
                }
                relative.host = null;
            }
            mustEndAbs = mustEndAbs && (relPath1[0] === "" || srcPath[0] === "");
        }
        if (isRelAbs) {
            if (relative.host || relative.host === "") {
                if (result.host !== relative.host) result.auth = null;
                result.host = relative.host;
                result.port = relative.port;
            }
            if (relative.hostname || relative.hostname === "") {
                if (result.hostname !== relative.hostname) result.auth = null;
                result.hostname = relative.hostname;
            }
            result.search = relative.search;
            result.query = relative.query;
            srcPath = relPath1;
        } else if (relPath1.length) {
            if (!srcPath) srcPath = [];
            srcPath.pop();
            srcPath = srcPath.concat(relPath1);
            result.search = relative.search;
            result.query = relative.query;
        } else if (relative.search !== null && relative.search !== undefined) {
            if (noLeadingSlashes) {
                result.hostname = result.host = srcPath.shift() || null;
                const authInHost = result.host && result.host.indexOf("@") > 0 && result.host.split("@");
                if (authInHost) {
                    result.auth = authInHost.shift() || null;
                    result.host = result.hostname = authInHost.shift() || null;
                }
            }
            result.search = relative.search;
            result.query = relative.query;
            if (result.pathname !== null || result.search !== null) {
                result.path = (result.pathname ? result.pathname : "") + (result.search ? result.search : "");
            }
            result.href = result.format();
            return result;
        }
        if (!srcPath.length) {
            result.pathname = null;
            if (result.search) {
                result.path = "/" + result.search;
            } else {
                result.path = null;
            }
            result.href = result.format();
            return result;
        }
        let last = srcPath.slice(-1)[0];
        const hasTrailingSlash = (result.host || relative.host || srcPath.length > 1) && (last === "." || last === "..") || last === "";
        let up = 0;
        for(let i = srcPath.length - 1; i >= 0; i--){
            last = srcPath[i];
            if (last === ".") {
                srcPath.splice(i, 1);
            } else if (last === "..") {
                srcPath.splice(i, 1);
                up++;
            } else if (up) {
                srcPath.splice(i, 1);
                up--;
            }
        }
        if (!mustEndAbs && !removeAllDots) {
            while(up--){
                srcPath.unshift("..");
            }
        }
        if (mustEndAbs && srcPath[0] !== "" && (!srcPath[0] || srcPath[0].charAt(0) !== "/")) {
            srcPath.unshift("");
        }
        if (hasTrailingSlash && srcPath.join("/").substr(-1) !== "/") {
            srcPath.push("");
        }
        const isAbsolute = srcPath[0] === "" || srcPath[0] && srcPath[0].charAt(0) === "/";
        if (noLeadingSlashes) {
            result.hostname = result.host = isAbsolute ? "" : srcPath.length ? srcPath.shift() || null : "";
            const authInHost1 = result.host && result.host.indexOf("@") > 0 ? result.host.split("@") : false;
            if (authInHost1) {
                result.auth = authInHost1.shift() || null;
                result.host = result.hostname = authInHost1.shift() || null;
            }
        }
        mustEndAbs = mustEndAbs || result.host && srcPath.length;
        if (mustEndAbs && !isAbsolute) {
            srcPath.unshift("");
        }
        if (!srcPath.length) {
            result.pathname = null;
            result.path = null;
        } else {
            result.pathname = srcPath.join("/");
        }
        if (result.pathname !== null || result.search !== null) {
            result.path = (result.pathname ? result.pathname : "") + (result.search ? result.search : "");
        }
        result.auth = relative.auth || result.auth;
        result.slashes = result.slashes || relative.slashes;
        result.href = result.format();
        return result;
    }
    format() {
        let auth = this.auth || "";
        if (auth) {
            auth = encodeStr(auth, noEscapeAuth, hexTable);
            auth += "@";
        }
        let protocol = this.protocol || "";
        let pathname = this.pathname || "";
        let hash = this.hash || "";
        let host = "";
        let query = "";
        if (this.host) {
            host = auth + this.host;
        } else if (this.hostname) {
            host = auth + (this.hostname.includes(":") && !isIpv6Hostname(this.hostname) ? "[" + this.hostname + "]" : this.hostname);
            if (this.port) {
                host += ":" + this.port;
            }
        }
        if (this.query !== null && typeof this.query === "object") {
            query = __default3.stringify(this.query);
        }
        let search = this.search || query && "?" + query || "";
        if (protocol && protocol.charCodeAt(protocol.length - 1) !== 58) {
            protocol += ":";
        }
        let newPathname = "";
        let lastPos = 0;
        for(let i = 0; i < pathname.length; ++i){
            switch(pathname.charCodeAt(i)){
                case 35:
                    if (i - lastPos > 0) {
                        newPathname += pathname.slice(lastPos, i);
                    }
                    newPathname += "%23";
                    lastPos = i + 1;
                    break;
                case 63:
                    if (i - lastPos > 0) {
                        newPathname += pathname.slice(lastPos, i);
                    }
                    newPathname += "%3F";
                    lastPos = i + 1;
                    break;
            }
        }
        if (lastPos > 0) {
            if (lastPos !== pathname.length) {
                pathname = newPathname + pathname.slice(lastPos);
            } else pathname = newPathname;
        }
        if (this.slashes || slashedProtocol.has(protocol)) {
            if (this.slashes || host) {
                if (pathname && pathname.charCodeAt(0) !== 47) {
                    pathname = "/" + pathname;
                }
                host = "//" + host;
            } else if (protocol.length >= 4 && protocol.charCodeAt(0) === 102 && protocol.charCodeAt(1) === 105 && protocol.charCodeAt(2) === 108 && protocol.charCodeAt(3) === 101) {
                host = "//";
            }
        }
        search = search.replace(/#/g, "%23");
        if (hash && hash.charCodeAt(0) !== 35) {
            hash = "#" + hash;
        }
        if (search && search.charCodeAt(0) !== 63) {
            search = "?" + search;
        }
        return protocol + host + pathname + search + hash;
    }
    urlParse(url, parseQueryString, slashesDenoteHost) {
        let hasHash = false;
        let start = -1;
        let end = -1;
        let rest = "";
        let lastPos = 0;
        for(let i = 0, inWs = false, split = false; i < url.length; ++i){
            const code = url.charCodeAt(i);
            const isWs = code === 32 || code === 9 || code === 13 || code === 10 || code === 12 || code === 160 || code === 65279;
            if (start === -1) {
                if (isWs) continue;
                lastPos = start = i;
            } else if (inWs) {
                if (!isWs) {
                    end = -1;
                    inWs = false;
                }
            } else if (isWs) {
                end = i;
                inWs = true;
            }
            if (!split) {
                switch(code){
                    case 35:
                        hasHash = true;
                    case 63:
                        split = true;
                        break;
                    case 92:
                        if (i - lastPos > 0) rest += url.slice(lastPos, i);
                        rest += "/";
                        lastPos = i + 1;
                        break;
                }
            } else if (!hasHash && code === 35) {
                hasHash = true;
            }
        }
        if (start !== -1) {
            if (lastPos === start) {
                if (end === -1) {
                    if (start === 0) rest = url;
                    else rest = url.slice(start);
                } else {
                    rest = url.slice(start, end);
                }
            } else if (end === -1 && lastPos < url.length) {
                rest += url.slice(lastPos);
            } else if (end !== -1 && lastPos < end) {
                rest += url.slice(lastPos, end);
            }
        }
        if (!slashesDenoteHost && !hasHash) {
            const simplePath = simplePathPattern.exec(rest);
            if (simplePath) {
                this.path = rest;
                this.href = rest;
                this.pathname = simplePath[1];
                if (simplePath[2]) {
                    this.search = simplePath[2];
                    if (parseQueryString) {
                        this.query = __default3.parse(this.search.slice(1));
                    } else {
                        this.query = this.search.slice(1);
                    }
                } else if (parseQueryString) {
                    this.search = null;
                    this.query = Object.create(null);
                }
                return this;
            }
        }
        let proto = protocolPattern.exec(rest);
        let lowerProto = "";
        if (proto) {
            proto = proto[0];
            lowerProto = proto.toLowerCase();
            this.protocol = lowerProto;
            rest = rest.slice(proto.length);
        }
        let slashes;
        if (slashesDenoteHost || proto || hostPattern.test(rest)) {
            slashes = rest.charCodeAt(0) === CHAR_FORWARD_SLASH1 && rest.charCodeAt(1) === CHAR_FORWARD_SLASH1;
            if (slashes && !(proto && hostlessProtocol.has(lowerProto))) {
                rest = rest.slice(2);
                this.slashes = true;
            }
        }
        if (!hostlessProtocol.has(lowerProto) && (slashes || proto && !slashedProtocol.has(proto))) {
            let hostEnd = -1;
            let atSign = -1;
            let nonHost = -1;
            for(let i1 = 0; i1 < rest.length; ++i1){
                switch(rest.charCodeAt(i1)){
                    case 9:
                    case 10:
                    case 13:
                    case 32:
                    case 34:
                    case 37:
                    case 39:
                    case 59:
                    case 60:
                    case 62:
                    case 92:
                    case 94:
                    case 96:
                    case 123:
                    case 124:
                    case 125:
                        if (nonHost === -1) nonHost = i1;
                        break;
                    case 35:
                    case 47:
                    case 63:
                        if (nonHost === -1) nonHost = i1;
                        hostEnd = i1;
                        break;
                    case 64:
                        atSign = i1;
                        nonHost = -1;
                        break;
                }
                if (hostEnd !== -1) break;
            }
            start = 0;
            if (atSign !== -1) {
                this.auth = decodeURIComponent(rest.slice(0, atSign));
                start = atSign + 1;
            }
            if (nonHost === -1) {
                this.host = rest.slice(start);
                rest = "";
            } else {
                this.host = rest.slice(start, nonHost);
                rest = rest.slice(nonHost);
            }
            this.#parseHost();
            if (typeof this.hostname !== "string") this.hostname = "";
            const hostname = this.hostname;
            const ipv6Hostname = isIpv6Hostname(hostname);
            if (!ipv6Hostname) {
                rest = getHostname(this, rest, hostname);
            }
            if (this.hostname.length > 255) {
                this.hostname = "";
            } else {
                this.hostname = this.hostname.toLowerCase();
            }
            if (!ipv6Hostname) {
                this.hostname = toASCII(this.hostname);
            }
            const p = this.port ? ":" + this.port : "";
            const h = this.hostname || "";
            this.host = h + p;
            if (ipv6Hostname) {
                this.hostname = this.hostname.slice(1, -1);
                if (rest[0] !== "/") {
                    rest = "/" + rest;
                }
            }
        }
        if (!unsafeProtocol.has(lowerProto)) {
            rest = autoEscapeStr(rest);
        }
        let questionIdx = -1;
        let hashIdx = -1;
        for(let i2 = 0; i2 < rest.length; ++i2){
            const code1 = rest.charCodeAt(i2);
            if (code1 === 35) {
                this.hash = rest.slice(i2);
                hashIdx = i2;
                break;
            } else if (code1 === 63 && questionIdx === -1) {
                questionIdx = i2;
            }
        }
        if (questionIdx !== -1) {
            if (hashIdx === -1) {
                this.search = rest.slice(questionIdx);
                this.query = rest.slice(questionIdx + 1);
            } else {
                this.search = rest.slice(questionIdx, hashIdx);
                this.query = rest.slice(questionIdx + 1, hashIdx);
            }
            if (parseQueryString) {
                this.query = __default3.parse(this.query);
            }
        } else if (parseQueryString) {
            this.search = null;
            this.query = Object.create(null);
        }
        const useQuestionIdx = questionIdx !== -1 && (hashIdx === -1 || questionIdx < hashIdx);
        const firstIdx = useQuestionIdx ? questionIdx : hashIdx;
        if (firstIdx === -1) {
            if (rest.length > 0) this.pathname = rest;
        } else if (firstIdx > 0) {
            this.pathname = rest.slice(0, firstIdx);
        }
        if (slashedProtocol.has(lowerProto) && this.hostname && !this.pathname) {
            this.pathname = "/";
        }
        if (this.pathname || this.search) {
            const p1 = this.pathname || "";
            const s = this.search || "";
            this.path = p1 + s;
        }
        this.href = this.format();
        return this;
    }
}
function format6(urlObject, options) {
    if (urlObject instanceof URL) {
        return formatWhatwg(urlObject, options);
    }
    if (typeof urlObject === "string") {
        urlObject = parse8(urlObject, true, false);
    }
    return urlObject.format();
}
function formatWhatwg(urlObject, options) {
    if (typeof urlObject === "string") {
        urlObject = new URL(urlObject);
    }
    if (options) {
        if (typeof options !== "object") {
            throw new ERR_INVALID_ARG_TYPE("options", "object", options);
        }
    }
    options = {
        auth: true,
        fragment: true,
        search: true,
        unicode: false,
        ...options
    };
    let ret = urlObject.protocol;
    if (urlObject.host !== null) {
        ret += "//";
        const hasUsername = !!urlObject.username;
        const hasPassword = !!urlObject.password;
        if (options.auth && (hasUsername || hasPassword)) {
            if (hasUsername) {
                ret += urlObject.username;
            }
            if (hasPassword) {
                ret += `:${urlObject.password}`;
            }
            ret += "@";
        }
        ret += urlObject.host;
        if (urlObject.port) {
            ret += `:${urlObject.port}`;
        }
    }
    ret += urlObject.pathname;
    if (options.search && urlObject.search) {
        ret += urlObject.search;
    }
    if (options.fragment && urlObject.hash) {
        ret += urlObject.hash;
    }
    return ret;
}
function isIpv6Hostname(hostname) {
    return hostname.charCodeAt(0) === 91 && hostname.charCodeAt(hostname.length - 1) === 93;
}
function getHostname(self1, rest, hostname) {
    for(let i = 0; i < hostname.length; ++i){
        const code = hostname.charCodeAt(i);
        const isValid = code >= 97 && code <= 122 || code === 46 || code >= 65 && code <= 90 || code >= 48 && code <= 57 || code === 45 || code === 43 || code === 95 || code > 127;
        if (!isValid) {
            self1.hostname = hostname.slice(0, i);
            return `/${hostname.slice(i)}${rest}`;
        }
    }
    return rest;
}
const escapedCodes = [
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "%09",
    "%0A",
    "",
    "",
    "%0D",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "%20",
    "",
    "%22",
    "",
    "",
    "",
    "",
    "%27",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "%3C",
    "",
    "%3E",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "%5C",
    "",
    "%5E",
    "",
    "%60",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "%7B",
    "%7C",
    "%7D"
];
function autoEscapeStr(rest) {
    let escaped = "";
    let lastEscapedPos = 0;
    for(let i = 0; i < rest.length; ++i){
        const escapedChar = escapedCodes[rest.charCodeAt(i)];
        if (escapedChar) {
            if (i > lastEscapedPos) {
                escaped += rest.slice(lastEscapedPos, i);
            }
            escaped += escapedChar;
            lastEscapedPos = i + 1;
        }
    }
    if (lastEscapedPos === 0) {
        return rest;
    }
    if (lastEscapedPos < rest.length) {
        escaped += rest.slice(lastEscapedPos);
    }
    return escaped;
}
function parse8(url, parseQueryString, slashesDenoteHost) {
    if (url instanceof Url) return url;
    const urlObject = new Url();
    urlObject.urlParse(url, parseQueryString, slashesDenoteHost);
    return urlObject;
}
function resolve6(from, to) {
    return parse8(from, false, true).resolve(to);
}
function resolveObject(source, relative) {
    if (!source) return relative;
    return parse8(source, false, true).resolveObject(relative);
}
function fileURLToPath(path) {
    if (typeof path === "string") path = new URL(path);
    else if (!(path instanceof URL)) {
        throw new ERR_INVALID_ARG_TYPE("path", [
            "string",
            "URL"
        ], path);
    }
    if (path.protocol !== "file:") {
        throw new ERR_INVALID_URL_SCHEME("file");
    }
    return isWindows1 ? getPathFromURLWin(path) : getPathFromURLPosix(path);
}
function getPathFromURLWin(url) {
    const hostname = url.hostname;
    let pathname = url.pathname;
    for(let n = 0; n < pathname.length; n++){
        if (pathname[n] === "%") {
            const third = pathname.codePointAt(n + 2) | 0x20;
            if (pathname[n + 1] === "2" && third === 102 || pathname[n + 1] === "5" && third === 99) {
                throw new ERR_INVALID_FILE_URL_PATH("must not include encoded \\ or / characters");
            }
        }
    }
    pathname = pathname.replace(forwardSlashRegEx, "\\");
    pathname = decodeURIComponent(pathname);
    if (hostname !== "") {
        return `\\\\${hostname}${pathname}`;
    } else {
        const letter = pathname.codePointAt(1) | 0x20;
        const sep = pathname[2];
        if (letter < 97 || letter > 122 || sep !== ":") {
            throw new ERR_INVALID_FILE_URL_PATH("must be absolute");
        }
        return pathname.slice(1);
    }
}
function getPathFromURLPosix(url) {
    if (url.hostname !== "") {
        throw new ERR_INVALID_FILE_URL_HOST(osType1);
    }
    const pathname = url.pathname;
    for(let n = 0; n < pathname.length; n++){
        if (pathname[n] === "%") {
            const third = pathname.codePointAt(n + 2) | 0x20;
            if (pathname[n + 1] === "2" && third === 102) {
                throw new ERR_INVALID_FILE_URL_PATH("must not include encoded / characters");
            }
        }
    }
    return decodeURIComponent(pathname);
}
function encodePathChars(filepath) {
    if (filepath.includes("%")) {
        filepath = filepath.replace(percentRegEx, "%25");
    }
    if (!isWindows1 && filepath.includes("\\")) {
        filepath = filepath.replace(backslashRegEx, "%5C");
    }
    if (filepath.includes("\n")) {
        filepath = filepath.replace(newlineRegEx, "%0A");
    }
    if (filepath.includes("\r")) {
        filepath = filepath.replace(carriageReturnRegEx, "%0D");
    }
    if (filepath.includes("\t")) {
        filepath = filepath.replace(tabRegEx, "%09");
    }
    return filepath;
}
function pathToFileURL(filepath) {
    const outURL = new URL("file://");
    if (isWindows1 && filepath.startsWith("\\\\")) {
        const paths = filepath.split("\\");
        if (paths.length <= 3) {
            throw new ERR_INVALID_ARG_VALUE("filepath", filepath, "Missing UNC resource path");
        }
        const hostname = paths[2];
        if (hostname.length === 0) {
            throw new ERR_INVALID_ARG_VALUE("filepath", filepath, "Empty UNC servername");
        }
        outURL.hostname = hostname;
        outURL.pathname = encodePathChars(paths.slice(3).join("/"));
    } else {
        let resolved = resolve5(filepath);
        const filePathLast = filepath.charCodeAt(filepath.length - 1);
        if ((filePathLast === 47 || isWindows1 && filePathLast === 92) && resolved[resolved.length - 1] !== sep5) {
            resolved += "/";
        }
        outURL.pathname = encodePathChars(resolved);
    }
    return outURL;
}
function urlToHttpOptions(url) {
    const options = {
        protocol: url.protocol,
        hostname: typeof url.hostname === "string" && url.hostname.startsWith("[") ? url.hostname.slice(1, -1) : url.hostname,
        hash: url.hash,
        search: url.search,
        pathname: url.pathname,
        path: `${url.pathname || ""}${url.search || ""}`,
        href: url.href
    };
    if (url.port !== "") {
        options.port = Number(url.port);
    }
    if (url.username || url.password) {
        options.auth = `${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`;
    }
    return options;
}
URLSearchParams;
const __default4 = {
    parse: parse8,
    format: format6,
    resolve: resolve6,
    resolveObject,
    fileURLToPath,
    pathToFileURL,
    urlToHttpOptions,
    Url,
    URL,
    URLSearchParams
};
var fr = Object.create;
var N = Object.defineProperty;
var sr = Object.getOwnPropertyDescriptor;
var dr = Object.getOwnPropertyNames;
var lr = Object.getPrototypeOf, mr = Object.prototype.hasOwnProperty;
((n)=>typeof require != "undefined" ? require : typeof Proxy != "undefined" ? new Proxy(n, {
        get: (r, e)=>(typeof require != "undefined" ? require : r)[e]
    }) : n)(function(n) {
    if (typeof require != "undefined") return require.apply(this, arguments);
    throw new Error('Dynamic require of "' + n + '" is not supported');
});
var S = (n, r)=>()=>(r || n((r = {
            exports: {}
        }).exports, r), r.exports);
var vr = (n, r, e, t)=>{
    if (r && typeof r == "object" || typeof r == "function") for (let i of dr(r))!mr.call(n, i) && i !== e && N(n, i, {
        get: ()=>r[i],
        enumerable: !(t = sr(r, i)) || t.enumerable
    });
    return n;
};
var pr = (n, r, e)=>(e = n != null ? fr(lr(n)) : {}, vr(r || !n || !n.__esModule ? N(e, "default", {
        value: n,
        enumerable: !0
    }) : e, n));
var w = S((F, V)=>{
    "use strict";
    var T = __default4, _ = F.ValidationError = function(r, e, t, i, a, u) {
        if (Array.isArray(i) ? (this.path = i, this.property = i.reduce(function(s, f) {
            return s + L(f);
        }, "instance")) : i !== void 0 && (this.property = i), r && (this.message = r), t) {
            var o = t.$id || t.id;
            this.schema = o || t;
        }
        e !== void 0 && (this.instance = e), this.name = a, this.argument = u, this.stack = this.toString();
    };
    _.prototype.toString = function() {
        return this.property + " " + this.message;
    };
    var $ = F.ValidatorResult = function(r, e, t, i) {
        this.instance = r, this.schema = e, this.options = t, this.path = i.path, this.propertyPath = i.propertyPath, this.errors = [], this.throwError = t && t.throwError, this.throwFirst = t && t.throwFirst, this.throwAll = t && t.throwAll, this.disableFormat = t && t.disableFormat === !0;
    };
    $.prototype.addError = function(r) {
        var e;
        if (typeof r == "string") e = new _(r, this.instance, this.schema, this.path);
        else {
            if (!r) throw new Error("Missing error detail");
            if (!r.message) throw new Error("Missing error message");
            if (!r.name) throw new Error("Missing validator type");
            e = new _(r.message, this.instance, this.schema, this.path, r.name, r.argument);
        }
        if (this.errors.push(e), this.throwFirst) throw new b(this);
        if (this.throwError) throw e;
        return e;
    };
    $.prototype.importErrors = function(r) {
        typeof r == "string" || r && r.validatorType ? this.addError(r) : r && r.errors && (this.errors = this.errors.concat(r.errors));
    };
    function hr(n, r) {
        return r + ": " + n.toString() + `
`;
    }
    $.prototype.toString = function(r) {
        return this.errors.map(hr).join("");
    };
    Object.defineProperty($.prototype, "valid", {
        get: function() {
            return !this.errors.length;
        }
    });
    V.exports.ValidatorResultError = b;
    function b(n) {
        Error.captureStackTrace && Error.captureStackTrace(this, b), this.instance = n.instance, this.schema = n.schema, this.options = n.options, this.errors = n.errors;
    }
    b.prototype = new Error;
    b.prototype.constructor = b;
    b.prototype.name = "Validation Error";
    var D = F.SchemaError = function n(r, e) {
        this.message = r, this.schema = e, Error.call(this, r), Error.captureStackTrace(this, n);
    };
    D.prototype = Object.create(Error.prototype, {
        constructor: {
            value: D,
            enumerable: !1
        },
        name: {
            value: "SchemaError",
            enumerable: !1
        }
    });
    var M = F.SchemaContext = function(r, e, t, i, a) {
        this.schema = r, this.options = e, Array.isArray(t) ? (this.path = t, this.propertyPath = t.reduce(function(u, o) {
            return u + L(o);
        }, "instance")) : this.propertyPath = t, this.base = i, this.schemas = a;
    };
    M.prototype.resolve = function(r) {
        return T.resolve(this.base, r);
    };
    M.prototype.makeChild = function(r, e) {
        var t = e === void 0 ? this.path : this.path.concat([
            e
        ]), i = r.$id || r.id, a = T.resolve(this.base, i || ""), u = new M(r, this.options, t, a, Object.create(this.schemas));
        return i && !u.schemas[a] && (u.schemas[a] = r), u;
    };
    var y = F.FORMAT_REGEXPS = {
        "date-time": /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])[tT ](2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])(\.\d+)?([zZ]|[+-]([0-5][0-9]):(60|[0-5][0-9]))$/,
        date: /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])$/,
        time: /^(2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])$/,
        duration: /P(T\d+(H(\d+M(\d+S)?)?|M(\d+S)?|S)|\d+(D|M(\d+D)?|Y(\d+M(\d+D)?)?)(T\d+(H(\d+M(\d+S)?)?|M(\d+S)?|S))?|\d+W)/i,
        email: /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/,
        "idn-email": /^("(?:[!#-\[\]-\u{10FFFF}]|\\[\t -\u{10FFFF}])*"|[!#-'*+\-/-9=?A-Z\^-\u{10FFFF}](?:\.?[!#-'*+\-/-9=?A-Z\^-\u{10FFFF}])*)@([!#-'*+\-/-9=?A-Z\^-\u{10FFFF}](?:\.?[!#-'*+\-/-9=?A-Z\^-\u{10FFFF}])*|\[[!-Z\^-\u{10FFFF}]*\])$/u,
        "ip-address": /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        ipv6: /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/,
        uri: /^[a-zA-Z][a-zA-Z0-9+.-]*:[^\s]*$/,
        "uri-reference": /^(((([A-Za-z][+\-.0-9A-Za-z]*(:%[0-9A-Fa-f]{2}|:[!$&-.0-;=?-Z_a-z~]|[/?])|\?)(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*|([A-Za-z][+\-.0-9A-Za-z]*:?)?)|([A-Za-z][+\-.0-9A-Za-z]*:)?\/((%[0-9A-Fa-f]{2}|\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+|(\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\])?)(:\d*)?[/?]|[!$&-.0-;=?-Z_a-z~])(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*|(\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+|(\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\])?)(:\d*)?)?))#(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*|(([A-Za-z][+\-.0-9A-Za-z]*)?%[0-9A-Fa-f]{2}|[!$&-.0-9;=@_~]|[A-Za-z][+\-.0-9A-Za-z]*[!$&-*,;=@_~])(%[0-9A-Fa-f]{2}|[!$&-.0-9;=@-Z_a-z~])*((([/?](%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*)?#|[/?])(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*)?|([A-Za-z][+\-.0-9A-Za-z]*(:%[0-9A-Fa-f]{2}|:[!$&-.0-;=?-Z_a-z~]|[/?])|\?)(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*|([A-Za-z][+\-.0-9A-Za-z]*:)?\/((%[0-9A-Fa-f]{2}|\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+|(\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\])?)(:\d*)?[/?]|[!$&-.0-;=?-Z_a-z~])(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*|\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+(:\d*)?|(\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\])?:\d*|\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\])?)?|[A-Za-z][+\-.0-9A-Za-z]*:?)?$/,
        iri: /^[a-zA-Z][a-zA-Z0-9+.-]*:[^\s]*$/,
        "iri-reference": /^(((([A-Za-z][+\-.0-9A-Za-z]*(:%[0-9A-Fa-f]{2}|:[!$&-.0-;=?-Z_a-z~-\u{10FFFF}]|[/?])|\?)(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~-\u{10FFFF}])*|([A-Za-z][+\-.0-9A-Za-z]*:?)?)|([A-Za-z][+\-.0-9A-Za-z]*:)?\/((%[0-9A-Fa-f]{2}|\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~-\u{10FFFF}])+|(\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~-\u{10FFFF}]+)?|[.0-:A-Fa-f]+)\])?)(:\d*)?[/?]|[!$&-.0-;=?-Z_a-z~-\u{10FFFF}])(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~-\u{10FFFF}])*|(\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~-\u{10FFFF}])+|(\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~-\u{10FFFF}]+)?|[.0-:A-Fa-f]+)\])?)(:\d*)?)?))#(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~-\u{10FFFF}])*|(([A-Za-z][+\-.0-9A-Za-z]*)?%[0-9A-Fa-f]{2}|[!$&-.0-9;=@_~-\u{10FFFF}]|[A-Za-z][+\-.0-9A-Za-z]*[!$&-*,;=@_~-\u{10FFFF}])(%[0-9A-Fa-f]{2}|[!$&-.0-9;=@-Z_a-z~-\u{10FFFF}])*((([/?](%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~-\u{10FFFF}])*)?#|[/?])(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~-\u{10FFFF}])*)?|([A-Za-z][+\-.0-9A-Za-z]*(:%[0-9A-Fa-f]{2}|:[!$&-.0-;=?-Z_a-z~-\u{10FFFF}]|[/?])|\?)(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~-\u{10FFFF}])*|([A-Za-z][+\-.0-9A-Za-z]*:)?\/((%[0-9A-Fa-f]{2}|\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~-\u{10FFFF}])+|(\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~-\u{10FFFF}]+)?|[.0-:A-Fa-f]+)\])?)(:\d*)?[/?]|[!$&-.0-;=?-Z_a-z~-\u{10FFFF}])(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~-\u{10FFFF}])*|\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~-\u{10FFFF}])+(:\d*)?|(\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~-\u{10FFFF}]+)?|[.0-:A-Fa-f]+)\])?:\d*|\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~-\u{10FFFF}]+)?|[.0-:A-Fa-f]+)\])?)?|[A-Za-z][+\-.0-9A-Za-z]*:?)?$/u,
        uuid: /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
        "uri-template": /(%[0-9a-f]{2}|[!#$&(-;=?@\[\]_a-z~]|\{[!#&+,./;=?@|]?(%[0-9a-f]{2}|[0-9_a-z])(\.?(%[0-9a-f]{2}|[0-9_a-z]))*(:[1-9]\d{0,3}|\*)?(,(%[0-9a-f]{2}|[0-9_a-z])(\.?(%[0-9a-f]{2}|[0-9_a-z]))*(:[1-9]\d{0,3}|\*)?)*\})*/iu,
        "json-pointer": /^(\/([\x00-\x2e0-@\[-}\x7f]|~[01])*)*$/iu,
        "relative-json-pointer": /^\d+(#|(\/([\x00-\x2e0-@\[-}\x7f]|~[01])*)*)$/iu,
        hostname: /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$/,
        "host-name": /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$/,
        "utc-millisec": function(n) {
            return typeof n == "string" && parseFloat(n) === parseInt(n, 10) && !isNaN(n);
        },
        regex: function(n) {
            var r = !0;
            try {
                new RegExp(n);
            } catch  {
                r = !1;
            }
            return r;
        },
        style: /[\r\n\t ]*[^\r\n\t ][^:]*:[\r\n\t ]*[^\r\n\t ;]*[\r\n\t ]*;?/,
        color: /^(#?([0-9A-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/,
        phone: /^\+(?:[0-9] ?){6,14}[0-9]$/,
        alpha: /^[a-zA-Z]+$/,
        alphanumeric: /^[a-zA-Z0-9]+$/
    };
    y.regexp = y.regex;
    y.pattern = y.regex;
    y.ipv4 = y["ip-address"];
    F.isFormat = function(r, e, t) {
        if (typeof r == "string" && y[e] !== void 0) {
            if (y[e] instanceof RegExp) return y[e].test(r);
            if (typeof y[e] == "function") return y[e](r);
        } else if (t && t.customFormats && typeof t.customFormats[e] == "function") return t.customFormats[e](r);
        return !0;
    };
    var L = F.makeSuffix = function(r) {
        return r = r.toString(), !r.match(/[.\s\[\]]/) && !r.match(/^[\d]/) ? "." + r : r.match(/^\d+$/) ? "[" + r + "]" : "[" + JSON.stringify(r) + "]";
    };
    F.deepCompareStrict = function n(r, e) {
        if (typeof r != typeof e) return !1;
        if (Array.isArray(r)) return !Array.isArray(e) || r.length !== e.length ? !1 : r.every(function(a, u) {
            return n(r[u], e[u]);
        });
        if (typeof r == "object") {
            if (!r || !e) return r === e;
            var t = Object.keys(r), i = Object.keys(e);
            return t.length !== i.length ? !1 : t.every(function(a) {
                return n(r[a], e[a]);
            });
        }
        return r === e;
    };
    function Fr(n, r, e, t) {
        typeof e == "object" ? r[t] = R(n[t], e) : n.indexOf(e) === -1 && r.push(e);
    }
    function Ar(n, r, e) {
        r[e] = n[e];
    }
    function yr(n, r, e, t) {
        typeof r[t] != "object" || !r[t] ? e[t] = r[t] : n[t] ? e[t] = R(n[t], r[t]) : e[t] = r[t];
    }
    function R(n, r) {
        var e = Array.isArray(r), t = e && [] || {};
        return e ? (n = n || [], t = t.concat(n), r.forEach(Fr.bind(null, n, t))) : (n && typeof n == "object" && Object.keys(n).forEach(Ar.bind(null, n, t)), Object.keys(r).forEach(yr.bind(null, n, r, t))), t;
    }
    V.exports.deepMerge = R;
    F.objectGetPath = function(r, e) {
        for(var t = e.split("/").slice(1), i; typeof (i = t.shift()) == "string";){
            var a = decodeURIComponent(i.replace(/~0/, "~").replace(/~1/g, "/"));
            if (!(a in r)) return;
            r = r[a];
        }
        return r;
    };
    function gr(n) {
        return "/" + encodeURIComponent(n).replace(/~/g, "%7E");
    }
    F.encodePath = function(r) {
        return r.map(gr).join("");
    };
    F.getDecimalPlaces = function(r) {
        var e = 0;
        if (isNaN(r)) return e;
        typeof r != "number" && (r = Number(r));
        var t = r.toString().split("e");
        if (t.length === 2) {
            if (t[1][0] !== "-") return e;
            e = Number(t[1].slice(1));
        }
        var i = t[0].split(".");
        return i.length === 2 && (e += i[1].length), e;
    };
    F.isSchema = function(r) {
        return typeof r == "object" && r || typeof r == "boolean";
    };
});
var U = S((Zr, B)=>{
    "use strict";
    var A = w(), m = A.ValidatorResult, E = A.SchemaError, j = {};
    j.ignoreProperties = {
        id: !0,
        default: !0,
        description: !0,
        title: !0,
        additionalItems: !0,
        then: !0,
        else: !0,
        $schema: !0,
        $ref: !0,
        extends: !0
    };
    var v = j.validators = {};
    v.type = function(r, e, t, i) {
        if (r === void 0) return null;
        var a = new m(r, e, t, i), u = Array.isArray(e.type) ? e.type : [
            e.type
        ];
        if (!u.some(this.testType.bind(this, r, e, t, i))) {
            var o = u.map(function(s) {
                if (!!s) {
                    var f = s.$id || s.id;
                    return f ? "<" + f + ">" : s + "";
                }
            });
            a.addError({
                name: "type",
                argument: o,
                message: "is not of a type(s) " + o
            });
        }
        return a;
    };
    function q(n, r, e, t, i) {
        var a = r.throwError, u = r.throwAll;
        r.throwError = !1, r.throwAll = !1;
        var o = this.validateSchema(n, i, r, e);
        return r.throwError = a, r.throwAll = u, !o.valid && t instanceof Function && t(o), o.valid;
    }
    v.anyOf = function(r, e, t, i) {
        if (r === void 0) return null;
        var a = new m(r, e, t, i), u = new m(r, e, t, i);
        if (!Array.isArray(e.anyOf)) throw new E("anyOf must be an array");
        if (!e.anyOf.some(q.bind(this, r, t, i, function(s) {
            u.importErrors(s);
        }))) {
            var o = e.anyOf.map(function(s, f) {
                var d = s.$id || s.id;
                return d ? "<" + d + ">" : s.title && JSON.stringify(s.title) || s.$ref && "<" + s.$ref + ">" || "[subschema " + f + "]";
            });
            t.nestedErrors && a.importErrors(u), a.addError({
                name: "anyOf",
                argument: o,
                message: "is not any of " + o.join(",")
            });
        }
        return a;
    };
    v.allOf = function(r, e, t, i) {
        if (r === void 0) return null;
        if (!Array.isArray(e.allOf)) throw new E("allOf must be an array");
        var a = new m(r, e, t, i), u = this;
        return e.allOf.forEach(function(o, s) {
            var f = u.validateSchema(r, o, t, i);
            if (!f.valid) {
                var d = o.$id || o.id, h = d || o.title && JSON.stringify(o.title) || o.$ref && "<" + o.$ref + ">" || "[subschema " + s + "]";
                a.addError({
                    name: "allOf",
                    argument: {
                        id: h,
                        length: f.errors.length,
                        valid: f
                    },
                    message: "does not match allOf schema " + h + " with " + f.errors.length + " error[s]:"
                }), a.importErrors(f);
            }
        }), a;
    };
    v.oneOf = function(r, e, t, i) {
        if (r === void 0) return null;
        if (!Array.isArray(e.oneOf)) throw new E("oneOf must be an array");
        var a = new m(r, e, t, i), u = new m(r, e, t, i), o = e.oneOf.filter(q.bind(this, r, t, i, function(f) {
            u.importErrors(f);
        })).length, s = e.oneOf.map(function(f, d) {
            var h = f.$id || f.id;
            return h || f.title && JSON.stringify(f.title) || f.$ref && "<" + f.$ref + ">" || "[subschema " + d + "]";
        });
        return o !== 1 && (t.nestedErrors && a.importErrors(u), a.addError({
            name: "oneOf",
            argument: s,
            message: "is not exactly one from " + s.join(",")
        })), a;
    };
    v.if = function(r, e, t, i) {
        if (r === void 0) return null;
        if (!A.isSchema(e.if)) throw new Error('Expected "if" keyword to be a schema');
        var a = q.call(this, r, t, i, null, e.if), u = new m(r, e, t, i), o;
        if (a) {
            if (e.then === void 0) return;
            if (!A.isSchema(e.then)) throw new Error('Expected "then" keyword to be a schema');
            o = this.validateSchema(r, e.then, t, i.makeChild(e.then)), u.importErrors(o);
        } else {
            if (e.else === void 0) return;
            if (!A.isSchema(e.else)) throw new Error('Expected "else" keyword to be a schema');
            o = this.validateSchema(r, e.else, t, i.makeChild(e.else)), u.importErrors(o);
        }
        return u;
    };
    function I(n, r) {
        if (Object.hasOwnProperty.call(n, r)) return n[r];
        if (r in n) {
            for(; n = Object.getPrototypeOf(n);)if (Object.propertyIsEnumerable.call(n, r)) return n[r];
        }
    }
    v.propertyNames = function(r, e, t, i) {
        if (!!this.types.object(r)) {
            var a = new m(r, e, t, i), u = e.propertyNames !== void 0 ? e.propertyNames : {};
            if (!A.isSchema(u)) throw new E('Expected "propertyNames" to be a schema (object or boolean)');
            for(var o in r)if (I(r, o) !== void 0) {
                var s = this.validateSchema(o, u, t, i.makeChild(u));
                a.importErrors(s);
            }
            return a;
        }
    };
    v.properties = function(r, e, t, i) {
        if (!!this.types.object(r)) {
            var a = new m(r, e, t, i), u = e.properties || {};
            for(var o in u){
                var s = u[o];
                if (s !== void 0) {
                    if (s === null) throw new E('Unexpected null, expected schema in "properties"');
                    typeof t.preValidateProperty == "function" && t.preValidateProperty(r, o, s, t, i);
                    var f = I(r, o), d = this.validateSchema(f, s, t, i.makeChild(s, o));
                    d.instance !== a.instance[o] && (a.instance[o] = d.instance), a.importErrors(d);
                }
            }
            return a;
        }
    };
    function k(n, r, e, t, i, a) {
        if (!!this.types.object(n) && !(r.properties && r.properties[i] !== void 0)) if (r.additionalProperties === !1) a.addError({
            name: "additionalProperties",
            argument: i,
            message: "is not allowed to have the additional property " + JSON.stringify(i)
        });
        else {
            var u = r.additionalProperties || {};
            typeof e.preValidateProperty == "function" && e.preValidateProperty(n, i, u, e, t);
            var o = this.validateSchema(n[i], u, e, t.makeChild(u, i));
            o.instance !== a.instance[i] && (a.instance[i] = o.instance), a.importErrors(o);
        }
    }
    v.patternProperties = function(r, e, t, i) {
        if (!!this.types.object(r)) {
            var a = new m(r, e, t, i), u = e.patternProperties || {};
            for(var o in r){
                var s = !0;
                for(var f in u){
                    var d = u[f];
                    if (d !== void 0) {
                        if (d === null) throw new E('Unexpected null, expected schema in "patternProperties"');
                        try {
                            var h = new RegExp(f, "u");
                        } catch  {
                            h = new RegExp(f);
                        }
                        if (!!h.test(o)) {
                            s = !1, typeof t.preValidateProperty == "function" && t.preValidateProperty(r, o, d, t, i);
                            var l = this.validateSchema(r[o], d, t, i.makeChild(d, o));
                            l.instance !== a.instance[o] && (a.instance[o] = l.instance), a.importErrors(l);
                        }
                    }
                }
                s && k.call(this, r, e, t, i, o, a);
            }
            return a;
        }
    };
    v.additionalProperties = function(r, e, t, i) {
        if (!!this.types.object(r)) {
            if (e.patternProperties) return null;
            var a = new m(r, e, t, i);
            for(var u in r)k.call(this, r, e, t, i, u, a);
            return a;
        }
    };
    v.minProperties = function(r, e, t, i) {
        if (!!this.types.object(r)) {
            var a = new m(r, e, t, i), u = Object.keys(r);
            return u.length >= e.minProperties || a.addError({
                name: "minProperties",
                argument: e.minProperties,
                message: "does not meet minimum property length of " + e.minProperties
            }), a;
        }
    };
    v.maxProperties = function(r, e, t, i) {
        if (!!this.types.object(r)) {
            var a = new m(r, e, t, i), u = Object.keys(r);
            return u.length <= e.maxProperties || a.addError({
                name: "maxProperties",
                argument: e.maxProperties,
                message: "does not meet maximum property length of " + e.maxProperties
            }), a;
        }
    };
    v.items = function(r, e, t, i) {
        var a = this;
        if (!!this.types.array(r) && e.items !== void 0) {
            var u = new m(r, e, t, i);
            return r.every(function(o, s) {
                if (Array.isArray(e.items)) var f = e.items[s] === void 0 ? e.additionalItems : e.items[s];
                else var f = e.items;
                if (f === void 0) return !0;
                if (f === !1) return u.addError({
                    name: "items",
                    message: "additionalItems not permitted"
                }), !1;
                var d = a.validateSchema(o, f, t, i.makeChild(f, s));
                return d.instance !== u.instance[s] && (u.instance[s] = d.instance), u.importErrors(d), !0;
            }), u;
        }
    };
    v.contains = function(r, e, t, i) {
        var a = this;
        if (!!this.types.array(r) && e.contains !== void 0) {
            if (!A.isSchema(e.contains)) throw new Error('Expected "contains" keyword to be a schema');
            var u = new m(r, e, t, i), o = r.some(function(s, f) {
                var d = a.validateSchema(s, e.contains, t, i.makeChild(e.contains, f));
                return d.errors.length === 0;
            });
            return o === !1 && u.addError({
                name: "contains",
                argument: e.contains,
                message: "must contain an item matching given schema"
            }), u;
        }
    };
    v.minimum = function(r, e, t, i) {
        if (!!this.types.number(r)) {
            var a = new m(r, e, t, i);
            return e.exclusiveMinimum && e.exclusiveMinimum === !0 ? r > e.minimum || a.addError({
                name: "minimum",
                argument: e.minimum,
                message: "must be greater than " + e.minimum
            }) : r >= e.minimum || a.addError({
                name: "minimum",
                argument: e.minimum,
                message: "must be greater than or equal to " + e.minimum
            }), a;
        }
    };
    v.maximum = function(r, e, t, i) {
        if (!!this.types.number(r)) {
            var a = new m(r, e, t, i);
            return e.exclusiveMaximum && e.exclusiveMaximum === !0 ? r < e.maximum || a.addError({
                name: "maximum",
                argument: e.maximum,
                message: "must be less than " + e.maximum
            }) : r <= e.maximum || a.addError({
                name: "maximum",
                argument: e.maximum,
                message: "must be less than or equal to " + e.maximum
            }), a;
        }
    };
    v.exclusiveMinimum = function(r, e, t, i) {
        if (typeof e.exclusiveMinimum != "boolean" && !!this.types.number(r)) {
            var a = new m(r, e, t, i), u = r > e.exclusiveMinimum;
            return u || a.addError({
                name: "exclusiveMinimum",
                argument: e.exclusiveMinimum,
                message: "must be strictly greater than " + e.exclusiveMinimum
            }), a;
        }
    };
    v.exclusiveMaximum = function(r, e, t, i) {
        if (typeof e.exclusiveMaximum != "boolean" && !!this.types.number(r)) {
            var a = new m(r, e, t, i), u = r < e.exclusiveMaximum;
            return u || a.addError({
                name: "exclusiveMaximum",
                argument: e.exclusiveMaximum,
                message: "must be strictly less than " + e.exclusiveMaximum
            }), a;
        }
    };
    var J = function(r, e, t, i, a, u) {
        if (!!this.types.number(r)) {
            var o = e[a];
            if (o == 0) throw new E(a + " cannot be zero");
            var s = new m(r, e, t, i), f = A.getDecimalPlaces(r), d = A.getDecimalPlaces(o), h = Math.max(f, d), l = Math.pow(10, h);
            return Math.round(r * l) % Math.round(o * l) !== 0 && s.addError({
                name: a,
                argument: o,
                message: u + JSON.stringify(o)
            }), s;
        }
    };
    v.multipleOf = function(r, e, t, i) {
        return J.call(this, r, e, t, i, "multipleOf", "is not a multiple of (divisible by) ");
    };
    v.divisibleBy = function(r, e, t, i) {
        return J.call(this, r, e, t, i, "divisibleBy", "is not divisible by (multiple of) ");
    };
    v.required = function(r, e, t, i) {
        var a = new m(r, e, t, i);
        return r === void 0 && e.required === !0 ? a.addError({
            name: "required",
            message: "is required"
        }) : this.types.object(r) && Array.isArray(e.required) && e.required.forEach(function(u) {
            I(r, u) === void 0 && a.addError({
                name: "required",
                argument: u,
                message: "requires property " + JSON.stringify(u)
            });
        }), a;
    };
    v.pattern = function(r, e, t, i) {
        if (!!this.types.string(r)) {
            var a = new m(r, e, t, i), u = e.pattern;
            try {
                var o = new RegExp(u, "u");
            } catch  {
                o = new RegExp(u);
            }
            return r.match(o) || a.addError({
                name: "pattern",
                argument: e.pattern,
                message: "does not match pattern " + JSON.stringify(e.pattern.toString())
            }), a;
        }
    };
    v.format = function(r, e, t, i) {
        if (r !== void 0) {
            var a = new m(r, e, t, i);
            return !a.disableFormat && !A.isFormat(r, e.format, this) && a.addError({
                name: "format",
                argument: e.format,
                message: "does not conform to the " + JSON.stringify(e.format) + " format"
            }), a;
        }
    };
    v.minLength = function(r, e, t, i) {
        if (!!this.types.string(r)) {
            var a = new m(r, e, t, i), u = r.match(/[\uDC00-\uDFFF]/g), o = r.length - (u ? u.length : 0);
            return o >= e.minLength || a.addError({
                name: "minLength",
                argument: e.minLength,
                message: "does not meet minimum length of " + e.minLength
            }), a;
        }
    };
    v.maxLength = function(r, e, t, i) {
        if (!!this.types.string(r)) {
            var a = new m(r, e, t, i), u = r.match(/[\uDC00-\uDFFF]/g), o = r.length - (u ? u.length : 0);
            return o <= e.maxLength || a.addError({
                name: "maxLength",
                argument: e.maxLength,
                message: "does not meet maximum length of " + e.maxLength
            }), a;
        }
    };
    v.minItems = function(r, e, t, i) {
        if (!!this.types.array(r)) {
            var a = new m(r, e, t, i);
            return r.length >= e.minItems || a.addError({
                name: "minItems",
                argument: e.minItems,
                message: "does not meet minimum length of " + e.minItems
            }), a;
        }
    };
    v.maxItems = function(r, e, t, i) {
        if (!!this.types.array(r)) {
            var a = new m(r, e, t, i);
            return r.length <= e.maxItems || a.addError({
                name: "maxItems",
                argument: e.maxItems,
                message: "does not meet maximum length of " + e.maxItems
            }), a;
        }
    };
    function cr(n, r, e) {
        var t, i = e.length;
        for(t = r + 1, i; t < i; t++)if (A.deepCompareStrict(n, e[t])) return !1;
        return !0;
    }
    v.uniqueItems = function(r, e, t, i) {
        if (e.uniqueItems === !0 && !!this.types.array(r)) {
            var a = new m(r, e, t, i);
            return r.every(cr) || a.addError({
                name: "uniqueItems",
                message: "contains duplicate item"
            }), a;
        }
    };
    v.dependencies = function(r, e, t, i) {
        if (!!this.types.object(r)) {
            var a = new m(r, e, t, i);
            for(var u in e.dependencies)if (r[u] !== void 0) {
                var o = e.dependencies[u], s = i.makeChild(o, u);
                if (typeof o == "string" && (o = [
                    o
                ]), Array.isArray(o)) o.forEach(function(d) {
                    r[d] === void 0 && a.addError({
                        name: "dependencies",
                        argument: s.propertyPath,
                        message: "property " + d + " not found, required by " + s.propertyPath
                    });
                });
                else {
                    var f = this.validateSchema(r, o, t, s);
                    a.instance !== f.instance && (a.instance = f.instance), f && f.errors.length && (a.addError({
                        name: "dependencies",
                        argument: s.propertyPath,
                        message: "does not meet dependency required by " + s.propertyPath
                    }), a.importErrors(f));
                }
            }
            return a;
        }
    };
    v.enum = function(r, e, t, i) {
        if (r === void 0) return null;
        if (!Array.isArray(e.enum)) throw new E("enum expects an array", e);
        var a = new m(r, e, t, i);
        return e.enum.some(A.deepCompareStrict.bind(null, r)) || a.addError({
            name: "enum",
            argument: e.enum,
            message: "is not one of enum values: " + e.enum.map(String).join(",")
        }), a;
    };
    v.const = function(r, e, t, i) {
        if (r === void 0) return null;
        var a = new m(r, e, t, i);
        return A.deepCompareStrict(e.const, r) || a.addError({
            name: "const",
            argument: e.const,
            message: "does not exactly match expected constant: " + e.const
        }), a;
    };
    v.not = v.disallow = function(r, e, t, i) {
        var a = this;
        if (r === void 0) return null;
        var u = new m(r, e, t, i), o = e.not || e.disallow;
        return o ? (Array.isArray(o) || (o = [
            o
        ]), o.forEach(function(s) {
            if (a.testType(r, e, t, i, s)) {
                var f = s && (s.$id || s.id), d = f || s;
                u.addError({
                    name: "not",
                    argument: d,
                    message: "is of prohibited type " + d
                });
            }
        }), u) : null;
    };
    B.exports = j;
});
var x = S(($r, C)=>{
    "use strict";
    var G = __default4, wr = w();
    C.exports.SchemaScanResult = H;
    function H(n, r) {
        this.id = n, this.ref = r;
    }
    C.exports.scan = function(r, e) {
        function t(s, f) {
            if (!(!f || typeof f != "object")) {
                if (f.$ref) {
                    var d = G.resolve(s, f.$ref);
                    o[d] = o[d] ? o[d] + 1 : 0;
                    return;
                }
                var h = f.$id || f.id, l = h ? G.resolve(s, h) : s;
                if (l) {
                    if (l.indexOf("#") < 0 && (l += "#"), u[l]) {
                        if (!wr.deepCompareStrict(u[l], f)) throw new Error("Schema <" + l + "> already exists with different definition");
                        return u[l];
                    }
                    u[l] = f, l[l.length - 1] == "#" && (u[l.substring(0, l.length - 1)] = f);
                }
                i(l + "/items", Array.isArray(f.items) ? f.items : [
                    f.items
                ]), i(l + "/extends", Array.isArray(f.extends) ? f.extends : [
                    f.extends
                ]), t(l + "/additionalItems", f.additionalItems), a(l + "/properties", f.properties), t(l + "/additionalProperties", f.additionalProperties), a(l + "/definitions", f.definitions), a(l + "/patternProperties", f.patternProperties), a(l + "/dependencies", f.dependencies), i(l + "/disallow", f.disallow), i(l + "/allOf", f.allOf), i(l + "/anyOf", f.anyOf), i(l + "/oneOf", f.oneOf), t(l + "/not", f.not);
            }
        }
        function i(s, f) {
            if (!!Array.isArray(f)) for(var d = 0; d < f.length; d++)t(s + "/" + d, f[d]);
        }
        function a(s, f) {
            if (!(!f || typeof f != "object")) for(var d in f)t(s + "/" + d, f[d]);
        }
        var u = {}, o = {};
        return t(r, e), new H(u, o);
    };
});
var ir = S((xr, tr)=>{
    "use strict";
    var W = __default4, X = U(), z = w(), Y = x().scan, Q = z.ValidatorResult, Er = z.ValidatorResultError, Z = z.SchemaError, K = z.SchemaContext, rr = "/", p = function n() {
        this.customFormats = Object.create(n.prototype.customFormats), this.schemas = {}, this.unresolvedRefs = [], this.types = Object.create(g), this.attributes = Object.create(X.validators);
    };
    p.prototype.customFormats = {};
    p.prototype.schemas = null;
    p.prototype.types = null;
    p.prototype.attributes = null;
    p.prototype.unresolvedRefs = null;
    p.prototype.addSchema = function(r, e) {
        var t = this;
        if (!r) return null;
        var i = Y(e || rr, r), a = e || r.$id || r.id;
        for(var u in i.id)this.schemas[u] = i.id[u];
        for(var u in i.ref)this.unresolvedRefs.push(u);
        return this.unresolvedRefs = this.unresolvedRefs.filter(function(o) {
            return typeof t.schemas[o] > "u";
        }), this.schemas[a];
    };
    p.prototype.addSubSchemaArray = function(r, e) {
        if (!!Array.isArray(e)) for(var t = 0; t < e.length; t++)this.addSubSchema(r, e[t]);
    };
    p.prototype.addSubSchemaObject = function(r, e) {
        if (!(!e || typeof e != "object")) for(var t in e)this.addSubSchema(r, e[t]);
    };
    p.prototype.setSchemas = function(r) {
        this.schemas = r;
    };
    p.prototype.getSchema = function(r) {
        return this.schemas[r];
    };
    p.prototype.validate = function(r, e, t, i) {
        if (typeof e != "boolean" && typeof e != "object" || e === null) throw new Z("Expected `schema` to be an object or boolean");
        t || (t = {});
        var a = e.$id || e.id, u = W.resolve(t.base || rr, a || "");
        if (!i) {
            i = new K(e, t, [], u, Object.create(this.schemas)), i.schemas[u] || (i.schemas[u] = e);
            var o = Y(u, e);
            for(var s in o.id){
                var f = o.id[s];
                i.schemas[s] = f;
            }
        }
        if (t.required && r === void 0) {
            var d = new Q(r, e, t, i);
            return d.addError("is required, but is undefined"), d;
        }
        var d = this.validateSchema(r, e, t, i);
        if (d) {
            if (t.throwAll && d.errors.length) throw new Er(d);
        } else throw new Error("Result undefined");
        return d;
    };
    function er(n) {
        var r = typeof n == "string" ? n : n.$ref;
        return typeof r == "string" ? r : !1;
    }
    p.prototype.validateSchema = function(r, e, t, i) {
        var a = new Q(r, e, t, i);
        if (typeof e == "boolean") e === !0 ? e = {} : e === !1 && (e = {
            type: []
        });
        else if (!e) throw new Error("schema is undefined");
        if (e.extends) if (Array.isArray(e.extends)) {
            var u = {
                schema: e,
                ctx: i
            };
            e.extends.forEach(this.schemaTraverser.bind(this, u)), e = u.schema, u.schema = null, u.ctx = null, u = null;
        } else e = z.deepMerge(e, this.superResolve(e.extends, i));
        var o = er(e);
        if (o) {
            var s = this.resolve(e, o, i), f = new K(s.subschema, t, i.path, s.switchSchema, i.schemas);
            return this.validateSchema(r, s.subschema, t, f);
        }
        var d = t && t.skipAttributes || [];
        for(var h in e)if (!X.ignoreProperties[h] && d.indexOf(h) < 0) {
            var l = null, O = this.attributes[h];
            if (O) l = O.call(this, r, e, t, i);
            else if (t.allowUnknownAttributes === !1) throw new Z("Unsupported attribute: " + h, e);
            l && a.importErrors(l);
        }
        if (typeof t.rewrite == "function") {
            var or = t.rewrite.call(this, r, e, t, i);
            a.instance = or;
        }
        return a;
    };
    p.prototype.schemaTraverser = function(r, e) {
        r.schema = z.deepMerge(r.schema, this.superResolve(e, r.ctx));
    };
    p.prototype.superResolve = function(r, e) {
        var t = er(r);
        return t ? this.resolve(r, t, e).subschema : r;
    };
    p.prototype.resolve = function(r, e, t) {
        if (e = t.resolve(e), t.schemas[e]) return {
            subschema: t.schemas[e],
            switchSchema: e
        };
        var i = W.parse(e), a = i && i.hash, u = a && a.length && e.substr(0, e.length - a.length);
        if (!u || !t.schemas[u]) throw new Z("no such schema <" + e + ">", r);
        var o = z.objectGetPath(t.schemas[u], a.substr(1));
        if (o === void 0) throw new Z("no such schema " + a + " located in <" + u + ">", r);
        return {
            subschema: o,
            switchSchema: e
        };
    };
    p.prototype.testType = function(r, e, t, i, a) {
        if (a !== void 0) {
            if (a === null) throw new Z('Unexpected null in "type" keyword');
            if (typeof this.types[a] == "function") return this.types[a].call(this, r);
            if (a && typeof a == "object") {
                var u = this.validateSchema(r, a, t, i);
                return u === void 0 || !(u && u.errors.length);
            }
            return !0;
        }
    };
    var g = p.prototype.types = {};
    g.string = function(r) {
        return typeof r == "string";
    };
    g.number = function(r) {
        return typeof r == "number" && isFinite(r);
    };
    g.integer = function(r) {
        return typeof r == "number" && r % 1 === 0;
    };
    g.boolean = function(r) {
        return typeof r == "boolean";
    };
    g.array = function(r) {
        return Array.isArray(r);
    };
    g.null = function(r) {
        return r === null;
    };
    g.date = function(r) {
        return r instanceof Date;
    };
    g.any = function(r) {
        return !0;
    };
    g.object = function(r) {
        return r && typeof r == "object" && !Array.isArray(r) && !(r instanceof Date);
    };
    tr.exports = p;
});
var ar = S((Or, c)=>{
    "use strict";
    var br = c.exports.Validator = ir();
    c.exports.ValidatorResult = w().ValidatorResult;
    c.exports.ValidatorResultError = w().ValidatorResultError;
    c.exports.ValidationError = w().ValidationError;
    c.exports.SchemaError = w().SchemaError;
    c.exports.SchemaScanResult = x().SchemaScanResult;
    c.exports.scan = x().scan;
    c.exports.validate = function(n, r, e) {
        var t = new br;
        return t.validate(n, r, e);
    };
});
var ur = pr(ar()), { ValidatorResult: Pr , ValidatorResultError: _r , ValidationError: Mr , SchemaError: Rr , SchemaScanResult: Vr , scan: jr , validate: qr  } = ur, { default: nr , ...zr } = ur, Ir = nr !== void 0 ? nr : zr;
!function(e) {
    "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define([], e) : ("undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this).jsyaml = e();
}(function() {
    return (function o(a, s, c) {
        function u(t, e) {
            if (!s[t]) {
                if (!a[t]) {
                    var n = "function" == typeof require && require;
                    if (!e && n) return n(t, !0);
                    if (l) return l(t, !0);
                    var i = new Error("Cannot find module '" + t + "'");
                    throw i.code = "MODULE_NOT_FOUND", i;
                }
                var r = s[t] = {
                    exports: {}
                };
                a[t][0].call(r.exports, function(e) {
                    return u(a[t][1][e] || e);
                }, r, r.exports, o, a, s, c);
            }
            return s[t].exports;
        }
        for(var l = "function" == typeof require && require, e = 0; e < c.length; e++)u(c[e]);
        return u;
    })({
        1: [
            function(e, t, n) {
                "use strict";
                var i = e("./js-yaml/loader"), r = e("./js-yaml/dumper");
                function o(e) {
                    return function() {
                        throw new Error("Function " + e + " is deprecated and cannot be used.");
                    };
                }
                t.exports.Type = e("./js-yaml/type"), t.exports.Schema = e("./js-yaml/schema"), t.exports.FAILSAFE_SCHEMA = e("./js-yaml/schema/failsafe"), t.exports.JSON_SCHEMA = e("./js-yaml/schema/json"), t.exports.CORE_SCHEMA = e("./js-yaml/schema/core"), t.exports.DEFAULT_SAFE_SCHEMA = e("./js-yaml/schema/default_safe"), t.exports.DEFAULT_FULL_SCHEMA = e("./js-yaml/schema/default_full"), t.exports.load = i.load, t.exports.loadAll = i.loadAll, t.exports.safeLoad = i.safeLoad, t.exports.safeLoadAll = i.safeLoadAll, t.exports.dump = r.dump, t.exports.safeDump = r.safeDump, t.exports.YAMLException = e("./js-yaml/exception"), t.exports.MINIMAL_SCHEMA = e("./js-yaml/schema/failsafe"), t.exports.SAFE_SCHEMA = e("./js-yaml/schema/default_safe"), t.exports.DEFAULT_SCHEMA = e("./js-yaml/schema/default_full"), t.exports.scan = o("scan"), t.exports.parse = o("parse"), t.exports.compose = o("compose"), t.exports.addConstructor = o("addConstructor");
            },
            {
                "./js-yaml/dumper": 3,
                "./js-yaml/exception": 4,
                "./js-yaml/loader": 5,
                "./js-yaml/schema": 7,
                "./js-yaml/schema/core": 8,
                "./js-yaml/schema/default_full": 9,
                "./js-yaml/schema/default_safe": 10,
                "./js-yaml/schema/failsafe": 11,
                "./js-yaml/schema/json": 12,
                "./js-yaml/type": 13
            }
        ],
        2: [
            function(e, t, n) {
                "use strict";
                function i(e) {
                    return null == e;
                }
                t.exports.isNothing = i, t.exports.isObject = function(e) {
                    return "object" == typeof e && null !== e;
                }, t.exports.toArray = function(e) {
                    return Array.isArray(e) ? e : i(e) ? [] : [
                        e
                    ];
                }, t.exports.repeat = function(e, t) {
                    for(var n = "", i = 0; i < t; i += 1)n += e;
                    return n;
                }, t.exports.isNegativeZero = function(e) {
                    return 0 === e && Number.NEGATIVE_INFINITY === 1 / e;
                }, t.exports.extend = function(e, t) {
                    var n, i, r, o;
                    if (t) for(n = 0, i = (o = Object.keys(t)).length; n < i; n += 1)e[r = o[n]] = t[r];
                    return e;
                };
            },
            {}
        ],
        3: [
            function(e, t, n) {
                "use strict";
                var c = e("./common"), d = e("./exception"), i = e("./schema/default_full"), r = e("./schema/default_safe"), p = Object.prototype.toString, u = Object.prototype.hasOwnProperty, o = 9, h = 10, a = 13, s = 32, m = 33, g = 34, y = 35, x = 37, v = 38, A = 39, b = 42, w = 44, C = 45, k = 58, j = 61, S = 62, I = 63, O = 64, E = 91, F = 93, _ = 96, N = 123, M = 124, T = 125, l = {
                    0: "\\0",
                    7: "\\a",
                    8: "\\b",
                    9: "\\t",
                    10: "\\n",
                    11: "\\v",
                    12: "\\f",
                    13: "\\r",
                    27: "\\e",
                    34: '\\"',
                    92: "\\\\",
                    133: "\\N",
                    160: "\\_",
                    8232: "\\L",
                    8233: "\\P"
                }, f = [
                    "y",
                    "Y",
                    "yes",
                    "Yes",
                    "YES",
                    "on",
                    "On",
                    "ON",
                    "n",
                    "N",
                    "no",
                    "No",
                    "NO",
                    "off",
                    "Off",
                    "OFF"
                ];
                function L(e) {
                    var t, n, i = e.toString(16).toUpperCase();
                    if (e <= 255) t = "x", n = 2;
                    else if (e <= 65535) t = "u", n = 4;
                    else {
                        if (!(e <= 4294967295)) throw new d("code point within a string may not be greater than 0xFFFFFFFF");
                        t = "U", n = 8;
                    }
                    return "\\" + t + c.repeat("0", n - i.length) + i;
                }
                function D(e) {
                    this.schema = e.schema || i, this.indent = Math.max(1, e.indent || 2), this.noArrayIndent = e.noArrayIndent || !1, this.skipInvalid = e.skipInvalid || !1, this.flowLevel = c.isNothing(e.flowLevel) ? -1 : e.flowLevel, this.styleMap = function(e, t) {
                        var n, i, r, o, a, s, c;
                        if (null === t) return {};
                        for(n = {}, r = 0, o = (i = Object.keys(t)).length; r < o; r += 1)a = i[r], s = String(t[a]), "!!" === a.slice(0, 2) && (a = "tag:yaml.org,2002:" + a.slice(2)), (c = e.compiledTypeMap.fallback[a]) && u.call(c.styleAliases, s) && (s = c.styleAliases[s]), n[a] = s;
                        return n;
                    }(this.schema, e.styles || null), this.sortKeys = e.sortKeys || !1, this.lineWidth = e.lineWidth || 80, this.noRefs = e.noRefs || !1, this.noCompatMode = e.noCompatMode || !1, this.condenseFlow = e.condenseFlow || !1, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
                }
                function U(e, t) {
                    for(var n, i = c.repeat(" ", t), r = 0, o = -1, a = "", s = e.length; r < s;)r = -1 === (o = e.indexOf("\n", r)) ? (n = e.slice(r), s) : (n = e.slice(r, o + 1), o + 1), n.length && "\n" !== n && (a += i), a += n;
                    return a;
                }
                function q(e, t) {
                    return "\n" + c.repeat(" ", e.indent * t);
                }
                function Y(e) {
                    return e === s || e === o;
                }
                function R(e) {
                    return 32 <= e && e <= 126 || 161 <= e && e <= 55295 && 8232 !== e && 8233 !== e || 57344 <= e && e <= 65533 && 65279 !== e || 65536 <= e && e <= 1114111;
                }
                function B(e, t) {
                    return R(e) && 65279 !== e && e !== w && e !== E && e !== F && e !== N && e !== T && e !== k && (e !== y || t && R(n = t) && !Y(n) && 65279 !== n && n !== a && n !== h);
                    var n;
                }
                function P(e) {
                    return /^\n* /.test(e);
                }
                var W = 1, K = 2, $ = 3, H = 4, G = 5;
                function V(e, t, n, i, r) {
                    var o, a, s, c, u = !1, l = !1, p = -1 !== i, f = -1, d = R(c = e.charCodeAt(0)) && 65279 !== c && !Y(c) && c !== C && c !== I && c !== k && c !== w && c !== E && c !== F && c !== N && c !== T && c !== y && c !== v && c !== b && c !== m && c !== M && c !== j && c !== S && c !== A && c !== g && c !== x && c !== O && c !== _ && !Y(e.charCodeAt(e.length - 1));
                    if (t) for(o = 0; o < e.length; o++){
                        if (!R(a = e.charCodeAt(o))) return G;
                        s = 0 < o ? e.charCodeAt(o - 1) : null, d = d && B(a, s);
                    }
                    else {
                        for(o = 0; o < e.length; o++){
                            if ((a = e.charCodeAt(o)) === h) u = !0, p && (l = l || i < o - f - 1 && " " !== e[f + 1], f = o);
                            else if (!R(a)) return G;
                            s = 0 < o ? e.charCodeAt(o - 1) : null, d = d && B(a, s);
                        }
                        l = l || p && i < o - f - 1 && " " !== e[f + 1];
                    }
                    return u || l ? 9 < n && P(e) ? G : l ? H : $ : d && !r(e) ? W : K;
                }
                function Z(i, r, o, a) {
                    i.dump = function() {
                        if (0 === r.length) return "''";
                        if (!i.noCompatMode && -1 !== f.indexOf(r)) return "'" + r + "'";
                        var e = i.indent * Math.max(1, o), t = -1 === i.lineWidth ? -1 : Math.max(Math.min(i.lineWidth, 40), i.lineWidth - e), n = a || -1 < i.flowLevel && o >= i.flowLevel;
                        switch(V(r, n, i.indent, t, function(e) {
                            return function(e, t) {
                                for(var n = 0, i = e.implicitTypes.length; n < i; n += 1)if (e.implicitTypes[n].resolve(t)) return !0;
                                return !1;
                            }(i, e);
                        })){
                            case W:
                                return r;
                            case K:
                                return "'" + r.replace(/'/g, "''") + "'";
                            case $:
                                return "|" + z(r, i.indent) + J(U(r, e));
                            case H:
                                return ">" + z(r, i.indent) + J(U(function(t, n) {
                                    var e, i, r = /(\n+)([^\n]*)/g, o = function() {
                                        var e = -1 !== (e = t.indexOf("\n")) ? e : t.length;
                                        return r.lastIndex = e, Q(t.slice(0, e), n);
                                    }(), a = "\n" === t[0] || " " === t[0];
                                    for(; i = r.exec(t);){
                                        var s = i[1], c = i[2];
                                        e = " " === c[0], o += s + (a || e || "" === c ? "" : "\n") + Q(c, n), a = e;
                                    }
                                    return o;
                                }(r, t), e));
                            case G:
                                return '"' + function(e) {
                                    for(var t, n, i, r = "", o = 0; o < e.length; o++)55296 <= (t = e.charCodeAt(o)) && t <= 56319 && 56320 <= (n = e.charCodeAt(o + 1)) && n <= 57343 ? (r += L(1024 * (t - 55296) + n - 56320 + 65536), o++) : (i = l[t], r += !i && R(t) ? e[o] : i || L(t));
                                    return r;
                                }(r) + '"';
                            default:
                                throw new d("impossible error: invalid scalar style");
                        }
                    }();
                }
                function z(e, t) {
                    var n = P(e) ? String(t) : "", i = "\n" === e[e.length - 1];
                    return n + (i && ("\n" === e[e.length - 2] || "\n" === e) ? "+" : i ? "" : "-") + "\n";
                }
                function J(e) {
                    return "\n" === e[e.length - 1] ? e.slice(0, -1) : e;
                }
                function Q(e, t) {
                    if ("" === e || " " === e[0]) return e;
                    for(var n, i, r = / [^ ]/g, o = 0, a = 0, s = 0, c = ""; n = r.exec(e);)t < (s = n.index) - o && (i = o < a ? a : s, c += "\n" + e.slice(o, i), o = i + 1), a = s;
                    return c += "\n", e.length - o > t && o < a ? c += e.slice(o, a) + "\n" + e.slice(a + 1) : c += e.slice(o), c.slice(1);
                }
                function X(e, t, n) {
                    for(var i, r, o, a = n ? e.explicitTypes : e.implicitTypes, s = 0, c = a.length; s < c; s += 1)if (((r = a[s]).instanceOf || r.predicate) && (!r.instanceOf || "object" == typeof t && t instanceof r.instanceOf) && (!r.predicate || r.predicate(t))) {
                        if (e.tag = n ? r.tag : "?", r.represent) {
                            if (o = e.styleMap[r.tag] || r.defaultStyle, "[object Function]" === p.call(r.represent)) i = r.represent(t, o);
                            else {
                                if (!u.call(r.represent, o)) throw new d("!<" + r.tag + '> tag resolver accepts not "' + o + '" style');
                                i = r.represent[o](t, o);
                            }
                            e.dump = i;
                        }
                        return 1;
                    }
                }
                function ee(e, t, n, i, r, o) {
                    e.tag = null, e.dump = n, X(e, n, !1) || X(e, n, !0);
                    var a = p.call(e.dump);
                    i = i && (e.flowLevel < 0 || e.flowLevel > t);
                    var s, c, u = "[object Object]" === a || "[object Array]" === a;
                    if (u && (c = -1 !== (s = e.duplicates.indexOf(n))), (null !== e.tag && "?" !== e.tag || c || 2 !== e.indent && 0 < t) && (r = !1), c && e.usedDuplicates[s]) e.dump = "*ref_" + s;
                    else {
                        if (u && c && !e.usedDuplicates[s] && (e.usedDuplicates[s] = !0), "[object Object]" === a) i && 0 !== Object.keys(e.dump).length ? (function(e, t, n, i) {
                            var r, o, a, s, c, u, l = "", p = e.tag, f = Object.keys(n);
                            if (!0 === e.sortKeys) f.sort();
                            else if ("function" == typeof e.sortKeys) f.sort(e.sortKeys);
                            else if (e.sortKeys) throw new d("sortKeys must be a boolean or a function");
                            for(r = 0, o = f.length; r < o; r += 1)u = "", i && 0 === r || (u += q(e, t)), s = n[a = f[r]], ee(e, t + 1, a, !0, !0, !0) && ((c = null !== e.tag && "?" !== e.tag || e.dump && 1024 < e.dump.length) && (e.dump && h === e.dump.charCodeAt(0) ? u += "?" : u += "? "), u += e.dump, c && (u += q(e, t)), ee(e, t + 1, s, !0, c) && (e.dump && h === e.dump.charCodeAt(0) ? u += ":" : u += ": ", l += u += e.dump));
                            e.tag = p, e.dump = l || "{}";
                        }(e, t, e.dump, r), c && (e.dump = "&ref_" + s + e.dump)) : (function(e, t, n) {
                            for(var i, r, o, a = "", s = e.tag, c = Object.keys(n), u = 0, l = c.length; u < l; u += 1)o = "", 0 !== u && (o += ", "), e.condenseFlow && (o += '"'), r = n[i = c[u]], ee(e, t, i, !1, !1) && (1024 < e.dump.length && (o += "? "), o += e.dump + (e.condenseFlow ? '"' : "") + ":" + (e.condenseFlow ? "" : " "), ee(e, t, r, !1, !1) && (a += o += e.dump));
                            e.tag = s, e.dump = "{" + a + "}";
                        }(e, t, e.dump), c && (e.dump = "&ref_" + s + " " + e.dump));
                        else if ("[object Array]" === a) {
                            var l = e.noArrayIndent && 0 < t ? t - 1 : t;
                            i && 0 !== e.dump.length ? (function(e, t, n, i) {
                                for(var r = "", o = e.tag, a = 0, s = n.length; a < s; a += 1)ee(e, t + 1, n[a], !0, !0) && (i && 0 === a || (r += q(e, t)), e.dump && h === e.dump.charCodeAt(0) ? r += "-" : r += "- ", r += e.dump);
                                e.tag = o, e.dump = r || "[]";
                            }(e, l, e.dump, r), c && (e.dump = "&ref_" + s + e.dump)) : (function(e, t, n) {
                                for(var i = "", r = e.tag, o = 0, a = n.length; o < a; o += 1)ee(e, t, n[o], !1, !1) && (0 !== o && (i += "," + (e.condenseFlow ? "" : " ")), i += e.dump);
                                e.tag = r, e.dump = "[" + i + "]";
                            }(e, l, e.dump), c && (e.dump = "&ref_" + s + " " + e.dump));
                        } else {
                            if ("[object String]" !== a) {
                                if (e.skipInvalid) return;
                                throw new d("unacceptable kind of an object to dump " + a);
                            }
                            "?" !== e.tag && Z(e, e.dump, t, o);
                        }
                        null !== e.tag && "?" !== e.tag && (e.dump = "!<" + e.tag + "> " + e.dump);
                    }
                    return 1;
                }
                function te(e, t) {
                    var n, i, r = [], o = [];
                    for(!function e(t, n, i) {
                        var r, o, a;
                        if (null !== t && "object" == typeof t) if (-1 !== (o = n.indexOf(t))) -1 === i.indexOf(o) && i.push(o);
                        else if (n.push(t), Array.isArray(t)) for(o = 0, a = t.length; o < a; o += 1)e(t[o], n, i);
                        else for(r = Object.keys(t), o = 0, a = r.length; o < a; o += 1)e(t[r[o]], n, i);
                    }(e, r, o), n = 0, i = o.length; n < i; n += 1)t.duplicates.push(r[o[n]]);
                    t.usedDuplicates = new Array(i);
                }
                function ne(e, t) {
                    var n = new D(t = t || {});
                    return n.noRefs || te(e, n), ee(n, 0, e, !0, !0) ? n.dump + "\n" : "";
                }
                t.exports.dump = ne, t.exports.safeDump = function(e, t) {
                    return ne(e, c.extend({
                        schema: r
                    }, t));
                };
            },
            {
                "./common": 2,
                "./exception": 4,
                "./schema/default_full": 9,
                "./schema/default_safe": 10
            }
        ],
        4: [
            function(e, t, n) {
                "use strict";
                function i(e, t) {
                    Error.call(this), this.name = "YAMLException", this.reason = e, this.mark = t, this.message = (this.reason || "(unknown reason)") + (this.mark ? " " + this.mark.toString() : ""), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = (new Error).stack || "";
                }
                ((i.prototype = Object.create(Error.prototype)).constructor = i).prototype.toString = function(e) {
                    var t = this.name + ": ";
                    return t += this.reason || "(unknown reason)", !e && this.mark && (t += " " + this.mark.toString()), t;
                }, t.exports = i;
            },
            {}
        ],
        5: [
            function(e, t, n) {
                "use strict";
                var g = e("./common"), i = e("./exception"), r = e("./mark"), o = e("./schema/default_safe"), a = e("./schema/default_full"), y = Object.prototype.hasOwnProperty, x = 1, v = 2, A = 3, b = 4, w = 1, C = 2, k = 3, c = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, s = /[\x85\u2028\u2029]/, j = /[,\[\]\{\}]/, S = /^(?:!|!!|![a-z\-]+!)$/i, I = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
                function l(e) {
                    return Object.prototype.toString.call(e);
                }
                function O(e) {
                    return 10 === e || 13 === e;
                }
                function E(e) {
                    return 9 === e || 32 === e;
                }
                function F(e) {
                    return 9 === e || 32 === e || 10 === e || 13 === e;
                }
                function _(e) {
                    return 44 === e || 91 === e || 93 === e || 123 === e || 125 === e;
                }
                function u(e) {
                    return 48 === e ? "\0" : 97 === e ? "" : 98 === e ? "\b" : 116 === e || 9 === e ? "\t" : 110 === e ? "\n" : 118 === e ? "\v" : 102 === e ? "\f" : 114 === e ? "\r" : 101 === e ? "" : 32 === e ? " " : 34 === e ? '"' : 47 === e ? "/" : 92 === e ? "\\" : 78 === e ? "" : 95 === e ? " " : 76 === e ? "\u2028" : 80 === e ? "\u2029" : "";
                }
                for(var f = new Array(256), d = new Array(256), p = 0; p < 256; p++)f[p] = u(p) ? 1 : 0, d[p] = u(p);
                function h(e, t) {
                    this.input = e, this.filename = t.filename || null, this.schema = t.schema || a, this.onWarning = t.onWarning || null, this.legacy = t.legacy || !1, this.json = t.json || !1, this.listener = t.listener || null, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = e.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.documents = [];
                }
                function m(e, t) {
                    return new i(t, new r(e.filename, e.input, e.position, e.line, e.position - e.lineStart));
                }
                function N(e, t) {
                    throw m(e, t);
                }
                function M(e, t) {
                    e.onWarning && e.onWarning.call(null, m(e, t));
                }
                var T = {
                    YAML: function(e, t, n) {
                        var i, r, o;
                        null !== e.version && N(e, "duplication of %YAML directive"), 1 !== n.length && N(e, "YAML directive accepts exactly one argument"), null === (i = /^([0-9]+)\.([0-9]+)$/.exec(n[0])) && N(e, "ill-formed argument of the YAML directive"), r = parseInt(i[1], 10), o = parseInt(i[2], 10), 1 !== r && N(e, "unacceptable YAML version of the document"), e.version = n[0], e.checkLineBreaks = o < 2, 1 !== o && 2 !== o && M(e, "unsupported YAML version of the document");
                    },
                    TAG: function(e, t, n) {
                        var i, r;
                        2 !== n.length && N(e, "TAG directive accepts exactly two arguments"), i = n[0], r = n[1], S.test(i) || N(e, "ill-formed tag handle (first argument) of the TAG directive"), y.call(e.tagMap, i) && N(e, 'there is a previously declared suffix for "' + i + '" tag handle'), I.test(r) || N(e, "ill-formed tag prefix (second argument) of the TAG directive"), e.tagMap[i] = r;
                    }
                };
                function L(e, t, n, i) {
                    var r, o, a, s;
                    if (t < n) {
                        if (s = e.input.slice(t, n), i) for(r = 0, o = s.length; r < o; r += 1)9 === (a = s.charCodeAt(r)) || 32 <= a && a <= 1114111 || N(e, "expected valid JSON character");
                        else c.test(s) && N(e, "the stream contains non-printable characters");
                        e.result += s;
                    }
                }
                function D(e, t, n, i) {
                    var r, o, a, s;
                    for(g.isObject(n) || N(e, "cannot merge mappings; the provided source object is unacceptable"), a = 0, s = (r = Object.keys(n)).length; a < s; a += 1)o = r[a], y.call(t, o) || (t[o] = n[o], i[o] = !0);
                }
                function U(e, t, n, i, r, o, a, s) {
                    var c, u;
                    if (Array.isArray(r)) for(c = 0, u = (r = Array.prototype.slice.call(r)).length; c < u; c += 1)Array.isArray(r[c]) && N(e, "nested arrays are not supported inside keys"), "object" == typeof r && "[object Object]" === l(r[c]) && (r[c] = "[object Object]");
                    if ("object" == typeof r && "[object Object]" === l(r) && (r = "[object Object]"), r = String(r), null === t && (t = {}), "tag:yaml.org,2002:merge" === i) if (Array.isArray(o)) for(c = 0, u = o.length; c < u; c += 1)D(e, t, o[c], n);
                    else D(e, t, o, n);
                    else e.json || y.call(n, r) || !y.call(t, r) || (e.line = a || e.line, e.position = s || e.position, N(e, "duplicated mapping key")), t[r] = o, delete n[r];
                    return t;
                }
                function q(e) {
                    var t = e.input.charCodeAt(e.position);
                    10 === t ? e.position++ : 13 === t ? (e.position++, 10 === e.input.charCodeAt(e.position) && e.position++) : N(e, "a line break is expected"), e.line += 1, e.lineStart = e.position;
                }
                function Y(e, t, n) {
                    for(var i = 0, r = e.input.charCodeAt(e.position); 0 !== r;){
                        for(; E(r);)r = e.input.charCodeAt(++e.position);
                        if (t && 35 === r) for(; 10 !== (r = e.input.charCodeAt(++e.position)) && 13 !== r && 0 !== r;);
                        if (!O(r)) break;
                        for(q(e), r = e.input.charCodeAt(e.position), i++, e.lineIndent = 0; 32 === r;)e.lineIndent++, r = e.input.charCodeAt(++e.position);
                    }
                    return -1 !== n && 0 !== i && e.lineIndent < n && M(e, "deficient indentation"), i;
                }
                function R(e) {
                    var t = e.position, n = e.input.charCodeAt(t);
                    return 45 !== n && 46 !== n || n !== e.input.charCodeAt(t + 1) || n !== e.input.charCodeAt(t + 2) || (t += 3, 0 !== (n = e.input.charCodeAt(t)) && !F(n)) ? void 0 : 1;
                }
                function B(e, t) {
                    1 === t ? e.result += " " : 1 < t && (e.result += g.repeat("\n", t - 1));
                }
                function P(e, t) {
                    var n, i, r, o, a, s, c, u, l, p = e.input.charCodeAt(e.position);
                    if (34 === p) {
                        for(e.kind = "scalar", e.result = "", e.position++, n = i = e.position; 0 !== (p = e.input.charCodeAt(e.position));){
                            if (34 === p) return L(e, n, e.position, !0), e.position++, 1;
                            if (92 === p) {
                                if (L(e, n, e.position, !0), O(p = e.input.charCodeAt(++e.position))) Y(e, !1, t);
                                else if (p < 256 && f[p]) e.result += d[p], e.position++;
                                else if (0 < (a = 120 === (l = p) ? 2 : 117 === l ? 4 : 85 === l ? 8 : 0)) {
                                    for(r = a, o = 0; 0 < r; r--)p = e.input.charCodeAt(++e.position), u = void 0, 0 <= (a = 48 <= (c = p) && c <= 57 ? c - 48 : 97 <= (u = 32 | c) && u <= 102 ? u - 97 + 10 : -1) ? o = (o << 4) + a : N(e, "expected hexadecimal character");
                                    e.result += (s = o) <= 65535 ? String.fromCharCode(s) : String.fromCharCode(55296 + (s - 65536 >> 10), 56320 + (s - 65536 & 1023)), e.position++;
                                } else N(e, "unknown escape sequence");
                                n = i = e.position;
                            } else O(p) ? (L(e, n, i, !0), B(e, Y(e, !1, t)), n = i = e.position) : e.position === e.lineStart && R(e) ? N(e, "unexpected end of the document within a double quoted scalar") : (e.position++, i = e.position);
                        }
                        N(e, "unexpected end of the stream within a double quoted scalar");
                    }
                }
                function W(e, t) {
                    var n, i, r = e.tag, o = e.anchor, a = [], s = !1;
                    for(null !== e.anchor && (e.anchorMap[e.anchor] = a), i = e.input.charCodeAt(e.position); 0 !== i && 45 === i && F(e.input.charCodeAt(e.position + 1));)if (s = !0, e.position++, Y(e, !0, -1) && e.lineIndent <= t) a.push(null), i = e.input.charCodeAt(e.position);
                    else if (n = e.line, K(e, t, A, !1, !0), a.push(e.result), Y(e, !0, -1), i = e.input.charCodeAt(e.position), (e.line === n || e.lineIndent > t) && 0 !== i) N(e, "bad indentation of a sequence entry");
                    else if (e.lineIndent < t) break;
                    return !!s && (e.tag = r, e.anchor = o, e.kind = "sequence", e.result = a, !0);
                }
                function K(e, t, n, i, r) {
                    var o, a, s, c, u, l, p, f, d = 1, h = !1, m = !1;
                    if (null !== e.listener && e.listener("open", e), e.tag = null, e.anchor = null, e.kind = null, e.result = null, o = a = s = b === n || A === n, i && Y(e, !0, -1) && (h = !0, e.lineIndent > t ? d = 1 : e.lineIndent === t ? d = 0 : e.lineIndent < t && (d = -1)), 1 === d) for(; function(e) {
                        var t, n, i, r = !1, o = !1, a = e.input.charCodeAt(e.position);
                        if (33 === a) {
                            if (null !== e.tag && N(e, "duplication of a tag property"), 60 === (a = e.input.charCodeAt(++e.position)) ? (r = !0, a = e.input.charCodeAt(++e.position)) : 33 === a ? (o = !0, n = "!!", a = e.input.charCodeAt(++e.position)) : n = "!", t = e.position, r) {
                                for(; 0 !== (a = e.input.charCodeAt(++e.position)) && 62 !== a;);
                                e.position < e.length ? (i = e.input.slice(t, e.position), a = e.input.charCodeAt(++e.position)) : N(e, "unexpected end of the stream within a verbatim tag");
                            } else {
                                for(; 0 !== a && !F(a);)33 === a && (o ? N(e, "tag suffix cannot contain exclamation marks") : (n = e.input.slice(t - 1, e.position + 1), S.test(n) || N(e, "named tag handle cannot contain such characters"), o = !0, t = e.position + 1)), a = e.input.charCodeAt(++e.position);
                                i = e.input.slice(t, e.position), j.test(i) && N(e, "tag suffix cannot contain flow indicator characters");
                            }
                            return i && !I.test(i) && N(e, "tag name cannot contain such characters: " + i), r ? e.tag = i : y.call(e.tagMap, n) ? e.tag = e.tagMap[n] + i : "!" === n ? e.tag = "!" + i : "!!" === n ? e.tag = "tag:yaml.org,2002:" + i : N(e, 'undeclared tag handle "' + n + '"'), 1;
                        }
                    }(e) || function(e) {
                        var t, n = e.input.charCodeAt(e.position);
                        if (38 === n) {
                            for(null !== e.anchor && N(e, "duplication of an anchor property"), n = e.input.charCodeAt(++e.position), t = e.position; 0 !== n && !F(n) && !_(n);)n = e.input.charCodeAt(++e.position);
                            return e.position === t && N(e, "name of an anchor node must contain at least one character"), e.anchor = e.input.slice(t, e.position), 1;
                        }
                    }(e);)Y(e, !0, -1) ? (h = !0, s = o, e.lineIndent > t ? d = 1 : e.lineIndent === t ? d = 0 : e.lineIndent < t && (d = -1)) : s = !1;
                    if (s = s && (h || r), 1 !== d && b !== n || (p = x === n || v === n ? t : t + 1, f = e.position - e.lineStart, 1 === d ? s && (W(e, f) || function(e, t, n) {
                        var i, r, o, a, s, c = e.tag, u = e.anchor, l = {}, p = {}, f = null, d = null, h = null, m = !1, g = !1;
                        for(null !== e.anchor && (e.anchorMap[e.anchor] = l), s = e.input.charCodeAt(e.position); 0 !== s;){
                            if (i = e.input.charCodeAt(e.position + 1), o = e.line, a = e.position, 63 !== s && 58 !== s || !F(i)) {
                                if (!K(e, n, v, !1, !0)) break;
                                if (e.line === o) {
                                    for(s = e.input.charCodeAt(e.position); E(s);)s = e.input.charCodeAt(++e.position);
                                    if (58 === s) F(s = e.input.charCodeAt(++e.position)) || N(e, "a whitespace character is expected after the key-value separator within a block mapping"), m && (U(e, l, p, f, d, null), f = d = h = null), r = m = !(g = !0), f = e.tag, d = e.result;
                                    else {
                                        if (!g) return e.tag = c, e.anchor = u, 1;
                                        N(e, "can not read an implicit mapping pair; a colon is missed");
                                    }
                                } else {
                                    if (!g) return e.tag = c, e.anchor = u, 1;
                                    N(e, "can not read a block mapping entry; a multiline key may not be an implicit key");
                                }
                            } else 63 === s ? (m && (U(e, l, p, f, d, null), f = d = h = null), r = m = g = !0) : m ? r = !(m = !1) : N(e, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), e.position += 1, s = i;
                            if ((e.line === o || e.lineIndent > t) && (K(e, t, b, !0, r) && (m ? d = e.result : h = e.result), m || (U(e, l, p, f, d, h, o, a), f = d = h = null), Y(e, !0, -1), s = e.input.charCodeAt(e.position)), e.lineIndent > t && 0 !== s) N(e, "bad indentation of a mapping entry");
                            else if (e.lineIndent < t) break;
                        }
                        return m && U(e, l, p, f, d, null), g && (e.tag = c, e.anchor = u, e.kind = "mapping", e.result = l), g;
                    }(e, f, p)) || function(e, t) {
                        var n, i, r, o, a, s, c, u, l, p = !0, f = e.tag, d = e.anchor, h = {}, m = e.input.charCodeAt(e.position);
                        if (91 === m) s = !(r = 93), i = [];
                        else {
                            if (123 !== m) return;
                            r = 125, s = !0, i = {};
                        }
                        for(null !== e.anchor && (e.anchorMap[e.anchor] = i), m = e.input.charCodeAt(++e.position); 0 !== m;){
                            if (Y(e, !0, t), (m = e.input.charCodeAt(e.position)) === r) return e.position++, e.tag = f, e.anchor = d, e.kind = s ? "mapping" : "sequence", e.result = i, 1;
                            p || N(e, "missed comma between flow collection entries"), l = null, o = a = !1, 63 === m && F(e.input.charCodeAt(e.position + 1)) && (o = a = !0, e.position++, Y(e, !0, t)), n = e.line, K(e, t, x, !1, !0), u = e.tag, c = e.result, Y(e, !0, t), m = e.input.charCodeAt(e.position), !a && e.line !== n || 58 !== m || (o = !0, m = e.input.charCodeAt(++e.position), Y(e, !0, t), K(e, t, x, !1, !0), l = e.result), s ? U(e, i, h, u, c, l) : o ? i.push(U(e, null, h, u, c, l)) : i.push(c), Y(e, !0, t), 44 === (m = e.input.charCodeAt(e.position)) ? (p = !0, m = e.input.charCodeAt(++e.position)) : p = !1;
                        }
                        N(e, "unexpected end of the stream within a flow collection");
                    }(e, p) ? m = !0 : (a && function(e, t) {
                        var n, i, r, o, a = w, s = !1, c = !1, u = t, l = 0, p = !1, f = e.input.charCodeAt(e.position);
                        if (124 === f) i = !1;
                        else {
                            if (62 !== f) return;
                            i = !0;
                        }
                        for(e.kind = "scalar", e.result = ""; 0 !== f;)if (43 === (f = e.input.charCodeAt(++e.position)) || 45 === f) w === a ? a = 43 === f ? k : C : N(e, "repeat of a chomping mode identifier");
                        else {
                            if (!(0 <= (r = 48 <= (o = f) && o <= 57 ? o - 48 : -1))) break;
                            0 == r ? N(e, "bad explicit indentation width of a block scalar; it cannot be less than one") : c ? N(e, "repeat of an indentation width identifier") : (u = t + r - 1, c = !0);
                        }
                        if (E(f)) {
                            for(; E(f = e.input.charCodeAt(++e.position)););
                            if (35 === f) for(; !O(f = e.input.charCodeAt(++e.position)) && 0 !== f;);
                        }
                        for(; 0 !== f;){
                            for(q(e), e.lineIndent = 0, f = e.input.charCodeAt(e.position); (!c || e.lineIndent < u) && 32 === f;)e.lineIndent++, f = e.input.charCodeAt(++e.position);
                            if (!c && e.lineIndent > u && (u = e.lineIndent), O(f)) l++;
                            else {
                                if (e.lineIndent < u) {
                                    a === k ? e.result += g.repeat("\n", s ? 1 + l : l) : a === w && s && (e.result += "\n");
                                    break;
                                }
                                for(i ? E(f) ? (p = !0, e.result += g.repeat("\n", s ? 1 + l : l)) : p ? (p = !1, e.result += g.repeat("\n", l + 1)) : 0 === l ? s && (e.result += " ") : e.result += g.repeat("\n", l) : e.result += g.repeat("\n", s ? 1 + l : l), c = s = !0, l = 0, n = e.position; !O(f) && 0 !== f;)f = e.input.charCodeAt(++e.position);
                                L(e, n, e.position, !1);
                            }
                        }
                        return 1;
                    }(e, p) || function(e, t) {
                        var n, i, r = e.input.charCodeAt(e.position);
                        if (39 === r) {
                            for(e.kind = "scalar", e.result = "", e.position++, n = i = e.position; 0 !== (r = e.input.charCodeAt(e.position));)if (39 === r) {
                                if (L(e, n, e.position, !0), 39 !== (r = e.input.charCodeAt(++e.position))) return 1;
                                n = e.position, e.position++, i = e.position;
                            } else O(r) ? (L(e, n, i, !0), B(e, Y(e, !1, t)), n = i = e.position) : e.position === e.lineStart && R(e) ? N(e, "unexpected end of the document within a single quoted scalar") : (e.position++, i = e.position);
                            N(e, "unexpected end of the stream within a single quoted scalar");
                        }
                    }(e, p) || P(e, p) ? m = !0 : !function(e) {
                        var t, n, i = e.input.charCodeAt(e.position);
                        if (42 === i) {
                            for(i = e.input.charCodeAt(++e.position), t = e.position; 0 !== i && !F(i) && !_(i);)i = e.input.charCodeAt(++e.position);
                            return e.position === t && N(e, "name of an alias node must contain at least one character"), n = e.input.slice(t, e.position), e.anchorMap.hasOwnProperty(n) || N(e, 'unidentified alias "' + n + '"'), e.result = e.anchorMap[n], Y(e, !0, -1), 1;
                        }
                    }(e) ? function(e, t, n) {
                        var i, r, o, a, s, c, u, l = e.kind, p = e.result, f = e.input.charCodeAt(e.position);
                        if (!F(f) && !_(f) && 35 !== f && 38 !== f && 42 !== f && 33 !== f && 124 !== f && 62 !== f && 39 !== f && 34 !== f && 37 !== f && 64 !== f && 96 !== f && (63 !== f && 45 !== f || !(F(i = e.input.charCodeAt(e.position + 1)) || n && _(i)))) {
                            for(e.kind = "scalar", e.result = "", r = o = e.position, a = !1; 0 !== f;){
                                if (58 === f) {
                                    if (F(i = e.input.charCodeAt(e.position + 1)) || n && _(i)) break;
                                } else if (35 === f) {
                                    if (F(e.input.charCodeAt(e.position - 1))) break;
                                } else {
                                    if (e.position === e.lineStart && R(e) || n && _(f)) break;
                                    if (O(f)) {
                                        if (s = e.line, c = e.lineStart, u = e.lineIndent, Y(e, !1, -1), e.lineIndent >= t) {
                                            a = !0, f = e.input.charCodeAt(e.position);
                                            continue;
                                        }
                                        e.position = o, e.line = s, e.lineStart = c, e.lineIndent = u;
                                        break;
                                    }
                                }
                                a && (L(e, r, o, !1), B(e, e.line - s), r = o = e.position, a = !1), E(f) || (o = e.position + 1), f = e.input.charCodeAt(++e.position);
                            }
                            if (L(e, r, o, !1), e.result) return 1;
                            e.kind = l, e.result = p;
                        }
                    }(e, p, x === n) && (m = !0, null === e.tag && (e.tag = "?")) : (m = !0, null === e.tag && null === e.anchor || N(e, "alias node should not have any properties")), null !== e.anchor && (e.anchorMap[e.anchor] = e.result)) : 0 === d && (m = s && W(e, f))), null !== e.tag && "!" !== e.tag) if ("?" === e.tag) {
                        for(null !== e.result && "scalar" !== e.kind && N(e, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + e.kind + '"'), c = 0, u = e.implicitTypes.length; c < u; c += 1)if ((l = e.implicitTypes[c]).resolve(e.result)) {
                            e.result = l.construct(e.result), e.tag = l.tag, null !== e.anchor && (e.anchorMap[e.anchor] = e.result);
                            break;
                        }
                    } else y.call(e.typeMap[e.kind || "fallback"], e.tag) ? (l = e.typeMap[e.kind || "fallback"][e.tag], null !== e.result && l.kind !== e.kind && N(e, "unacceptable node kind for !<" + e.tag + '> tag; it should be "' + l.kind + '", not "' + e.kind + '"'), l.resolve(e.result) ? (e.result = l.construct(e.result), null !== e.anchor && (e.anchorMap[e.anchor] = e.result)) : N(e, "cannot resolve a node with !<" + e.tag + "> explicit tag")) : N(e, "unknown tag !<" + e.tag + ">");
                    return null !== e.listener && e.listener("close", e), null !== e.tag || null !== e.anchor || m;
                }
                function $(e, t) {
                    t = t || {}, 0 !== (e = String(e)).length && (10 !== e.charCodeAt(e.length - 1) && 13 !== e.charCodeAt(e.length - 1) && (e += "\n"), 65279 === e.charCodeAt(0) && (e = e.slice(1)));
                    var n = new h(e, t), i = e.indexOf("\0");
                    for(-1 !== i && (n.position = i, N(n, "null byte is not allowed in input")), n.input += "\0"; 32 === n.input.charCodeAt(n.position);)n.lineIndent += 1, n.position += 1;
                    for(; n.position < n.length - 1;)!function(e) {
                        var t, n, i, r, o = e.position, a = !1;
                        for(e.version = null, e.checkLineBreaks = e.legacy, e.tagMap = {}, e.anchorMap = {}; 0 !== (r = e.input.charCodeAt(e.position)) && (Y(e, !0, -1), r = e.input.charCodeAt(e.position), !(0 < e.lineIndent || 37 !== r));){
                            for(a = !0, r = e.input.charCodeAt(++e.position), t = e.position; 0 !== r && !F(r);)r = e.input.charCodeAt(++e.position);
                            for(i = [], (n = e.input.slice(t, e.position)).length < 1 && N(e, "directive name must not be less than one character in length"); 0 !== r;){
                                for(; E(r);)r = e.input.charCodeAt(++e.position);
                                if (35 === r) {
                                    for(; 0 !== (r = e.input.charCodeAt(++e.position)) && !O(r););
                                    break;
                                }
                                if (O(r)) break;
                                for(t = e.position; 0 !== r && !F(r);)r = e.input.charCodeAt(++e.position);
                                i.push(e.input.slice(t, e.position));
                            }
                            0 !== r && q(e), y.call(T, n) ? T[n](e, n, i) : M(e, 'unknown document directive "' + n + '"');
                        }
                        Y(e, !0, -1), 0 === e.lineIndent && 45 === e.input.charCodeAt(e.position) && 45 === e.input.charCodeAt(e.position + 1) && 45 === e.input.charCodeAt(e.position + 2) ? (e.position += 3, Y(e, !0, -1)) : a && N(e, "directives end mark is expected"), K(e, e.lineIndent - 1, b, !1, !0), Y(e, !0, -1), e.checkLineBreaks && s.test(e.input.slice(o, e.position)) && M(e, "non-ASCII line breaks are interpreted as content"), e.documents.push(e.result), e.position === e.lineStart && R(e) ? 46 === e.input.charCodeAt(e.position) && (e.position += 3, Y(e, !0, -1)) : e.position < e.length - 1 && N(e, "end of the stream or a document separator is expected");
                    }(n);
                    return n.documents;
                }
                function H(e, t, n) {
                    null !== t && "object" == typeof t && void 0 === n && (n = t, t = null);
                    var i = $(e, n);
                    if ("function" != typeof t) return i;
                    for(var r = 0, o = i.length; r < o; r += 1)t(i[r]);
                }
                function G(e, t) {
                    var n = $(e, t);
                    if (0 !== n.length) {
                        if (1 === n.length) return n[0];
                        throw new i("expected a single document in the stream, but found more");
                    }
                }
                t.exports.loadAll = H, t.exports.load = G, t.exports.safeLoadAll = function(e, t, n) {
                    return "object" == typeof t && null !== t && void 0 === n && (n = t, t = null), H(e, t, g.extend({
                        schema: o
                    }, n));
                }, t.exports.safeLoad = function(e, t) {
                    return G(e, g.extend({
                        schema: o
                    }, t));
                };
            },
            {
                "./common": 2,
                "./exception": 4,
                "./mark": 6,
                "./schema/default_full": 9,
                "./schema/default_safe": 10
            }
        ],
        6: [
            function(e, t, n) {
                "use strict";
                var s = e("./common");
                function i(e, t, n, i, r) {
                    this.name = e, this.buffer = t, this.position = n, this.line = i, this.column = r;
                }
                i.prototype.getSnippet = function(e, t) {
                    var n, i, r, o, a;
                    if (!this.buffer) return null;
                    for(e = e || 4, t = t || 75, n = "", i = this.position; 0 < i && -1 === "\0\r\n\u2028\u2029".indexOf(this.buffer.charAt(i - 1));)if (--i, this.position - i > t / 2 - 1) {
                        n = " ... ", i += 5;
                        break;
                    }
                    for(r = "", o = this.position; o < this.buffer.length && -1 === "\0\r\n\u2028\u2029".indexOf(this.buffer.charAt(o));)if ((o += 1) - this.position > t / 2 - 1) {
                        r = " ... ", o -= 5;
                        break;
                    }
                    return a = this.buffer.slice(i, o), s.repeat(" ", e) + n + a + r + "\n" + s.repeat(" ", e + this.position - i + n.length) + "^";
                }, i.prototype.toString = function(e) {
                    var t, n = "";
                    return this.name && (n += 'in "' + this.name + '" '), n += "at line " + (this.line + 1) + ", column " + (this.column + 1), e || (t = this.getSnippet()) && (n += ":\n" + t), n;
                }, t.exports = i;
            },
            {
                "./common": 2
            }
        ],
        7: [
            function(e, t, n) {
                "use strict";
                var r = e("./common"), o = e("./exception"), a = e("./type");
                function s(e, t, i) {
                    var r = [];
                    return e.include.forEach(function(e) {
                        i = s(e, t, i);
                    }), e[t].forEach(function(n) {
                        i.forEach(function(e, t) {
                            e.tag === n.tag && e.kind === n.kind && r.push(t);
                        }), i.push(n);
                    }), i.filter(function(e, t) {
                        return -1 === r.indexOf(t);
                    });
                }
                function c(e) {
                    this.include = e.include || [], this.implicit = e.implicit || [], this.explicit = e.explicit || [], this.implicit.forEach(function(e) {
                        if (e.loadKind && "scalar" !== e.loadKind) throw new o("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
                    }), this.compiledImplicit = s(this, "implicit", []), this.compiledExplicit = s(this, "explicit", []), this.compiledTypeMap = function() {
                        var e, t, n = {
                            scalar: {},
                            sequence: {},
                            mapping: {},
                            fallback: {}
                        };
                        function i(e) {
                            n[e.kind][e.tag] = n.fallback[e.tag] = e;
                        }
                        for(e = 0, t = arguments.length; e < t; e += 1)arguments[e].forEach(i);
                        return n;
                    }(this.compiledImplicit, this.compiledExplicit);
                }
                c.DEFAULT = null, c.create = function(e, t) {
                    var n, i;
                    switch(arguments.length){
                        case 1:
                            n = c.DEFAULT, i = e;
                            break;
                        case 2:
                            n = e, i = t;
                            break;
                        default:
                            throw new o("Wrong number of arguments for Schema.create function");
                    }
                    if (n = r.toArray(n), i = r.toArray(i), !n.every(function(e) {
                        return e instanceof c;
                    })) throw new o("Specified list of super schemas (or a single Schema object) contains a non-Schema object.");
                    if (!i.every(function(e) {
                        return e instanceof a;
                    })) throw new o("Specified list of YAML types (or a single Type object) contains a non-Type object.");
                    return new c({
                        include: n,
                        explicit: i
                    });
                }, t.exports = c;
            },
            {
                "./common": 2,
                "./exception": 4,
                "./type": 13
            }
        ],
        8: [
            function(e, t, n) {
                "use strict";
                var i = e("../schema");
                t.exports = new i({
                    include: [
                        e("./json")
                    ]
                });
            },
            {
                "../schema": 7,
                "./json": 12
            }
        ],
        9: [
            function(e, t, n) {
                "use strict";
                var i = e("../schema");
                t.exports = i.DEFAULT = new i({
                    include: [
                        e("./default_safe")
                    ],
                    explicit: [
                        e("../type/js/undefined"),
                        e("../type/js/regexp"),
                        e("../type/js/function")
                    ]
                });
            },
            {
                "../schema": 7,
                "../type/js/function": 18,
                "../type/js/regexp": 19,
                "../type/js/undefined": 20,
                "./default_safe": 10
            }
        ],
        10: [
            function(e, t, n) {
                "use strict";
                var i = e("../schema");
                t.exports = new i({
                    include: [
                        e("./core")
                    ],
                    implicit: [
                        e("../type/timestamp"),
                        e("../type/merge")
                    ],
                    explicit: [
                        e("../type/binary"),
                        e("../type/omap"),
                        e("../type/pairs"),
                        e("../type/set")
                    ]
                });
            },
            {
                "../schema": 7,
                "../type/binary": 14,
                "../type/merge": 22,
                "../type/omap": 24,
                "../type/pairs": 25,
                "../type/set": 27,
                "../type/timestamp": 29,
                "./core": 8
            }
        ],
        11: [
            function(e, t, n) {
                "use strict";
                var i = e("../schema");
                t.exports = new i({
                    explicit: [
                        e("../type/str"),
                        e("../type/seq"),
                        e("../type/map")
                    ]
                });
            },
            {
                "../schema": 7,
                "../type/map": 21,
                "../type/seq": 26,
                "../type/str": 28
            }
        ],
        12: [
            function(e, t, n) {
                "use strict";
                var i = e("../schema");
                t.exports = new i({
                    include: [
                        e("./failsafe")
                    ],
                    implicit: [
                        e("../type/null"),
                        e("../type/bool"),
                        e("../type/int"),
                        e("../type/float")
                    ]
                });
            },
            {
                "../schema": 7,
                "../type/bool": 15,
                "../type/float": 16,
                "../type/int": 17,
                "../type/null": 23,
                "./failsafe": 11
            }
        ],
        13: [
            function(e, t, n) {
                "use strict";
                var r = e("./exception"), o = [
                    "kind",
                    "resolve",
                    "construct",
                    "instanceOf",
                    "predicate",
                    "represent",
                    "defaultStyle",
                    "styleAliases"
                ], a = [
                    "scalar",
                    "sequence",
                    "mapping"
                ];
                t.exports = function(t, e) {
                    var n, i;
                    if (e = e || {}, Object.keys(e).forEach(function(e) {
                        if (-1 === o.indexOf(e)) throw new r('Unknown option "' + e + '" is met in definition of "' + t + '" YAML type.');
                    }), this.tag = t, this.kind = e.kind || null, this.resolve = e.resolve || function() {
                        return !0;
                    }, this.construct = e.construct || function(e) {
                        return e;
                    }, this.instanceOf = e.instanceOf || null, this.predicate = e.predicate || null, this.represent = e.represent || null, this.defaultStyle = e.defaultStyle || null, this.styleAliases = (n = e.styleAliases || null, i = {}, null !== n && Object.keys(n).forEach(function(t) {
                        n[t].forEach(function(e) {
                            i[String(e)] = t;
                        });
                    }), i), -1 === a.indexOf(this.kind)) throw new r('Unknown kind "' + this.kind + '" is specified for "' + t + '" YAML type.');
                };
            },
            {
                "./exception": 4
            }
        ],
        14: [
            function(e, t, n) {
                "use strict";
                try {
                    var c = e("buffer").Buffer;
                } catch (e1) {}
                var i = e("../type"), u = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
                t.exports = new i("tag:yaml.org,2002:binary", {
                    kind: "scalar",
                    resolve: function(e) {
                        if (null === e) return !1;
                        for(var t, n = 0, i = e.length, r = u, o = 0; o < i; o++)if (!(64 < (t = r.indexOf(e.charAt(o))))) {
                            if (t < 0) return !1;
                            n += 6;
                        }
                        return n % 8 == 0;
                    },
                    construct: function(e) {
                        for(var t, n = e.replace(/[\r\n=]/g, ""), i = n.length, r = u, o = 0, a = [], s = 0; s < i; s++)s % 4 == 0 && s && (a.push(o >> 16 & 255), a.push(o >> 8 & 255), a.push(255 & o)), o = o << 6 | r.indexOf(n.charAt(s));
                        return 0 == (t = i % 4 * 6) ? (a.push(o >> 16 & 255), a.push(o >> 8 & 255), a.push(255 & o)) : 18 == t ? (a.push(o >> 10 & 255), a.push(o >> 2 & 255)) : 12 == t && a.push(o >> 4 & 255), c ? c.from ? c.from(a) : new c(a) : a;
                    },
                    predicate: function(e) {
                        return c && c.isBuffer(e);
                    },
                    represent: function(e) {
                        for(var t, n = "", i = 0, r = e.length, o = u, a = 0; a < r; a++)a % 3 == 0 && a && (n += o[i >> 18 & 63], n += o[i >> 12 & 63], n += o[i >> 6 & 63], n += o[63 & i]), i = (i << 8) + e[a];
                        return 0 == (t = r % 3) ? (n += o[i >> 18 & 63], n += o[i >> 12 & 63], n += o[i >> 6 & 63], n += o[63 & i]) : 2 == t ? (n += o[i >> 10 & 63], n += o[i >> 4 & 63], n += o[i << 2 & 63], n += o[64]) : 1 == t && (n += o[i >> 2 & 63], n += o[i << 4 & 63], n += o[64], n += o[64]), n;
                    }
                });
            },
            {
                "../type": 13
            }
        ],
        15: [
            function(e, t, n) {
                "use strict";
                var i = e("../type");
                t.exports = new i("tag:yaml.org,2002:bool", {
                    kind: "scalar",
                    resolve: function(e) {
                        if (null === e) return !1;
                        var t = e.length;
                        return 4 === t && ("true" === e || "True" === e || "TRUE" === e) || 5 === t && ("false" === e || "False" === e || "FALSE" === e);
                    },
                    construct: function(e) {
                        return "true" === e || "True" === e || "TRUE" === e;
                    },
                    predicate: function(e) {
                        return "[object Boolean]" === Object.prototype.toString.call(e);
                    },
                    represent: {
                        lowercase: function(e) {
                            return e ? "true" : "false";
                        },
                        uppercase: function(e) {
                            return e ? "TRUE" : "FALSE";
                        },
                        camelcase: function(e) {
                            return e ? "True" : "False";
                        }
                    },
                    defaultStyle: "lowercase"
                });
            },
            {
                "../type": 13
            }
        ],
        16: [
            function(e, t, n) {
                "use strict";
                var i = e("../common"), r = e("../type"), o = new RegExp("^(?:[-+]?(?:0|[1-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
                var a = /^[-+]?[0-9]+e/;
                t.exports = new r("tag:yaml.org,2002:float", {
                    kind: "scalar",
                    resolve: function(e) {
                        return null !== e && !(!o.test(e) || "_" === e[e.length - 1]);
                    },
                    construct: function(e) {
                        var t, n = e.replace(/_/g, "").toLowerCase(), i = "-" === n[0] ? -1 : 1, r = [];
                        return 0 <= "+-".indexOf(n[0]) && (n = n.slice(1)), ".inf" === n ? 1 == i ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : ".nan" === n ? NaN : 0 <= n.indexOf(":") ? (n.split(":").forEach(function(e) {
                            r.unshift(parseFloat(e, 10));
                        }), n = 0, t = 1, r.forEach(function(e) {
                            n += e * t, t *= 60;
                        }), i * n) : i * parseFloat(n, 10);
                    },
                    predicate: function(e) {
                        return "[object Number]" === Object.prototype.toString.call(e) && (e % 1 != 0 || i.isNegativeZero(e));
                    },
                    represent: function(e, t) {
                        var n;
                        if (isNaN(e)) switch(t){
                            case "lowercase":
                                return ".nan";
                            case "uppercase":
                                return ".NAN";
                            case "camelcase":
                                return ".NaN";
                        }
                        else if (Number.POSITIVE_INFINITY === e) switch(t){
                            case "lowercase":
                                return ".inf";
                            case "uppercase":
                                return ".INF";
                            case "camelcase":
                                return ".Inf";
                        }
                        else if (Number.NEGATIVE_INFINITY === e) switch(t){
                            case "lowercase":
                                return "-.inf";
                            case "uppercase":
                                return "-.INF";
                            case "camelcase":
                                return "-.Inf";
                        }
                        else if (i.isNegativeZero(e)) return "-0.0";
                        return n = e.toString(10), a.test(n) ? n.replace("e", ".e") : n;
                    },
                    defaultStyle: "lowercase"
                });
            },
            {
                "../common": 2,
                "../type": 13
            }
        ],
        17: [
            function(e, t, n) {
                "use strict";
                var i = e("../common"), r = e("../type");
                t.exports = new r("tag:yaml.org,2002:int", {
                    kind: "scalar",
                    resolve: function(e) {
                        if (null === e) return !1;
                        var t, n, i, r, o = e.length, a = 0, s = !1;
                        if (!o) return !1;
                        if ("-" !== (t = e[a]) && "+" !== t || (t = e[++a]), "0" === t) {
                            if (a + 1 === o) return !0;
                            if ("b" === (t = e[++a])) {
                                for(a++; a < o; a++)if ("_" !== (t = e[a])) {
                                    if ("0" !== t && "1" !== t) return !1;
                                    s = !0;
                                }
                                return s && "_" !== t;
                            }
                            if ("x" === t) {
                                for(a++; a < o; a++)if ("_" !== (t = e[a])) {
                                    if (!(48 <= (i = e.charCodeAt(a)) && i <= 57 || 65 <= i && i <= 70 || 97 <= i && i <= 102)) return !1;
                                    s = !0;
                                }
                                return s && "_" !== t;
                            }
                            for(; a < o; a++)if ("_" !== (t = e[a])) {
                                if (!(48 <= (n = e.charCodeAt(a)) && n <= 55)) return !1;
                                s = !0;
                            }
                            return s && "_" !== t;
                        }
                        if ("_" === t) return !1;
                        for(; a < o; a++)if ("_" !== (t = e[a])) {
                            if (":" === t) break;
                            if (!(48 <= (r = e.charCodeAt(a)) && r <= 57)) return !1;
                            s = !0;
                        }
                        return !(!s || "_" === t) && (":" !== t || /^(:[0-5]?[0-9])+$/.test(e.slice(a)));
                    },
                    construct: function(e) {
                        var t, n, i = e, r = 1, o = [];
                        return -1 !== i.indexOf("_") && (i = i.replace(/_/g, "")), "-" !== (t = i[0]) && "+" !== t || ("-" === t && (r = -1), t = (i = i.slice(1))[0]), "0" === i ? 0 : "0" === t ? "b" === i[1] ? r * parseInt(i.slice(2), 2) : "x" === i[1] ? r * parseInt(i, 16) : r * parseInt(i, 8) : -1 !== i.indexOf(":") ? (i.split(":").forEach(function(e) {
                            o.unshift(parseInt(e, 10));
                        }), i = 0, n = 1, o.forEach(function(e) {
                            i += e * n, n *= 60;
                        }), r * i) : r * parseInt(i, 10);
                    },
                    predicate: function(e) {
                        return "[object Number]" === Object.prototype.toString.call(e) && e % 1 == 0 && !i.isNegativeZero(e);
                    },
                    represent: {
                        binary: function(e) {
                            return 0 <= e ? "0b" + e.toString(2) : "-0b" + e.toString(2).slice(1);
                        },
                        octal: function(e) {
                            return 0 <= e ? "0" + e.toString(8) : "-0" + e.toString(8).slice(1);
                        },
                        decimal: function(e) {
                            return e.toString(10);
                        },
                        hexadecimal: function(e) {
                            return 0 <= e ? "0x" + e.toString(16).toUpperCase() : "-0x" + e.toString(16).toUpperCase().slice(1);
                        }
                    },
                    defaultStyle: "decimal",
                    styleAliases: {
                        binary: [
                            2,
                            "bin"
                        ],
                        octal: [
                            8,
                            "oct"
                        ],
                        decimal: [
                            10,
                            "dec"
                        ],
                        hexadecimal: [
                            16,
                            "hex"
                        ]
                    }
                });
            },
            {
                "../common": 2,
                "../type": 13
            }
        ],
        18: [
            function(e, t, n) {
                "use strict";
                try {
                    var o = e("esprima");
                } catch (e1) {
                    "undefined" != typeof window && (o = window.esprima);
                }
                var i = e("../../type");
                t.exports = new i("tag:yaml.org,2002:js/function", {
                    kind: "scalar",
                    resolve: function(e) {
                        if (null === e) return !1;
                        try {
                            var t = "(" + e + ")", n = o.parse(t, {
                                range: !0
                            });
                            return "Program" !== n.type || 1 !== n.body.length || "ExpressionStatement" !== n.body[0].type || "ArrowFunctionExpression" !== n.body[0].expression.type && "FunctionExpression" !== n.body[0].expression.type ? !1 : !0;
                        } catch (e1) {
                            return !1;
                        }
                    },
                    construct: function(e) {
                        var t, n = "(" + e + ")", i = o.parse(n, {
                            range: !0
                        }), r = [];
                        if ("Program" !== i.type || 1 !== i.body.length || "ExpressionStatement" !== i.body[0].type || "ArrowFunctionExpression" !== i.body[0].expression.type && "FunctionExpression" !== i.body[0].expression.type) throw new Error("Failed to resolve function");
                        return i.body[0].expression.params.forEach(function(e) {
                            r.push(e.name);
                        }), t = i.body[0].expression.body.range, "BlockStatement" === i.body[0].expression.body.type ? new Function(r, n.slice(t[0] + 1, t[1] - 1)) : new Function(r, "return " + n.slice(t[0], t[1]));
                    },
                    predicate: function(e) {
                        return "[object Function]" === Object.prototype.toString.call(e);
                    },
                    represent: function(e) {
                        return e.toString();
                    }
                });
            },
            {
                "../../type": 13
            }
        ],
        19: [
            function(e, t, n) {
                "use strict";
                var i = e("../../type");
                t.exports = new i("tag:yaml.org,2002:js/regexp", {
                    kind: "scalar",
                    resolve: function(e) {
                        if (null === e) return !1;
                        if (0 === e.length) return !1;
                        var t = e, n = /\/([gim]*)$/.exec(e), i = "";
                        if ("/" === t[0]) {
                            if (n && (i = n[1]), 3 < i.length) return !1;
                            if ("/" !== t[t.length - i.length - 1]) return !1;
                        }
                        return !0;
                    },
                    construct: function(e) {
                        var t = e, n = /\/([gim]*)$/.exec(e), i = "";
                        return "/" === t[0] && (n && (i = n[1]), t = t.slice(1, t.length - i.length - 1)), new RegExp(t, i);
                    },
                    predicate: function(e) {
                        return "[object RegExp]" === Object.prototype.toString.call(e);
                    },
                    represent: function(e) {
                        var t = "/" + e.source + "/";
                        return e.global && (t += "g"), e.multiline && (t += "m"), e.ignoreCase && (t += "i"), t;
                    }
                });
            },
            {
                "../../type": 13
            }
        ],
        20: [
            function(e, t, n) {
                "use strict";
                var i = e("../../type");
                t.exports = new i("tag:yaml.org,2002:js/undefined", {
                    kind: "scalar",
                    resolve: function() {
                        return !0;
                    },
                    construct: function() {},
                    predicate: function(e) {
                        return void 0 === e;
                    },
                    represent: function() {
                        return "";
                    }
                });
            },
            {
                "../../type": 13
            }
        ],
        21: [
            function(e, t, n) {
                "use strict";
                var i = e("../type");
                t.exports = new i("tag:yaml.org,2002:map", {
                    kind: "mapping",
                    construct: function(e) {
                        return null !== e ? e : {};
                    }
                });
            },
            {
                "../type": 13
            }
        ],
        22: [
            function(e, t, n) {
                "use strict";
                var i = e("../type");
                t.exports = new i("tag:yaml.org,2002:merge", {
                    kind: "scalar",
                    resolve: function(e) {
                        return "<<" === e || null === e;
                    }
                });
            },
            {
                "../type": 13
            }
        ],
        23: [
            function(e, t, n) {
                "use strict";
                var i = e("../type");
                t.exports = new i("tag:yaml.org,2002:null", {
                    kind: "scalar",
                    resolve: function(e) {
                        if (null === e) return !0;
                        var t = e.length;
                        return 1 === t && "~" === e || 4 === t && ("null" === e || "Null" === e || "NULL" === e);
                    },
                    construct: function() {
                        return null;
                    },
                    predicate: function(e) {
                        return null === e;
                    },
                    represent: {
                        canonical: function() {
                            return "~";
                        },
                        lowercase: function() {
                            return "null";
                        },
                        uppercase: function() {
                            return "NULL";
                        },
                        camelcase: function() {
                            return "Null";
                        }
                    },
                    defaultStyle: "lowercase"
                });
            },
            {
                "../type": 13
            }
        ],
        24: [
            function(e, t, n) {
                "use strict";
                var i = e("../type"), c = Object.prototype.hasOwnProperty, u = Object.prototype.toString;
                t.exports = new i("tag:yaml.org,2002:omap", {
                    kind: "sequence",
                    resolve: function(e) {
                        if (null === e) return !0;
                        for(var t, n, i, r = [], o = e, a = 0, s = o.length; a < s; a += 1){
                            if (t = o[a], i = !1, "[object Object]" !== u.call(t)) return !1;
                            for(n in t)if (c.call(t, n)) {
                                if (i) return !1;
                                i = !0;
                            }
                            if (!i) return !1;
                            if (-1 !== r.indexOf(n)) return !1;
                            r.push(n);
                        }
                        return !0;
                    },
                    construct: function(e) {
                        return null !== e ? e : [];
                    }
                });
            },
            {
                "../type": 13
            }
        ],
        25: [
            function(e, t, n) {
                "use strict";
                var i = e("../type"), s = Object.prototype.toString;
                t.exports = new i("tag:yaml.org,2002:pairs", {
                    kind: "sequence",
                    resolve: function(e) {
                        if (null === e) return !0;
                        for(var t, n, i = e, r = new Array(i.length), o = 0, a = i.length; o < a; o += 1){
                            if (t = i[o], "[object Object]" !== s.call(t)) return !1;
                            if (1 !== (n = Object.keys(t)).length) return !1;
                            r[o] = [
                                n[0],
                                t[n[0]]
                            ];
                        }
                        return !0;
                    },
                    construct: function(e) {
                        if (null === e) return [];
                        for(var t, n, i = e, r = new Array(i.length), o = 0, a = i.length; o < a; o += 1)t = i[o], n = Object.keys(t), r[o] = [
                            n[0],
                            t[n[0]]
                        ];
                        return r;
                    }
                });
            },
            {
                "../type": 13
            }
        ],
        26: [
            function(e, t, n) {
                "use strict";
                var i = e("../type");
                t.exports = new i("tag:yaml.org,2002:seq", {
                    kind: "sequence",
                    construct: function(e) {
                        return null !== e ? e : [];
                    }
                });
            },
            {
                "../type": 13
            }
        ],
        27: [
            function(e, t, n) {
                "use strict";
                var i = e("../type"), r = Object.prototype.hasOwnProperty;
                t.exports = new i("tag:yaml.org,2002:set", {
                    kind: "mapping",
                    resolve: function(e) {
                        if (null === e) return !0;
                        var t, n = e;
                        for(t in n)if (r.call(n, t) && null !== n[t]) return !1;
                        return !0;
                    },
                    construct: function(e) {
                        return null !== e ? e : {};
                    }
                });
            },
            {
                "../type": 13
            }
        ],
        28: [
            function(e, t, n) {
                "use strict";
                var i = e("../type");
                t.exports = new i("tag:yaml.org,2002:str", {
                    kind: "scalar",
                    construct: function(e) {
                        return null !== e ? e : "";
                    }
                });
            },
            {
                "../type": 13
            }
        ],
        29: [
            function(e, t, n) {
                "use strict";
                var i = e("../type"), p = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"), f = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
                t.exports = new i("tag:yaml.org,2002:timestamp", {
                    kind: "scalar",
                    resolve: function(e) {
                        return null !== e && (null !== p.exec(e) || null !== f.exec(e));
                    },
                    construct: function(e) {
                        var t, n, i, r, o, a, s, c = 0, u = null, l = p.exec(e);
                        if (null === l && (l = f.exec(e)), null === l) throw new Error("Date resolve error");
                        if (t = +l[1], n = l[2] - 1, i = +l[3], !l[4]) return new Date(Date.UTC(t, n, i));
                        if (r = +l[4], o = +l[5], a = +l[6], l[7]) {
                            for(c = l[7].slice(0, 3); c.length < 3;)c += "0";
                            c = +c;
                        }
                        return l[9] && (u = 6e4 * (60 * +l[10] + +(l[11] || 0)), "-" === l[9] && (u = -u)), s = new Date(Date.UTC(t, n, i, r, o, a, c)), u && s.setTime(s.getTime() - u), s;
                    },
                    instanceOf: Date,
                    represent: function(e) {
                        return e.toISOString();
                    }
                });
            },
            {
                "../type": 13
            }
        ],
        "/": [
            function(e, t, n) {
                "use strict";
                var i = e("./lib/js-yaml.js");
                t.exports = i;
            },
            {
                "./lib/js-yaml.js": 1
            }
        ]
    }, {}, [])("/");
});
let Type = window.jsyaml.Type;
let Schema = window.jsyaml.Schema;
let FAILSAFE_SCHEMA = window.jsyaml.FAILSAFE_SCHEMA;
let JSON_SCHEMA = window.jsyaml.JSON_SCHEMA;
let CORE_SCHEMA = window.jsyaml.CORE_SCHEMA;
let DEFAULT_SAFE_SCHEMA = window.jsyaml.DEFAULT_SAFE_SCHEMA;
let DEFAULT_FULL_SCHEMA = window.jsyaml.DEFAULT_FULL_SCHEMA;
let load = window.jsyaml.load;
let loadAll = window.jsyaml.loadAll;
let safeLoad = window.jsyaml.safeLoad;
let safeLoadAll = window.jsyaml.safeLoadAll;
let dump = window.jsyaml.dump;
let safeDump = window.jsyaml.safeDump;
let YAMLException = window.jsyaml.YAMLException;
let MINIMAL_SCHEMA = window.jsyaml.MINIMAL_SCHEMA;
let SAFE_SCHEMA = window.jsyaml.SAFE_SCHEMA;
let DEFAULT_SCHEMA = window.jsyaml.DEFAULT_SCHEMA;
let scan = window.jsyaml.scan;
let parse9 = window.jsyaml.parse;
let compose = window.jsyaml.compose;
let addConstructor = window.jsyaml.addConstructor;
const mod5 = {
    Type: Type,
    Schema: Schema,
    FAILSAFE_SCHEMA: FAILSAFE_SCHEMA,
    JSON_SCHEMA: JSON_SCHEMA,
    CORE_SCHEMA: CORE_SCHEMA,
    DEFAULT_SAFE_SCHEMA: DEFAULT_SAFE_SCHEMA,
    DEFAULT_FULL_SCHEMA: DEFAULT_FULL_SCHEMA,
    load: load,
    loadAll: loadAll,
    safeLoad: safeLoad,
    safeLoadAll: safeLoadAll,
    dump: dump,
    safeDump: safeDump,
    YAMLException: YAMLException,
    MINIMAL_SCHEMA: MINIMAL_SCHEMA,
    SAFE_SCHEMA: SAFE_SCHEMA,
    DEFAULT_SCHEMA: DEFAULT_SCHEMA,
    scan: scan,
    parse: parse9,
    compose: compose,
    addConstructor: addConstructor
};
const { Validator  } = Ir;
const responsePayloadSchema = {
    "id": "/Payload",
    "type": [
        "object",
        "array"
    ],
    "properties": {
        "$httpStatus$": {
            "type": "number",
            minimum: 200,
            maximum: 599
        }
    },
    "additionalProperties": true,
    "required": []
};
const routeSchema = {
    "id": "/Route",
    "type": "object",
    "patternProperties": {
        "^.*$": {
            "$ref": "/Payload"
        }
    },
    "required": []
};
const configSchema = {
    "id": "/RoutesConfig",
    "type": "object",
    "properties": {
        "_rePath": {
            type: "array"
        },
        "defaultResponse": {
            "$ref": "/Payload"
        },
        "errorResponse": {
            "$ref": "/Payload"
        },
        "routes": {
            "type": "object",
            "patternProperties": {
                "\\*": {
                    "$ref": "/Route"
                },
                "^(get|put|post|patch|delete|options|head)$": {
                    "$ref": "/Route"
                }
            },
            "additionalProperties": false
        }
    },
    "additionalProperties": false
};
const validator = new Validator();
validator.addSchema(responsePayloadSchema, "/Payload");
validator.addSchema(routeSchema, "/Route");
validator.addSchema(configSchema, "/RoutesConfig");
const validateConfigSchema = (config)=>{
    return validator.validate(config, configSchema);
};
class Merger {
    static isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }
    static cloneArray(item) {
        return [
            ...item.map((e)=>Merger.isObject(e) ? {
                    ...e
                } : e)
        ];
    }
    static merge1Level(target, o2) {
        Object.keys(o2).forEach((key)=>{
            if (Merger.isObject(o2[key])) {
                if (!target[key]) {
                    target[key] = {};
                }
                Merger.merge1Level(target[key], o2[key]);
            } else {
                target[key] = Array.isArray(o2[key]) ? Merger.cloneArray(o2[key]) : o2[key];
            }
        });
        return target;
    }
    static deepMerge(...objects) {
        const output = {};
        objects.forEach((obj)=>{
            if (obj) {
                Merger.merge1Level(output, obj);
            }
        });
        return output;
    }
    static deepCopy(obj) {
        if (Array.isArray(obj)) {
            return Merger.cloneArray(obj);
        } else {
            return Merger.deepMerge({}, obj);
        }
    }
}
Merger.deepMerge;
const deepCopy = Merger.deepCopy;
function isYaml(file) {
    return file.endsWith('.yaml') || file.endsWith('.yml');
}
const loadConfigFile = async (...cfgLocatios)=>{
    new TextDecoder();
    let rawFileContent;
    for (const filePath of cfgLocatios){
        try {
            rawFileContent = await Deno.readFile(filePath);
            const configFileContent = new TextDecoder('utf8').decode(rawFileContent);
            const config = isYaml(filePath) ? mod5.load(configFileContent) : JSON.parse(configFileContent);
            return config;
        } catch (_) {}
    }
    throw new Error('No config file found');
};
const CONFIG_FILE_LOCATIONS = [
    join3(mainModuleDir, 'config', 'response.yml'),
    join3(mainModuleDir, 'src', 'config', 'response.yml')
];
console.log('CONFIG_FILE_LOCATION:', CONFIG_FILE_LOCATIONS);
const defaultResponseConfig = await loadConfigFile(...CONFIG_FILE_LOCATIONS);
function assertConfigIsValid(conf) {
    const r = validateConfigSchema(conf);
    if (r.errors.length > 0) {
        throw new Error("ERROR validating config:\n" + r.errors.join('\n'));
    }
}
function prepareConfigMerge(configsToMerge) {
    const notMergeableFields = [
        'defaultResponse',
        'errorResponse'
    ];
    function deletePreviousValues(key, reversedExtraConfig) {
        const lastIndex = reversedExtraConfig.findIndex((c)=>!!c[key]);
        if (lastIndex > -1) {
            for(let i = lastIndex + 1; i < reversedExtraConfig.length; i++){
                delete reversedExtraConfig[i][key];
            }
        }
    }
    if (configsToMerge.length > 1) {
        const reversedExtraConfig = configsToMerge.reverse();
        for (const key of notMergeableFields){
            deletePreviousValues(key, reversedExtraConfig);
        }
    }
}
function getConfig(...otherConfigs) {
    const defaultConfigCopy = Merger.deepMerge({}, defaultResponseConfig);
    if (otherConfigs.length > 0) {
        prepareConfigMerge(otherConfigs);
        const newConfig = Merger.deepMerge(...otherConfigs);
        assertConfigIsValid(newConfig);
        const configsToMerge = [
            defaultConfigCopy,
            newConfig
        ];
        prepareConfigMerge(configsToMerge);
        return Merger.deepMerge(...configsToMerge);
    }
    return defaultConfigCopy;
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
    boolean: [
        'silent',
        'verbose'
    ],
    default: {
        silent: false,
        verbose: false,
        apiPrefix: '',
        port: 3003,
        host: '0.0.0.0'
    },
    string: [
        'apiPrefix',
        'host',
        'config'
    ],
    collect: [
        'config'
    ]
};
const getParams = async ()=>{
    const opts = parse3(Deno.args, parseConfig);
    const extraConfig = [];
    for (const fPath of opts.config){
        try {
            extraConfig.push(await loadConfigFile(fPath));
        } catch (_) {
            console.error(`Config file ${fPath} not found. Program will exit.`);
            Deno.exit(-1);
        }
    }
    opts.responseConfig = getConfig(...extraConfig);
    return opts;
};
const PING_MSG = 'API Mockr';
const PRETTY_PARAM = '_pretty';
const DELAY_PARAM = '_delay';
const FORCE_ERROR_PARAM = '_forceError';
const FORCE_ERROR_HEADER = 'x-mockr-force-error';
const FORCE_ERROR_MSG_HEADER = 'x-mockr-error-msg';
const RESPONSE_TIME_HEADER = 'x-mockr-response-time';
const extendRequest = ()=>{
    if (!!toAny(Request.prototype).json0) {
        return;
    }
    toAny(Request.prototype).json0 = Request.prototype.json;
    toAny(Request.prototype).text0 = Request.prototype.text;
    Request.prototype.json = async function() {
        if (this.parsedBody) {
            return this.parsedBody;
        }
        try {
            this.parsedBody = await toAny(this).json0();
        } catch (_) {
            this.parsedBody = Promise.resolve({
                error: true
            });
        }
        return this.parsedBody;
    };
    Request.prototype.text = async function() {
        console.log('=> TEXT', this.bodyUsed);
        if (this.parsedBody) {
            return this.parsedBody;
        }
        this.parsedBody = await toAny(this).text0();
        console.log('TXT =>', this.parsedBody);
        return this.parsedBody;
    };
};
const parse10 = (cookie)=>{
    const pairs = cookie.split(/;\s*/g);
    const parsedCookie = {};
    for(let i = 0, len = pairs.length; i < len; i++){
        const pair = pairs[i].split(/\s*=\s*([^\s]+)/);
        parsedCookie[pair[0]] = decodeURIComponent(pair[1]);
    }
    return parsedCookie;
};
const serialize = (name, value, opt = {})=>{
    value = encodeURIComponent(value);
    let cookie = `${name}=${value}`;
    if (opt.maxAge) {
        cookie += `; Max-Age=${Math.floor(opt.maxAge)}`;
    }
    if (opt.domain) {
        cookie += '; Domain=' + opt.domain;
    }
    if (opt.path) {
        cookie += '; Path=' + opt.path;
    }
    if (opt.expires) {
        cookie += '; Expires=' + opt.expires.toUTCString();
    }
    if (opt.httpOnly) {
        cookie += '; HttpOnly';
    }
    if (opt.secure) {
        cookie += '; Secure';
    }
    if (opt.sameSite) {
        cookie += `; SameSite=${opt.sameSite}`;
    }
    return cookie;
};
const URL_REGEXP = /^https?:\/\/[a-zA-Z0-9\-\.:]+(\/?[^?#]*)/;
const splitPath = (path)=>{
    const paths = path.split(/\//);
    if (paths[0] === '') {
        paths.shift();
    }
    return paths;
};
const patternCache = {};
const getPattern = (label)=>{
    if (label === '*') {
        return '*';
    }
    const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    if (match) {
        if (!patternCache[label]) {
            if (match[2]) {
                patternCache[label] = [
                    label,
                    match[1],
                    new RegExp('^' + match[2] + '$')
                ];
            } else {
                patternCache[label] = [
                    label,
                    match[1],
                    true
                ];
            }
        }
        return patternCache[label];
    }
    return null;
};
const getPathFromURL = (url, strict = true)=>{
    const queryIndex = url.indexOf('?');
    const result = url.substring(url.indexOf('/', 8), queryIndex === -1 ? url.length : queryIndex);
    if (strict === false && result.endsWith('/')) {
        return result.slice(0, -1);
    }
    return result;
};
const isAbsoluteURL = (url)=>{
    const match = url.match(URL_REGEXP);
    if (match) {
        return true;
    }
    return false;
};
const mergePath = (...paths)=>{
    let p = '';
    let endsWithSlash = false;
    for (let path of paths){
        if (p.endsWith('/')) {
            p = p.slice(0, -1);
            endsWithSlash = true;
        }
        if (!path.startsWith('/')) {
            path = `/${path}`;
        }
        if (path === '/' && endsWithSlash) {
            p = `${p}/`;
        } else if (path !== '/') {
            p = `${p}${path}`;
        }
        if (path === '/' && p === '') {
            p = '/';
        }
    }
    return p;
};
class HonoContext {
    req;
    env;
    finalized;
    _status = 200;
    _executionCtx;
    _pretty = false;
    _prettySpace = 2;
    _map;
    _headers;
    _res;
    notFoundHandler;
    constructor(req, env = undefined, executionCtx = undefined, notFoundHandler = ()=>new Response()){
        this._executionCtx = executionCtx;
        this.req = req;
        this.env = env ? env : {};
        this.notFoundHandler = notFoundHandler;
        this.finalized = false;
    }
    get event() {
        if (this._executionCtx instanceof FetchEvent) {
            return this._executionCtx;
        } else {
            throw Error('This context has no FetchEvent');
        }
    }
    get executionCtx() {
        if (this._executionCtx) {
            return this._executionCtx;
        } else {
            throw Error('This context has no ExecutionContext');
        }
    }
    get res() {
        return this._res ||= new Response();
    }
    set res(_res) {
        this._res = _res;
        this.finalized = true;
    }
    header(name, value) {
        this._headers ||= {};
        this._headers[name.toLowerCase()] = value;
        if (this.finalized) {
            this.res.headers.set(name, value);
        }
    }
    status(status) {
        this._status = status;
    }
    set(key, value) {
        this._map ||= {};
        this._map[key] = value;
    }
    get(key) {
        if (!this._map) {
            return undefined;
        }
        return this._map[key];
    }
    pretty(prettyJSON, space = 2) {
        this._pretty = prettyJSON;
        this._prettySpace = space;
    }
    newResponse(data, status, headers = {}) {
        const _headers = {
            ...this._headers
        };
        if (this._res) {
            this._res.headers.forEach((v, k)=>{
                _headers[k] = v;
            });
        }
        return new Response(data, {
            status: status || this._status || 200,
            headers: {
                ..._headers,
                ...headers
            }
        });
    }
    body(data, status = this._status, headers = {}) {
        return this.newResponse(data, status, headers);
    }
    text(text, status = this._status, headers = {}) {
        headers['content-type'] = 'text/plain; charset=UTF-8';
        return this.body(text, status, headers);
    }
    json(object, status = this._status, headers = {}) {
        const body = this._pretty ? JSON.stringify(object, null, this._prettySpace) : JSON.stringify(object);
        headers['content-type'] = 'application/json; charset=UTF-8';
        return this.body(body, status, headers);
    }
    html(html, status = this._status, headers = {}) {
        headers['content-type'] = 'text/html; charset=UTF-8';
        return this.body(html, status, headers);
    }
    redirect(location, status = 302) {
        if (!isAbsoluteURL(location)) {
            const url = new URL(this.req.url);
            url.pathname = location;
            location = url.toString();
        }
        return this.newResponse(null, status, {
            Location: location
        });
    }
    cookie(name, value, opt) {
        const cookie = serialize(name, value, opt);
        this.header('set-cookie', cookie);
    }
    notFound() {
        return this.notFoundHandler(this);
    }
}
const compose1 = (middleware, onError, onNotFound)=>{
    const middlewareLength = middleware.length;
    return (context, next)=>{
        let index = -1;
        return dispatch(0);
        async function dispatch(i) {
            if (i <= index) {
                throw new Error('next() called multiple times');
            }
            let handler = middleware[i];
            index = i;
            if (i === middlewareLength && next) handler = next;
            if (!handler) {
                if (context instanceof HonoContext && context.finalized === false && onNotFound) {
                    context.res = await onNotFound(context);
                }
                return context;
            }
            let res;
            let isError = false;
            try {
                const tmp = handler(context, ()=>dispatch(i + 1));
                res = tmp instanceof Promise ? await tmp : tmp;
            } catch (err) {
                if (context instanceof HonoContext && onError) {
                    if (err instanceof Error) {
                        isError = true;
                        res = onError(err, context);
                    }
                }
                if (!res) {
                    throw err;
                }
            }
            if (res && context instanceof HonoContext && (!context.finalized || isError)) {
                context.res = res;
            }
            return context;
        }
    };
};
const parseBody = async (r)=>{
    const contentType = r.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
        let body = {};
        try {
            body = await r.json();
        } catch  {}
        return body;
    } else if (contentType.includes('application/text')) {
        return await r.text();
    } else if (contentType.startsWith('text')) {
        return await r.text();
    } else if (contentType.includes('form')) {
        const form = {};
        const data = [
            ...await r.formData()
        ].reduce((acc, cur)=>{
            acc[cur[0]] = cur[1];
            return acc;
        }, form);
        return data;
    }
    const arrayBuffer = await r.arrayBuffer();
    return arrayBuffer;
};
function extendRequestPrototype() {
    if (!!Request.prototype.param) {
        return;
    }
    Request.prototype.param = function(key) {
        if (this.paramData) {
            if (key) {
                return this.paramData[key];
            } else {
                return this.paramData;
            }
        }
        return null;
    };
    Request.prototype.header = function(name) {
        if (name) {
            return this.headers.get(name);
        } else {
            const result = {};
            for (const [key, value] of this.headers){
                result[key] = value;
            }
            return result;
        }
    };
    Request.prototype.query = function(key) {
        const url = new URL(this.url);
        if (key) {
            return url.searchParams.get(key);
        } else {
            const result = {};
            for (const key1 of url.searchParams.keys()){
                result[key1] = url.searchParams.get(key1) || '';
            }
            return result;
        }
    };
    Request.prototype.queries = function(key) {
        const url = new URL(this.url);
        if (key) {
            return url.searchParams.getAll(key);
        } else {
            const result = {};
            for (const key1 of url.searchParams.keys()){
                result[key1] = url.searchParams.getAll(key1);
            }
            return result;
        }
    };
    Request.prototype.cookie = function(key) {
        const cookie = this.headers.get('Cookie') || '';
        const obj = parse10(cookie);
        if (key) {
            const value = obj[key];
            return value;
        } else {
            return obj;
        }
    };
    Request.prototype.parseBody = function() {
        if (!this.parsedBody) {
            this.parsedBody = parseBody(this);
        }
        return this.parsedBody;
    };
}
const METHOD_NAME_ALL = 'ALL';
const METHOD_NAME_ALL_LOWERCASE = 'all';
function findParam(node, name) {
    for(let i = 0, len = node.patterns.length; i < len; i++){
        if (typeof node.patterns[i] === 'object' && node.patterns[i][1] === name) {
            return true;
        }
    }
    const nodes = Object.values(node.children);
    for(let i1 = 0, len1 = nodes.length; i1 < len1; i1++){
        if (findParam(nodes[i1], name)) {
            return true;
        }
    }
    return false;
}
class Node {
    methods;
    children;
    patterns;
    order = 0;
    name;
    handlerSetCache;
    constructor(method, handler, children){
        this.children = children || {};
        this.methods = [];
        this.name = '';
        if (method && handler) {
            const m = {};
            m[method] = {
                handler: handler,
                score: 0,
                name: this.name
            };
            this.methods = [
                m
            ];
        }
        this.patterns = [];
        this.handlerSetCache = {};
    }
    insert(method, path, handler) {
        this.name = `${method} ${path}`;
        this.order = ++this.order;
        let curNode = this;
        const parts = splitPath(path);
        const parentPatterns = [];
        const errorMessage = (name)=>{
            return `Duplicate param name, use another name instead of '${name}' - ${method} ${path} <--- '${name}'`;
        };
        for(let i = 0, len = parts.length; i < len; i++){
            const p = parts[i];
            if (Object.keys(curNode.children).includes(p)) {
                parentPatterns.push(...curNode.patterns);
                curNode = curNode.children[p];
                continue;
            }
            curNode.children[p] = new Node();
            const pattern = getPattern(p);
            if (pattern) {
                if (typeof pattern === 'object') {
                    for(let j = 0, len1 = parentPatterns.length; j < len1; j++){
                        if (typeof parentPatterns[j] === 'object' && parentPatterns[j][1] === pattern[1]) {
                            throw new Error(errorMessage(pattern[1]));
                        }
                    }
                    if (Object.values(curNode.children).some((n)=>findParam(n, pattern[1]))) {
                        throw new Error(errorMessage(pattern[1]));
                    }
                }
                curNode.patterns.push(pattern);
                parentPatterns.push(...curNode.patterns);
            }
            parentPatterns.push(...curNode.patterns);
            curNode = curNode.children[p];
        }
        if (!curNode.methods.length) {
            curNode.methods = [];
        }
        const m = {};
        const handlerSet = {
            handler: handler,
            name: this.name,
            score: this.order
        };
        m[method] = handlerSet;
        curNode.methods.push(m);
        return curNode;
    }
    getHandlerSets(node, method, wildcard) {
        return node.handlerSetCache[`${method}:${wildcard ? '1' : '0'}`] ||= (()=>{
            const handlerSets = [];
            node.methods.map((m)=>{
                const handlerSet = m[method] || m[METHOD_NAME_ALL];
                if (handlerSet !== undefined) {
                    const hs = {
                        ...handlerSet
                    };
                    handlerSets.push(hs);
                    return;
                }
            });
            return handlerSets;
        })();
    }
    search(method, path) {
        const handlerSets = [];
        const params = {};
        const curNode = this;
        let curNodes = [
            curNode
        ];
        const parts = splitPath(path);
        for(let i = 0, len = parts.length; i < len; i++){
            const part = parts[i];
            const isLast = i === len - 1;
            const tempNodes = [];
            let matched = false;
            for(let j = 0, len2 = curNodes.length; j < len2; j++){
                const node = curNodes[j];
                const nextNode = node.children[part];
                if (nextNode) {
                    if (isLast === true) {
                        if (nextNode.children['*']) {
                            handlerSets.push(...this.getHandlerSets(nextNode.children['*'], method, true));
                        }
                        handlerSets.push(...this.getHandlerSets(nextNode, method));
                        matched = true;
                    }
                    tempNodes.push(nextNode);
                }
                for(let k = 0, len3 = node.patterns.length; k < len3; k++){
                    const pattern = node.patterns[k];
                    if (pattern === '*') {
                        const astNode = node.children['*'];
                        if (astNode) {
                            handlerSets.push(...this.getHandlerSets(astNode, method));
                            tempNodes.push(astNode);
                        }
                        continue;
                    }
                    if (part === '') continue;
                    const [key, name, matcher] = pattern;
                    if (matcher === true || matcher instanceof RegExp && matcher.test(part)) {
                        if (typeof key === 'string') {
                            if (isLast === true) {
                                handlerSets.push(...this.getHandlerSets(node.children[key], method));
                            }
                            tempNodes.push(node.children[key]);
                        }
                        if (typeof name === 'string' && !matched) {
                            params[name] = part;
                        }
                    }
                }
            }
            curNodes = tempNodes;
        }
        if (handlerSets.length <= 0) return null;
        const handlers = handlerSets.sort((a, b)=>{
            return a.score - b.score;
        }).map((s)=>{
            return s.handler;
        });
        return {
            handlers,
            params
        };
    }
}
class TrieRouter {
    node;
    constructor(){
        this.node = new Node();
    }
    add(method, path, handler) {
        this.node.insert(method, path, handler);
    }
    match(method, path) {
        return this.node.search(method, path);
    }
}
const methods = [
    'get',
    'post',
    'put',
    'delete',
    'head',
    'options',
    'patch'
];
function defineDynamicClass() {
    return class {
    };
}
class Hono extends defineDynamicClass() {
    router = new TrieRouter();
    strict = true;
    _tempPath = '';
    path = '/';
    routes = [];
    constructor(init = {}){
        super();
        extendRequestPrototype();
        const allMethods = [
            ...methods,
            METHOD_NAME_ALL_LOWERCASE
        ];
        allMethods.map((method)=>{
            this[method] = (args1, ...args)=>{
                if (typeof args1 === 'string') {
                    this.path = args1;
                } else {
                    this.addRoute(method, this.path, args1);
                }
                args.map((handler)=>{
                    if (typeof handler !== 'string') {
                        this.addRoute(method, this.path, handler);
                    }
                });
                return this;
            };
        });
        Object.assign(this, init);
    }
    notFoundHandler = (c)=>{
        const message = '404 Not Found';
        return c.text(message, 404);
    };
    errorHandler = (err, c)=>{
        console.error(`${err.stack || err.message}`);
        const message = 'Internal Server Error';
        return c.text(message, 500);
    };
    route(path, app) {
        this._tempPath = path;
        if (app) {
            app.routes.map((r)=>{
                this.addRoute(r.method, r.path, r.handler);
            });
            this._tempPath = '';
        }
        return this;
    }
    use(arg1, ...handlers) {
        if (typeof arg1 === 'string') {
            this.path = arg1;
        } else {
            handlers.unshift(arg1);
        }
        handlers.map((handler)=>{
            this.addRoute(METHOD_NAME_ALL, this.path, handler);
        });
        return this;
    }
    onError(handler) {
        this.errorHandler = handler;
        return this;
    }
    notFound(handler) {
        this.notFoundHandler = handler;
        return this;
    }
    addRoute(method, path, handler) {
        method = method.toUpperCase();
        if (this._tempPath) {
            path = mergePath(this._tempPath, path);
        }
        this.router.add(method, path, handler);
        const r = {
            path: path,
            method: method,
            handler: handler
        };
        this.routes.push(r);
    }
    matchRoute(method, path) {
        return this.router.match(method, path);
    }
    async dispatch(request, eventOrExecutionCtx, env) {
        const path = getPathFromURL(request.url, this.strict);
        const method = request.method;
        const result = this.matchRoute(method, path);
        request.paramData = result?.params;
        const handlers = result ? result.handlers : [
            this.notFoundHandler
        ];
        const c = new HonoContext(request, env, eventOrExecutionCtx, this.notFoundHandler);
        const composed = compose1(handlers, this.errorHandler, this.notFoundHandler);
        let context;
        try {
            context = await composed(c);
            if (!context.finalized) {
                throw new Error('Context is not finalized. You may forget returning Response object or `await next()`');
            }
        } catch (err) {
            if (err instanceof Error) {
                return this.errorHandler(err, c);
            }
            throw err;
        }
        return context.res;
    }
    handleEvent(event) {
        return this.dispatch(event.request, event);
    }
    fetch = (request, env, executionCtx)=>{
        return this.dispatch(request, executionCtx, env);
    };
    request(input, requestInit) {
        const req = input instanceof Request ? input : new Request(input, requestInit);
        return this.dispatch(req);
    }
}
const LABEL_REG_EXP_STR = '[^/]+';
const ONLY_WILDCARD_REG_EXP_STR = '.*';
const TAIL_WILDCARD_REG_EXP_STR = '(?:|/.*)';
function compareKey(a, b) {
    if (a.length === 1) {
        return b.length === 1 ? a < b ? -1 : 1 : -1;
    }
    if (b.length === 1) {
        return 1;
    }
    if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
        return 1;
    } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
        return -1;
    }
    if (a === LABEL_REG_EXP_STR) {
        return 1;
    } else if (b === LABEL_REG_EXP_STR) {
        return -1;
    }
    return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
class Node1 {
    index;
    varIndex;
    children = {};
    reverse;
    constructor({ reverse  } = {
        reverse: false
    }){
        this.reverse = reverse;
    }
    newChildNode() {
        return new Node1({
            reverse: this.reverse
        });
    }
    insert(tokens, index, paramMap, context) {
        if (tokens.length === 0) {
            this.index = index;
            return;
        }
        const [token, ...restTokens] = tokens;
        const pattern = token === '*' ? restTokens.length === 0 ? [
            '',
            '',
            ONLY_WILDCARD_REG_EXP_STR
        ] : [
            '',
            '',
            LABEL_REG_EXP_STR
        ] : token === '/*' ? [
            '',
            '',
            TAIL_WILDCARD_REG_EXP_STR
        ] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
        let node;
        if (pattern) {
            const name = pattern[1];
            const regexpStr = pattern[2] || LABEL_REG_EXP_STR;
            node = this.children[regexpStr];
            if (!node) {
                node = this.children[regexpStr] = this.newChildNode();
                if (name !== '') {
                    node.varIndex = context.varIndex++;
                }
            }
            if (name !== '') {
                paramMap.push([
                    name,
                    node.varIndex
                ]);
            }
        } else {
            node = this.children[token] ||= this.newChildNode();
        }
        node.insert(restTokens, index, paramMap, context);
    }
    buildRegExpStr() {
        let childKeys = Object.keys(this.children).sort(compareKey);
        if (this.reverse) {
            childKeys = childKeys.reverse();
        }
        const strList = childKeys.map((k)=>{
            const c = this.children[k];
            return (typeof c.varIndex === 'number' ? `(${k})@${c.varIndex}` : k) + c.buildRegExpStr();
        });
        if (typeof this.index === 'number') {
            strList.unshift(`#${this.index}`);
        }
        if (strList.length === 0) {
            return '';
        }
        if (strList.length === 1) {
            return strList[0];
        }
        return '(?:' + strList.join('|') + ')';
    }
}
const createHash = async (data, algorithm)=>{
    let sourceBuffer;
    if (data instanceof ReadableStream) {
        let body = '';
        const reader = data.getReader();
        await reader?.read().then(async (chuck)=>{
            const value = await createHash(chuck.value || '', algorithm);
            body += value;
        });
        return body;
    }
    if (ArrayBuffer.isView(data) || data instanceof ArrayBuffer) {
        sourceBuffer = data;
    } else {
        if (typeof data === 'object') {
            data = JSON.stringify(data);
        }
        sourceBuffer = new TextEncoder().encode(String(data));
    }
    if (crypto && crypto.subtle) {
        const buffer = await crypto.subtle.digest({
            name: algorithm.name
        }, sourceBuffer);
        const hash = Array.prototype.map.call(new Uint8Array(buffer), (x)=>('00' + x.toString(16)).slice(-2)).join('');
        return hash;
    }
    return null;
};
const hexTable1 = new TextEncoder().encode("0123456789abcdef");
function errInvalidByte(__byte) {
    return new Error("encoding/hex: invalid byte: " + new TextDecoder().decode(new Uint8Array([
        __byte
    ])));
}
function errLength() {
    return new Error("encoding/hex: odd length hex string");
}
function fromHexChar(__byte) {
    if (48 <= __byte && __byte <= 57) return __byte - 48;
    if (97 <= __byte && __byte <= 102) return __byte - 97 + 10;
    if (65 <= __byte && __byte <= 70) return __byte - 65 + 10;
    throw errInvalidByte(__byte);
}
function encodedLen(n) {
    return n * 2;
}
function encode4(src) {
    const dst = new Uint8Array(encodedLen(src.length));
    for(let i = 0; i < dst.length; i++){
        const v = src[i];
        dst[i * 2] = hexTable1[v >> 4];
        dst[i * 2 + 1] = hexTable1[v & 0x0f];
    }
    return dst;
}
function encodeToString(src) {
    return new TextDecoder().decode(encode4(src));
}
function decode3(src) {
    const dst = new Uint8Array(decodedLen(src.length));
    for(let i = 0; i < dst.length; i++){
        const a = fromHexChar(src[i * 2]);
        const b = fromHexChar(src[i * 2 + 1]);
        dst[i] = a << 4 | b;
    }
    if (src.length % 2 == 1) {
        fromHexChar(src[dst.length * 2]);
        throw errLength();
    }
    return dst;
}
function decodedLen(x) {
    return x >>> 1;
}
function decodeString(s) {
    return decode3(new TextEncoder().encode(s));
}
const base64abc1 = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "+",
    "/"
];
function encode5(data) {
    const uint8 = typeof data === "string" ? new TextEncoder().encode(data) : data instanceof Uint8Array ? data : new Uint8Array(data);
    let result = "", i;
    const l = uint8.length;
    for(i = 2; i < l; i += 3){
        result += base64abc1[uint8[i - 2] >> 2];
        result += base64abc1[(uint8[i - 2] & 0x03) << 4 | uint8[i - 1] >> 4];
        result += base64abc1[(uint8[i - 1] & 0x0f) << 2 | uint8[i] >> 6];
        result += base64abc1[uint8[i] & 0x3f];
    }
    if (i === l + 1) {
        result += base64abc1[uint8[i - 2] >> 2];
        result += base64abc1[(uint8[i - 2] & 0x03) << 4];
        result += "==";
    }
    if (i === l) {
        result += base64abc1[uint8[i - 2] >> 2];
        result += base64abc1[(uint8[i - 2] & 0x03) << 4 | uint8[i - 1] >> 4];
        result += base64abc1[(uint8[i - 1] & 0x0f) << 2];
        result += "=";
    }
    return result;
}
function decode4(b64) {
    const binString = atob(b64);
    const size = binString.length;
    const bytes = new Uint8Array(size);
    for(let i = 0; i < size; i++){
        bytes[i] = binString.charCodeAt(i);
    }
    return bytes;
}
globalThis.Deno?.noColor ?? true;
new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))", 
].join("|"), "g");
var DiffType1;
(function(DiffType) {
    DiffType["removed"] = "removed";
    DiffType["common"] = "common";
    DiffType["added"] = "added";
})(DiffType1 || (DiffType1 = {}));
function notImplemented(msg) {
    const message = msg ? `Not implemented: ${msg}` : "Not implemented";
    throw new Error(message);
}
TextDecoder;
TextEncoder;
function normalizeEncoding1(enc) {
    if (enc == null || enc === "utf8" || enc === "utf-8") return "utf8";
    return slowCases1(enc);
}
function slowCases1(enc) {
    switch(enc.length){
        case 4:
            if (enc === "UTF8") return "utf8";
            if (enc === "ucs2" || enc === "UCS2") return "utf16le";
            enc = `${enc}`.toLowerCase();
            if (enc === "utf8") return "utf8";
            if (enc === "ucs2") return "utf16le";
            break;
        case 3:
            if (enc === "hex" || enc === "HEX" || `${enc}`.toLowerCase() === "hex") {
                return "hex";
            }
            break;
        case 5:
            if (enc === "ascii") return "ascii";
            if (enc === "ucs-2") return "utf16le";
            if (enc === "UTF-8") return "utf8";
            if (enc === "ASCII") return "ascii";
            if (enc === "UCS-2") return "utf16le";
            enc = `${enc}`.toLowerCase();
            if (enc === "utf-8") return "utf8";
            if (enc === "ascii") return "ascii";
            if (enc === "ucs-2") return "utf16le";
            break;
        case 6:
            if (enc === "base64") return "base64";
            if (enc === "latin1" || enc === "binary") return "latin1";
            if (enc === "BASE64") return "base64";
            if (enc === "LATIN1" || enc === "BINARY") return "latin1";
            enc = `${enc}`.toLowerCase();
            if (enc === "base64") return "base64";
            if (enc === "latin1" || enc === "binary") return "latin1";
            break;
        case 7:
            if (enc === "utf16le" || enc === "UTF16LE" || `${enc}`.toLowerCase() === "utf16le") {
                return "utf16le";
            }
            break;
        case 8:
            if (enc === "utf-16le" || enc === "UTF-16LE" || `${enc}`.toLowerCase() === "utf-16le") {
                return "utf16le";
            }
            break;
        default:
            if (enc === "") return "utf8";
    }
}
const notImplementedEncodings = [
    "ascii",
    "binary",
    "latin1",
    "ucs2",
    "utf16le", 
];
function checkEncoding(encoding = "utf8", strict = true) {
    if (typeof encoding !== "string" || strict && encoding === "") {
        if (!strict) return "utf8";
        throw new TypeError(`Unkown encoding: ${encoding}`);
    }
    const normalized = normalizeEncoding1(encoding);
    if (normalized === undefined) {
        throw new TypeError(`Unkown encoding: ${encoding}`);
    }
    if (notImplementedEncodings.includes(encoding)) {
        notImplemented(`"${encoding}" encoding`);
    }
    return normalized;
}
const encodingOps1 = {
    utf8: {
        byteLength: (string)=>new TextEncoder().encode(string).byteLength
    },
    ucs2: {
        byteLength: (string)=>string.length * 2
    },
    utf16le: {
        byteLength: (string)=>string.length * 2
    },
    latin1: {
        byteLength: (string)=>string.length
    },
    ascii: {
        byteLength: (string)=>string.length
    },
    base64: {
        byteLength: (string)=>base64ByteLength1(string, string.length)
    },
    hex: {
        byteLength: (string)=>string.length >>> 1
    }
};
function base64ByteLength1(str, bytes) {
    if (str.charCodeAt(bytes - 1) === 0x3d) bytes--;
    if (bytes > 1 && str.charCodeAt(bytes - 1) === 0x3d) bytes--;
    return bytes * 3 >>> 2;
}
class Buffer1 extends Uint8Array {
    static alloc(size, fill, encoding = "utf8") {
        if (typeof size !== "number") {
            throw new TypeError(`The "size" argument must be of type number. Received type ${typeof size}`);
        }
        const buf = new Buffer1(size);
        if (size === 0) return buf;
        let bufFill;
        if (typeof fill === "string") {
            const clearEncoding = checkEncoding(encoding);
            if (typeof fill === "string" && fill.length === 1 && clearEncoding === "utf8") {
                buf.fill(fill.charCodeAt(0));
            } else bufFill = Buffer1.from(fill, clearEncoding);
        } else if (typeof fill === "number") {
            buf.fill(fill);
        } else if (fill instanceof Uint8Array) {
            if (fill.length === 0) {
                throw new TypeError(`The argument "value" is invalid. Received ${fill.constructor.name} []`);
            }
            bufFill = fill;
        }
        if (bufFill) {
            if (bufFill.length > buf.length) {
                bufFill = bufFill.subarray(0, buf.length);
            }
            let offset = 0;
            while(offset < size){
                buf.set(bufFill, offset);
                offset += bufFill.length;
                if (offset + bufFill.length >= size) break;
            }
            if (offset !== size) {
                buf.set(bufFill.subarray(0, size - offset), offset);
            }
        }
        return buf;
    }
    static allocUnsafe(size) {
        return new Buffer1(size);
    }
    static byteLength(string, encoding = "utf8") {
        if (typeof string != "string") return string.byteLength;
        encoding = normalizeEncoding1(encoding) || "utf8";
        return encodingOps1[encoding].byteLength(string);
    }
    static concat(list, totalLength) {
        if (totalLength == undefined) {
            totalLength = 0;
            for (const buf of list){
                totalLength += buf.length;
            }
        }
        const buffer = Buffer1.allocUnsafe(totalLength);
        let pos = 0;
        for (const item of list){
            let buf1;
            if (!(item instanceof Buffer1)) {
                buf1 = Buffer1.from(item);
            } else {
                buf1 = item;
            }
            buf1.copy(buffer, pos);
            pos += buf1.length;
        }
        return buffer;
    }
    static from(value, offsetOrEncoding, length) {
        const offset = typeof offsetOrEncoding === "string" ? undefined : offsetOrEncoding;
        let encoding = typeof offsetOrEncoding === "string" ? offsetOrEncoding : undefined;
        if (typeof value == "string") {
            encoding = checkEncoding(encoding, false);
            if (encoding === "hex") return new Buffer1(decodeString(value).buffer);
            if (encoding === "base64") return new Buffer1(decode4(value).buffer);
            return new Buffer1(new TextEncoder().encode(value).buffer);
        }
        return new Buffer1(value, offset, length);
    }
    static isBuffer(obj) {
        return obj instanceof Buffer1;
    }
    static isEncoding(encoding) {
        return typeof encoding === "string" && encoding.length !== 0 && normalizeEncoding1(encoding) !== undefined;
    }
    copy(targetBuffer, targetStart = 0, sourceStart = 0, sourceEnd = this.length) {
        const sourceBuffer = this.subarray(sourceStart, sourceEnd).subarray(0, Math.max(0, targetBuffer.length - targetStart));
        if (sourceBuffer.length === 0) return 0;
        targetBuffer.set(sourceBuffer, targetStart);
        return sourceBuffer.length;
    }
    equals(otherBuffer) {
        if (!(otherBuffer instanceof Uint8Array)) {
            throw new TypeError(`The "otherBuffer" argument must be an instance of Buffer or Uint8Array. Received type ${typeof otherBuffer}`);
        }
        if (this === otherBuffer) return true;
        if (this.byteLength !== otherBuffer.byteLength) return false;
        for(let i = 0; i < this.length; i++){
            if (this[i] !== otherBuffer[i]) return false;
        }
        return true;
    }
    readBigInt64BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getBigInt64(offset);
    }
    readBigInt64LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getBigInt64(offset, true);
    }
    readBigUInt64BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getBigUint64(offset);
    }
    readBigUInt64LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getBigUint64(offset, true);
    }
    readDoubleBE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat64(offset);
    }
    readDoubleLE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat64(offset, true);
    }
    readFloatBE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat32(offset);
    }
    readFloatLE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat32(offset, true);
    }
    readInt8(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt8(offset);
    }
    readInt16BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt16(offset);
    }
    readInt16LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt16(offset, true);
    }
    readInt32BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt32(offset);
    }
    readInt32LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt32(offset, true);
    }
    readUInt8(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint8(offset);
    }
    readUInt16BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint16(offset);
    }
    readUInt16LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint16(offset, true);
    }
    readUInt32BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint32(offset);
    }
    readUInt32LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint32(offset, true);
    }
    slice(begin = 0, end = this.length) {
        return this.subarray(begin, end);
    }
    toJSON() {
        return {
            type: "Buffer",
            data: Array.from(this)
        };
    }
    toString(encoding = "utf8", start = 0, end = this.length) {
        encoding = checkEncoding(encoding);
        const b = this.subarray(start, end);
        if (encoding === "hex") return encodeToString(b);
        if (encoding === "base64") return encode5(b.buffer);
        return new TextDecoder(encoding).decode(b);
    }
    write(string, offset = 0, length = this.length) {
        return new TextEncoder().encodeInto(string, this.subarray(offset, offset + length)).written;
    }
    writeBigInt64BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setBigInt64(offset, value);
        return offset + 4;
    }
    writeBigInt64LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setBigInt64(offset, value, true);
        return offset + 4;
    }
    writeBigUInt64BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setBigUint64(offset, value);
        return offset + 4;
    }
    writeBigUInt64LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setBigUint64(offset, value, true);
        return offset + 4;
    }
    writeDoubleBE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat64(offset, value);
        return offset + 8;
    }
    writeDoubleLE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat64(offset, value, true);
        return offset + 8;
    }
    writeFloatBE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat32(offset, value);
        return offset + 4;
    }
    writeFloatLE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat32(offset, value, true);
        return offset + 4;
    }
    writeInt8(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setInt8(offset, value);
        return offset + 1;
    }
    writeInt16BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setInt16(offset, value);
        return offset + 2;
    }
    writeInt16LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setInt16(offset, value, true);
        return offset + 2;
    }
    writeInt32BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint32(offset, value);
        return offset + 4;
    }
    writeInt32LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setInt32(offset, value, true);
        return offset + 4;
    }
    writeUInt8(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint8(offset, value);
        return offset + 1;
    }
    writeUInt16BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint16(offset, value);
        return offset + 2;
    }
    writeUInt16LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint16(offset, value, true);
        return offset + 2;
    }
    writeUInt32BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint32(offset, value);
        return offset + 4;
    }
    writeUInt32LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint32(offset, value, true);
        return offset + 4;
    }
}
const cors = (options)=>{
    const defaults = {
        origin: '*',
        allowMethods: [
            'GET',
            'HEAD',
            'PUT',
            'POST',
            'DELETE',
            'PATCH'
        ],
        allowHeaders: [],
        exposeHeaders: []
    };
    const opts = {
        ...defaults,
        ...options
    };
    return async (c, next)=>{
        await next();
        function set(key, value) {
            c.res.headers.append(key, value);
        }
        set('Access-Control-Allow-Origin', opts.origin);
        if (opts.origin !== '*') {
            set('Vary', 'Origin');
        }
        if (opts.credentials) {
            set('Access-Control-Allow-Credentials', 'true');
        }
        if (opts.exposeHeaders?.length) {
            set('Access-Control-Expose-Headers', opts.exposeHeaders.join(','));
        }
        if (c.req.method === 'OPTIONS') {
            if (opts.maxAge != null) {
                set('Access-Control-Max-Age', opts.maxAge.toString());
            }
            if (opts.allowMethods?.length) {
                set('Access-Control-Allow-Methods', opts.allowMethods.join(','));
            }
            let headers = opts.allowHeaders;
            if (!headers?.length) {
                const requestHeaders = c.req.headers.get('Access-Control-Request-Headers');
                if (requestHeaders) {
                    headers = requestHeaders.split(/\s*,\s*/);
                }
            }
            if (headers?.length) {
                set('Access-Control-Allow-Headers', headers.join(','));
                set('Vary', 'Access-Control-Request-Headers');
            }
            c.res.headers.delete('Content-Length');
            c.res.headers.delete('Content-Type');
            c.res = new Response(null, {
                headers: c.res.headers,
                status: 204,
                statusText: c.res.statusText
            });
        }
    };
};
const escapeRe = /[&<>"]/;
const escapeToBuffer = (str, buffer)=>{
    const match = str.search(escapeRe);
    if (match === -1) {
        buffer[0] += str;
        return;
    }
    let escape;
    let index;
    let lastIndex = 0;
    for(index = match; index < str.length; index++){
        switch(str.charCodeAt(index)){
            case 34:
                escape = '&quot;';
                break;
            case 38:
                escape = '&amp;';
                break;
            case 60:
                escape = '&lt;';
                break;
            case 62:
                escape = '&gt;';
                break;
            default:
                continue;
        }
        buffer[0] += str.substring(lastIndex, index) + escape;
        lastIndex = index + 1;
    }
    buffer[0] += str.substring(lastIndex, index);
};
const emptyTags = [
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'keygen',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr', 
];
const booleanAttributes = [
    'allowfullscreen',
    'async',
    'autofocus',
    'autoplay',
    'checked',
    'controls',
    'default',
    'defer',
    'disabled',
    'formnovalidate',
    'hidden',
    'inert',
    'ismap',
    'itemscope',
    'loop',
    'multiple',
    'muted',
    'nomodule',
    'novalidate',
    'open',
    'playsinline',
    'readonly',
    'required',
    'reversed',
    'selected', 
];
const childrenToStringToBuffer = (children, buffer)=>{
    for(let i = 0, len = children.length; i < len; i++){
        const child = children[i];
        if (typeof child === 'string') {
            escapeToBuffer(child, buffer);
        } else if (typeof child === 'boolean' || child === null || child === undefined) {
            continue;
        } else if (child instanceof JSXNode) {
            child.toStringToBuffer(buffer);
        } else if (typeof child === 'number' || child.isEscaped) {
            buffer[0] += child;
        } else {
            childrenToStringToBuffer(child, buffer);
        }
    }
};
class JSXNode {
    tag;
    props;
    children;
    isEscaped = true;
    constructor(tag, props, children){
        this.tag = tag;
        this.props = props;
        this.children = children;
    }
    toString() {
        const buffer = [
            ''
        ];
        this.toStringToBuffer(buffer);
        return buffer[0];
    }
    toStringToBuffer(buffer) {
        const tag = this.tag;
        const props = this.props;
        let { children  } = this;
        buffer[0] += `<${tag}`;
        const propsKeys = Object.keys(props || {});
        for(let i = 0, len = propsKeys.length; i < len; i++){
            const v = props[propsKeys[i]];
            if (typeof v === 'string') {
                buffer[0] += ` ${propsKeys[i]}="`;
                escapeToBuffer(v, buffer);
                buffer[0] += '"';
            } else if (typeof v === 'number') {
                buffer[0] += ` ${propsKeys[i]}="${v}"`;
            } else if (v === null || v === undefined) {} else if (typeof v === 'boolean' && booleanAttributes.includes(propsKeys[i])) {
                if (v) {
                    buffer[0] += ` ${propsKeys[i]}=""`;
                }
            } else if (propsKeys[i] === 'dangerouslySetInnerHTML') {
                if (children.length > 0) {
                    throw 'Can only set one of `children` or `props.dangerouslySetInnerHTML`.';
                }
                const escapedString = new String(v.__html);
                escapedString.isEscaped = true;
                children = [
                    escapedString
                ];
            } else {
                buffer[0] += ` ${propsKeys[i]}="`;
                escapeToBuffer(v.toString(), buffer);
                buffer[0] += '"';
            }
        }
        if (emptyTags.includes(tag)) {
            buffer[0] += '/>';
            return;
        }
        buffer[0] += '>';
        childrenToStringToBuffer(children, buffer);
        buffer[0] += `</${tag}>`;
    }
}
var AlgorithmTypes;
(function(AlgorithmTypes) {
    AlgorithmTypes["HS256"] = "HS256";
    AlgorithmTypes["HS384"] = "HS384";
    AlgorithmTypes["HS512"] = "HS512";
})(AlgorithmTypes || (AlgorithmTypes = {}));
var CryptoKeyFormat;
(function(CryptoKeyFormat) {
    CryptoKeyFormat["RAW"] = 'raw';
    CryptoKeyFormat["PKCS8"] = 'pkcs8';
    CryptoKeyFormat["SPKI"] = 'spki';
    CryptoKeyFormat["JWK"] = 'jwk';
})(CryptoKeyFormat || (CryptoKeyFormat = {}));
var CryptoKeyUsage;
(function(CryptoKeyUsage) {
    CryptoKeyUsage["Ecrypt"] = 'encrypt';
    CryptoKeyUsage["Decrypt"] = 'decrypt';
    CryptoKeyUsage["Sign"] = 'sign';
    CryptoKeyUsage["Verify"] = 'verify';
    CryptoKeyUsage["Deriverkey"] = 'deriveKey';
    CryptoKeyUsage["DeriveBits"] = 'deriveBits';
    CryptoKeyUsage["WrapKey"] = 'wrapKey';
    CryptoKeyUsage["UnwrapKey"] = 'unwrapKey';
})(CryptoKeyUsage || (CryptoKeyUsage = {}));
var LogPrefix;
(function(LogPrefix) {
    LogPrefix["Outgoing"] = '-->';
    LogPrefix["Incoming"] = '<--';
    LogPrefix["Error"] = 'xxx';
})(LogPrefix || (LogPrefix = {}));
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function createCommonjsModule(fn, basedir, module1) {
    return module1 = {
        path: basedir,
        exports: {},
        require: function(path, base) {
            return commonjsRequire(path, base === void 0 || base === null ? module1.path : base);
        }
    }, fn(module1, module1.exports), module1.exports;
}
function getDefaultExportFromNamespaceIfNotNamed(n) {
    return n && Object.prototype.hasOwnProperty.call(n, "default") && Object.keys(n).length === 1 ? n["default"] : n;
}
function commonjsRequire() {
    throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs");
}
var alea = createCommonjsModule(function(module1) {
    (function(global2, module2, define1) {
        function Alea(seed) {
            var me = this, mash = Mash();
            me.next = function() {
                var t = 2091639 * me.s0 + me.c * 23283064365386963e-26;
                me.s0 = me.s1;
                me.s1 = me.s2;
                return me.s2 = t - (me.c = t | 0);
            };
            me.c = 1;
            me.s0 = mash(" ");
            me.s1 = mash(" ");
            me.s2 = mash(" ");
            me.s0 -= mash(seed);
            if (me.s0 < 0) {
                me.s0 += 1;
            }
            me.s1 -= mash(seed);
            if (me.s1 < 0) {
                me.s1 += 1;
            }
            me.s2 -= mash(seed);
            if (me.s2 < 0) {
                me.s2 += 1;
            }
            mash = null;
        }
        function copy(f, t) {
            t.c = f.c;
            t.s0 = f.s0;
            t.s1 = f.s1;
            t.s2 = f.s2;
            return t;
        }
        function impl(seed, opts) {
            var xg = new Alea(seed), state = opts && opts.state, prng = xg.next;
            prng.int32 = function() {
                return xg.next() * 4294967296 | 0;
            };
            prng.double = function() {
                return prng() + (prng() * 2097152 | 0) * 11102230246251565e-32;
            };
            prng.quick = prng;
            if (state) {
                if (typeof state == "object") copy(state, xg);
                prng.state = function() {
                    return copy(xg, {});
                };
            }
            return prng;
        }
        function Mash() {
            var n = 4022871197;
            var mash = function(data) {
                data = String(data);
                for(var i = 0; i < data.length; i++){
                    n += data.charCodeAt(i);
                    var h = 0.02519603282416938 * n;
                    n = h >>> 0;
                    h -= n;
                    h *= n;
                    n = h >>> 0;
                    h -= n;
                    n += h * 4294967296;
                }
                return (n >>> 0) * 23283064365386963e-26;
            };
            return mash;
        }
        if (module2 && module2.exports) {
            module2.exports = impl;
        } else if (define1 && define1.amd) {
            define1(function() {
                return impl;
            });
        } else {
            this.alea = impl;
        }
    })(commonjsGlobal, module1, false);
});
var xor128 = createCommonjsModule(function(module1) {
    (function(global2, module2, define1) {
        function XorGen(seed) {
            var me = this, strseed = "";
            me.x = 0;
            me.y = 0;
            me.z = 0;
            me.w = 0;
            me.next = function() {
                var t = me.x ^ me.x << 11;
                me.x = me.y;
                me.y = me.z;
                me.z = me.w;
                return me.w ^= me.w >>> 19 ^ t ^ t >>> 8;
            };
            if (seed === (seed | 0)) {
                me.x = seed;
            } else {
                strseed += seed;
            }
            for(var k = 0; k < strseed.length + 64; k++){
                me.x ^= strseed.charCodeAt(k) | 0;
                me.next();
            }
        }
        function copy(f, t) {
            t.x = f.x;
            t.y = f.y;
            t.z = f.z;
            t.w = f.w;
            return t;
        }
        function impl(seed, opts) {
            var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
                return (xg.next() >>> 0) / 4294967296;
            };
            prng.double = function() {
                do {
                    var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
                }while (result === 0)
                return result;
            };
            prng.int32 = xg.next;
            prng.quick = prng;
            if (state) {
                if (typeof state == "object") copy(state, xg);
                prng.state = function() {
                    return copy(xg, {});
                };
            }
            return prng;
        }
        if (module2 && module2.exports) {
            module2.exports = impl;
        } else if (define1 && define1.amd) {
            define1(function() {
                return impl;
            });
        } else {
            this.xor128 = impl;
        }
    })(commonjsGlobal, module1, false);
});
var xorwow = createCommonjsModule(function(module1) {
    (function(global2, module2, define1) {
        function XorGen(seed) {
            var me = this, strseed = "";
            me.next = function() {
                var t = me.x ^ me.x >>> 2;
                me.x = me.y;
                me.y = me.z;
                me.z = me.w;
                me.w = me.v;
                return (me.d = me.d + 362437 | 0) + (me.v = me.v ^ me.v << 4 ^ (t ^ t << 1)) | 0;
            };
            me.x = 0;
            me.y = 0;
            me.z = 0;
            me.w = 0;
            me.v = 0;
            if (seed === (seed | 0)) {
                me.x = seed;
            } else {
                strseed += seed;
            }
            for(var k = 0; k < strseed.length + 64; k++){
                me.x ^= strseed.charCodeAt(k) | 0;
                if (k == strseed.length) {
                    me.d = me.x << 10 ^ me.x >>> 4;
                }
                me.next();
            }
        }
        function copy(f, t) {
            t.x = f.x;
            t.y = f.y;
            t.z = f.z;
            t.w = f.w;
            t.v = f.v;
            t.d = f.d;
            return t;
        }
        function impl(seed, opts) {
            var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
                return (xg.next() >>> 0) / 4294967296;
            };
            prng.double = function() {
                do {
                    var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
                }while (result === 0)
                return result;
            };
            prng.int32 = xg.next;
            prng.quick = prng;
            if (state) {
                if (typeof state == "object") copy(state, xg);
                prng.state = function() {
                    return copy(xg, {});
                };
            }
            return prng;
        }
        if (module2 && module2.exports) {
            module2.exports = impl;
        } else if (define1 && define1.amd) {
            define1(function() {
                return impl;
            });
        } else {
            this.xorwow = impl;
        }
    })(commonjsGlobal, module1, false);
});
var xorshift7 = createCommonjsModule(function(module1) {
    (function(global2, module2, define1) {
        function XorGen(seed) {
            var me = this;
            me.next = function() {
                var X = me.x, i = me.i, t, v;
                t = X[i];
                t ^= t >>> 7;
                v = t ^ t << 24;
                t = X[i + 1 & 7];
                v ^= t ^ t >>> 10;
                t = X[i + 3 & 7];
                v ^= t ^ t >>> 3;
                t = X[i + 4 & 7];
                v ^= t ^ t << 7;
                t = X[i + 7 & 7];
                t = t ^ t << 13;
                v ^= t ^ t << 9;
                X[i] = v;
                me.i = i + 1 & 7;
                return v;
            };
            function init(me2, seed2) {
                var j, w, X = [];
                if (seed2 === (seed2 | 0)) {
                    w = X[0] = seed2;
                } else {
                    seed2 = "" + seed2;
                    for(j = 0; j < seed2.length; ++j){
                        X[j & 7] = X[j & 7] << 15 ^ seed2.charCodeAt(j) + X[j + 1 & 7] << 13;
                    }
                }
                while(X.length < 8)X.push(0);
                for(j = 0; j < 8 && X[j] === 0; ++j);
                if (j == 8) w = X[7] = -1;
                else w = X[j];
                me2.x = X;
                me2.i = 0;
                for(j = 256; j > 0; --j){
                    me2.next();
                }
            }
            init(me, seed);
        }
        function copy(f, t) {
            t.x = f.x.slice();
            t.i = f.i;
            return t;
        }
        function impl(seed, opts) {
            if (seed == null) seed = +new Date();
            var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
                return (xg.next() >>> 0) / 4294967296;
            };
            prng.double = function() {
                do {
                    var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
                }while (result === 0)
                return result;
            };
            prng.int32 = xg.next;
            prng.quick = prng;
            if (state) {
                if (state.x) copy(state, xg);
                prng.state = function() {
                    return copy(xg, {});
                };
            }
            return prng;
        }
        if (module2 && module2.exports) {
            module2.exports = impl;
        } else if (define1 && define1.amd) {
            define1(function() {
                return impl;
            });
        } else {
            this.xorshift7 = impl;
        }
    })(commonjsGlobal, module1, false);
});
var xor4096 = createCommonjsModule(function(module1) {
    (function(global2, module2, define1) {
        function XorGen(seed) {
            var me = this;
            me.next = function() {
                var w = me.w, X = me.X, i = me.i, t, v;
                me.w = w = w + 1640531527 | 0;
                v = X[i + 34 & 127];
                t = X[i = i + 1 & 127];
                v ^= v << 13;
                t ^= t << 17;
                v ^= v >>> 15;
                t ^= t >>> 12;
                v = X[i] = v ^ t;
                me.i = i;
                return v + (w ^ w >>> 16) | 0;
            };
            function init(me2, seed2) {
                var t, v, i, j, w, X = [], limit = 128;
                if (seed2 === (seed2 | 0)) {
                    v = seed2;
                    seed2 = null;
                } else {
                    seed2 = seed2 + "\0";
                    v = 0;
                    limit = Math.max(limit, seed2.length);
                }
                for(i = 0, j = -32; j < limit; ++j){
                    if (seed2) v ^= seed2.charCodeAt((j + 32) % seed2.length);
                    if (j === 0) w = v;
                    v ^= v << 10;
                    v ^= v >>> 15;
                    v ^= v << 4;
                    v ^= v >>> 13;
                    if (j >= 0) {
                        w = w + 1640531527 | 0;
                        t = X[j & 127] ^= v + w;
                        i = t == 0 ? i + 1 : 0;
                    }
                }
                if (i >= 128) {
                    X[(seed2 && seed2.length || 0) & 127] = -1;
                }
                i = 127;
                for(j = 4 * 128; j > 0; --j){
                    v = X[i + 34 & 127];
                    t = X[i = i + 1 & 127];
                    v ^= v << 13;
                    t ^= t << 17;
                    v ^= v >>> 15;
                    t ^= t >>> 12;
                    X[i] = v ^ t;
                }
                me2.w = w;
                me2.X = X;
                me2.i = i;
            }
            init(me, seed);
        }
        function copy(f, t) {
            t.i = f.i;
            t.w = f.w;
            t.X = f.X.slice();
            return t;
        }
        function impl(seed, opts) {
            if (seed == null) seed = +new Date();
            var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
                return (xg.next() >>> 0) / 4294967296;
            };
            prng.double = function() {
                do {
                    var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
                }while (result === 0)
                return result;
            };
            prng.int32 = xg.next;
            prng.quick = prng;
            if (state) {
                if (state.X) copy(state, xg);
                prng.state = function() {
                    return copy(xg, {});
                };
            }
            return prng;
        }
        if (module2 && module2.exports) {
            module2.exports = impl;
        } else if (define1 && define1.amd) {
            define1(function() {
                return impl;
            });
        } else {
            this.xor4096 = impl;
        }
    })(commonjsGlobal, module1, false);
});
var tychei = createCommonjsModule(function(module1) {
    (function(global2, module2, define1) {
        function XorGen(seed) {
            var me = this, strseed = "";
            me.next = function() {
                var b = me.b, c = me.c, d = me.d, a = me.a;
                b = b << 25 ^ b >>> 7 ^ c;
                c = c - d | 0;
                d = d << 24 ^ d >>> 8 ^ a;
                a = a - b | 0;
                me.b = b = b << 20 ^ b >>> 12 ^ c;
                me.c = c = c - d | 0;
                me.d = d << 16 ^ c >>> 16 ^ a;
                return me.a = a - b | 0;
            };
            me.a = 0;
            me.b = 0;
            me.c = 2654435769 | 0;
            me.d = 1367130551;
            if (seed === Math.floor(seed)) {
                me.a = seed / 4294967296 | 0;
                me.b = seed | 0;
            } else {
                strseed += seed;
            }
            for(var k = 0; k < strseed.length + 20; k++){
                me.b ^= strseed.charCodeAt(k) | 0;
                me.next();
            }
        }
        function copy(f, t) {
            t.a = f.a;
            t.b = f.b;
            t.c = f.c;
            t.d = f.d;
            return t;
        }
        function impl(seed, opts) {
            var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
                return (xg.next() >>> 0) / 4294967296;
            };
            prng.double = function() {
                do {
                    var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
                }while (result === 0)
                return result;
            };
            prng.int32 = xg.next;
            prng.quick = prng;
            if (state) {
                if (typeof state == "object") copy(state, xg);
                prng.state = function() {
                    return copy(xg, {});
                };
            }
            return prng;
        }
        if (module2 && module2.exports) {
            module2.exports = impl;
        } else if (define1 && define1.amd) {
            define1(function() {
                return impl;
            });
        } else {
            this.tychei = impl;
        }
    })(commonjsGlobal, module1, false);
});
var _nodeResolve_empty = {};
var _nodeResolve_empty$1 = Object.freeze({
    __proto__: null,
    default: _nodeResolve_empty
});
var require$$0 = getDefaultExportFromNamespaceIfNotNamed(_nodeResolve_empty$1);
var seedrandom = createCommonjsModule(function(module1) {
    (function(global2, pool, math) {
        var width = 256, chunks = 6, digits = 52, rngname = "random", startdenom = math.pow(width, chunks), significance = math.pow(2, digits), overflow = significance * 2, mask = width - 1, nodecrypto;
        function seedrandom2(seed, options, callback) {
            var key = [];
            options = options == true ? {
                entropy: true
            } : options || {};
            var shortseed = mixkey(flatten(options.entropy ? [
                seed,
                tostring(pool)
            ] : seed == null ? autoseed() : seed, 3), key);
            var arc4 = new ARC4(key);
            var prng = function() {
                var n = arc4.g(chunks), d = startdenom, x = 0;
                while(n < significance){
                    n = (n + x) * width;
                    d *= width;
                    x = arc4.g(1);
                }
                while(n >= overflow){
                    n /= 2;
                    d /= 2;
                    x >>>= 1;
                }
                return (n + x) / d;
            };
            prng.int32 = function() {
                return arc4.g(4) | 0;
            };
            prng.quick = function() {
                return arc4.g(4) / 4294967296;
            };
            prng.double = prng;
            mixkey(tostring(arc4.S), pool);
            return (options.pass || callback || function(prng2, seed2, is_math_call, state) {
                if (state) {
                    if (state.S) {
                        copy(state, arc4);
                    }
                    prng2.state = function() {
                        return copy(arc4, {});
                    };
                }
                if (is_math_call) {
                    math[rngname] = prng2;
                    return seed2;
                } else return prng2;
            })(prng, shortseed, "global" in options ? options.global : this == math, options.state);
        }
        function ARC4(key) {
            var t, keylen = key.length, me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];
            if (!keylen) {
                key = [
                    keylen++
                ];
            }
            while(i < width){
                s[i] = i++;
            }
            for(i = 0; i < width; i++){
                s[i] = s[j = mask & j + key[i % keylen] + (t = s[i])];
                s[j] = t;
            }
            (me.g = function(count) {
                var t2, r = 0, i2 = me.i, j2 = me.j, s2 = me.S;
                while(count--){
                    t2 = s2[i2 = mask & i2 + 1];
                    r = r * width + s2[mask & (s2[i2] = s2[j2 = mask & j2 + t2]) + (s2[j2] = t2)];
                }
                me.i = i2;
                me.j = j2;
                return r;
            })(width);
        }
        function copy(f, t) {
            t.i = f.i;
            t.j = f.j;
            t.S = f.S.slice();
            return t;
        }
        function flatten(obj, depth) {
            var result = [], typ = typeof obj, prop;
            if (depth && typ == "object") {
                for(prop in obj){
                    try {
                        result.push(flatten(obj[prop], depth - 1));
                    } catch (e) {}
                }
            }
            return result.length ? result : typ == "string" ? obj : obj + "\0";
        }
        function mixkey(seed, key) {
            var stringseed = seed + "", smear, j = 0;
            while(j < stringseed.length){
                key[mask & j] = mask & (smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++);
            }
            return tostring(key);
        }
        function autoseed() {
            try {
                var out;
                if (nodecrypto && (out = nodecrypto.randomBytes)) {
                    out = out(width);
                } else {
                    out = new Uint8Array(width);
                    (global2.crypto || global2.msCrypto).getRandomValues(out);
                }
                return tostring(out);
            } catch (e) {
                var browser = global2.navigator, plugins = browser && browser.plugins;
                return [
                    +new Date(),
                    global2,
                    plugins,
                    global2.screen,
                    tostring(pool)
                ];
            }
        }
        function tostring(a) {
            return String.fromCharCode.apply(0, a);
        }
        mixkey(math.random(), pool);
        if (module1.exports) {
            module1.exports = seedrandom2;
            try {
                nodecrypto = require$$0;
            } catch (ex) {}
        } else {
            math["seed" + rngname] = seedrandom2;
        }
    })(typeof self !== "undefined" ? self : commonjsGlobal, [], Math);
});
seedrandom.alea = alea;
seedrandom.xor128 = xor128;
seedrandom.xorwow = xorwow;
seedrandom.xorshift7 = xorshift7;
seedrandom.xor4096 = xor4096;
seedrandom.tychei = tychei;
var seedrandom$1 = seedrandom;
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
    if (!getRandomValues) {
        getRandomValues = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== "undefined" && typeof msCrypto.getRandomValues === "function" && msCrypto.getRandomValues.bind(msCrypto);
        if (!getRandomValues) {
            throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
        }
    }
    return getRandomValues(rnds8);
}
var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
function validate(uuid) {
    return typeof uuid === "string" && REGEX.test(uuid);
}
var byteToHex = [];
for(var i2 = 0; i2 < 256; ++i2){
    byteToHex.push((i2 + 256).toString(16).substr(1));
}
function stringify1(arr) {
    var offset = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
    if (!validate(uuid)) {
        throw TypeError("Stringified UUID is invalid");
    }
    return uuid;
}
function parse11(uuid) {
    if (!validate(uuid)) {
        throw TypeError("Invalid UUID");
    }
    var v;
    var arr = new Uint8Array(16);
    arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
    arr[1] = v >>> 16 & 255;
    arr[2] = v >>> 8 & 255;
    arr[3] = v & 255;
    arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
    arr[5] = v & 255;
    arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
    arr[7] = v & 255;
    arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
    arr[9] = v & 255;
    arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 1099511627776 & 255;
    arr[11] = v / 4294967296 & 255;
    arr[12] = v >>> 24 & 255;
    arr[13] = v >>> 16 & 255;
    arr[14] = v >>> 8 & 255;
    arr[15] = v & 255;
    return arr;
}
function stringToBytes(str) {
    str = unescape(encodeURIComponent(str));
    var bytes = [];
    for(var i = 0; i < str.length; ++i){
        bytes.push(str.charCodeAt(i));
    }
    return bytes;
}
var DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
var URL1 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
function v35(name, version2, hashfunc) {
    function generateUUID(value, namespace, buf, offset) {
        if (typeof value === "string") {
            value = stringToBytes(value);
        }
        if (typeof namespace === "string") {
            namespace = parse11(namespace);
        }
        if (namespace.length !== 16) {
            throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
        }
        var bytes = new Uint8Array(16 + value.length);
        bytes.set(namespace);
        bytes.set(value, namespace.length);
        bytes = hashfunc(bytes);
        bytes[6] = bytes[6] & 15 | version2;
        bytes[8] = bytes[8] & 63 | 128;
        if (buf) {
            offset = offset || 0;
            for(var i = 0; i < 16; ++i){
                buf[offset + i] = bytes[i];
            }
            return buf;
        }
        return stringify1(bytes);
    }
    try {
        generateUUID.name = name;
    } catch (err) {}
    generateUUID.DNS = DNS;
    generateUUID.URL = URL1;
    return generateUUID;
}
function md5(bytes) {
    if (typeof bytes === "string") {
        var msg = unescape(encodeURIComponent(bytes));
        bytes = new Uint8Array(msg.length);
        for(var i = 0; i < msg.length; ++i){
            bytes[i] = msg.charCodeAt(i);
        }
    }
    return md5ToHexEncodedArray(wordsToMd5(bytesToWords(bytes), bytes.length * 8));
}
function md5ToHexEncodedArray(input) {
    var output = [];
    var length32 = input.length * 32;
    var hexTab = "0123456789abcdef";
    for(var i = 0; i < length32; i += 8){
        var x = input[i >> 5] >>> i % 32 & 255;
        var hex = parseInt(hexTab.charAt(x >>> 4 & 15) + hexTab.charAt(x & 15), 16);
        output.push(hex);
    }
    return output;
}
function getOutputLength(inputLength8) {
    return (inputLength8 + 64 >>> 9 << 4) + 14 + 1;
}
function wordsToMd5(x, len) {
    x[len >> 5] |= 128 << len % 32;
    x[getOutputLength(len) - 1] = len;
    var a = 1732584193;
    var b = -271733879;
    var c = -1732584194;
    var d = 271733878;
    for(var i = 0; i < x.length; i += 16){
        var olda = a;
        var oldb = b;
        var oldc = c;
        var oldd = d;
        a = md5ff(a, b, c, d, x[i], 7, -680876936);
        d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
        c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
        b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
        a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
        d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
        c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
        b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
        a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
        d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
        c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
        b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
        a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
        d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
        c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
        b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
        a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
        d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
        c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
        b = md5gg(b, c, d, a, x[i], 20, -373897302);
        a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
        d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
        c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
        b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
        a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
        d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
        c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
        b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
        a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
        d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
        c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
        b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
        a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
        d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
        c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
        b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
        a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
        d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
        c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
        b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
        a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
        d = md5hh(d, a, b, c, x[i], 11, -358537222);
        c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
        b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
        a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
        d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
        c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
        b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
        a = md5ii(a, b, c, d, x[i], 6, -198630844);
        d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
        c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
        b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
        a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
        d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
        c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
        b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
        a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
        d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
        c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
        b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
        a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
        d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
        c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
        b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
        a = safeAdd(a, olda);
        b = safeAdd(b, oldb);
        c = safeAdd(c, oldc);
        d = safeAdd(d, oldd);
    }
    return [
        a,
        b,
        c,
        d
    ];
}
function bytesToWords(input) {
    if (input.length === 0) {
        return [];
    }
    var length8 = input.length * 8;
    var output = new Uint32Array(getOutputLength(length8));
    for(var i = 0; i < length8; i += 8){
        output[i >> 5] |= (input[i / 8] & 255) << i % 32;
    }
    return output;
}
function safeAdd(x, y) {
    var lsw = (x & 65535) + (y & 65535);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return msw << 16 | lsw & 65535;
}
function bitRotateLeft(num, cnt) {
    return num << cnt | num >>> 32 - cnt;
}
function md5cmn(q, a, b, x, s, t) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}
function md5ff(a, b, c, d, x, s, t) {
    return md5cmn(b & c | ~b & d, a, b, x, s, t);
}
function md5gg(a, b, c, d, x, s, t) {
    return md5cmn(b & d | c & ~d, a, b, x, s, t);
}
function md5hh(a, b, c, d, x, s, t) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5ii(a, b, c, d, x, s, t) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
}
v35("v3", 48, md5);
function v4(options, buf, offset) {
    options = options || {};
    var rnds = options.random || (options.rng || rng)();
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    if (buf) {
        offset = offset || 0;
        for(var i = 0; i < 16; ++i){
            buf[offset + i] = rnds[i];
        }
        return buf;
    }
    return stringify1(rnds);
}
function f(s, x, y, z) {
    switch(s){
        case 0:
            return x & y ^ ~x & z;
        case 1:
            return x ^ y ^ z;
        case 2:
            return x & y ^ x & z ^ y & z;
        case 3:
            return x ^ y ^ z;
    }
}
function ROTL(x, n) {
    return x << n | x >>> 32 - n;
}
function sha1(bytes) {
    var K = [
        1518500249,
        1859775393,
        2400959708,
        3395469782
    ];
    var H = [
        1732584193,
        4023233417,
        2562383102,
        271733878,
        3285377520
    ];
    if (typeof bytes === "string") {
        var msg = unescape(encodeURIComponent(bytes));
        bytes = [];
        for(var i = 0; i < msg.length; ++i){
            bytes.push(msg.charCodeAt(i));
        }
    } else if (!Array.isArray(bytes)) {
        bytes = Array.prototype.slice.call(bytes);
    }
    bytes.push(128);
    var l = bytes.length / 4 + 2;
    var N = Math.ceil(l / 16);
    var M = new Array(N);
    for(var _i = 0; _i < N; ++_i){
        var arr = new Uint32Array(16);
        for(var j = 0; j < 16; ++j){
            arr[j] = bytes[_i * 64 + j * 4] << 24 | bytes[_i * 64 + j * 4 + 1] << 16 | bytes[_i * 64 + j * 4 + 2] << 8 | bytes[_i * 64 + j * 4 + 3];
        }
        M[_i] = arr;
    }
    M[N - 1][14] = (bytes.length - 1) * 8 / Math.pow(2, 32);
    M[N - 1][14] = Math.floor(M[N - 1][14]);
    M[N - 1][15] = (bytes.length - 1) * 8 & 4294967295;
    for(var _i2 = 0; _i2 < N; ++_i2){
        var W = new Uint32Array(80);
        for(var t = 0; t < 16; ++t){
            W[t] = M[_i2][t];
        }
        for(var _t = 16; _t < 80; ++_t){
            W[_t] = ROTL(W[_t - 3] ^ W[_t - 8] ^ W[_t - 14] ^ W[_t - 16], 1);
        }
        var a = H[0];
        var b = H[1];
        var c = H[2];
        var d = H[3];
        var e = H[4];
        for(var _t2 = 0; _t2 < 80; ++_t2){
            var s = Math.floor(_t2 / 20);
            var T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[_t2] >>> 0;
            e = d;
            d = c;
            c = ROTL(b, 30) >>> 0;
            b = a;
            a = T;
        }
        H[0] = H[0] + a >>> 0;
        H[1] = H[1] + b >>> 0;
        H[2] = H[2] + c >>> 0;
        H[3] = H[3] + d >>> 0;
        H[4] = H[4] + e >>> 0;
    }
    return [
        H[0] >> 24 & 255,
        H[0] >> 16 & 255,
        H[0] >> 8 & 255,
        H[0] & 255,
        H[1] >> 24 & 255,
        H[1] >> 16 & 255,
        H[1] >> 8 & 255,
        H[1] & 255,
        H[2] >> 24 & 255,
        H[2] >> 16 & 255,
        H[2] >> 8 & 255,
        H[2] & 255,
        H[3] >> 24 & 255,
        H[3] >> 16 & 255,
        H[3] >> 8 & 255,
        H[3] & 255,
        H[4] >> 24 & 255,
        H[4] >> 16 & 255,
        H[4] >> 8 & 255,
        H[4] & 255
    ];
}
v35("v5", 80, sha1);
let prng = seedrandom$1();
function random() {
    return prng();
}
function fake(data2, options) {
    const dataSource = Array.isArray(data2) ? ()=>randElement(data2) : data2;
    if ((options == null ? void 0 : options.length) === void 0) {
        return dataSource(0);
    }
    return Array.from({
        length: options.length
    }, (_, index)=>dataSource(index));
}
function randElement(arr) {
    return arr[Math.floor(random() * arr.length)];
}
function getRandomInRange({ min =1 , max =9999.99 , fraction =0  } = {}) {
    return Number((random() * (max - min) + min).toFixed(fraction));
}
const numericChars = "0123456789";
const alphaChars = "abcdefghijklmnopqrstuvwxyz";
`${numericChars}${alphaChars}${alphaChars.toUpperCase()}`;
function randAlpha(options) {
    return fake(alphaChars.split(""), options);
}
function randBoolean(options) {
    return fake(()=>randElement([
            true,
            false
        ]), options);
}
function isNil(value) {
    return value === null || typeof value === "undefined";
}
function randNumber(options) {
    const normalized = {
        min: isNil(options == null ? void 0 : options.min) ? 0 : options.min,
        max: isNil(options == null ? void 0 : options.max) ? 999999 : options.max,
        precision: options == null ? void 0 : options.precision,
        fraction: options == null ? void 0 : options.fraction
    };
    return fake(()=>{
        if (normalized.min === normalized.max) {
            return normalized.min;
        }
        const num = getRandomInRange(normalized);
        if (normalized.precision !== void 0) {
            return Math.floor(num / normalized.precision) * normalized.precision;
        }
        return num;
    }, options);
}
function randBetweenDate(options) {
    const from = new Date(options.from).getTime();
    const to = new Date(options.to).getTime();
    if (from >= to) {
        throw new Error("From must be before to");
    }
    const generator2 = ()=>{
        return new Date(randNumber({
            min: from,
            max: to
        }));
    };
    return fake(generator2, options);
}
var data$1M = [
    "MS",
    "TW",
    "LR",
    "HU",
    "PK",
    "GQ",
    "GG",
    "SZ",
    "MQ",
    "AS",
    "WS",
    "BJ",
    "NR",
    "FJ",
    "ZM",
    "CR",
    "BO",
    "AW",
    "AI",
    "GW",
    "PF",
    "MO",
    "PE",
    "UZ",
    "JM",
    "KH",
    "RW",
    "GN",
    "IN",
    "MR",
    "MC",
    "KG",
    "SA",
    "SV",
    "TZ",
    "ME",
    "BB",
    "IE",
    "LY",
    "TM",
    "SN",
    "MA",
    "BN",
    "ML",
    "LV",
    "SM",
    "HT",
    "NF",
    "TD",
    "UA",
    "FM",
    "KM",
    "CN",
    "GF",
    "MT",
    "RO",
    "PA",
    "FI",
    "BG",
    "KZ",
    "PN",
    "BL",
    "NO",
    "IM",
    "AQ",
    "MV",
    "LA",
    "NU",
    "LS",
    "CW",
    "CF",
    "GT",
    "TL",
    "RU",
    "BQ",
    "GB",
    "BV",
    "TC",
    "EC",
    "NG",
    "AD",
    "RE",
    "SL",
    "CL",
    "ER"
];
function randCountryCode(options) {
    return fake(data$1M, options);
}
var data$1J = [
    "Apple",
    "Amazon",
    "Microsoft",
    "Google",
    "Samsung",
    "Coca-Cola",
    "Toyota",
    "Mercedes",
    "McDonald\u2019s",
    "Disney",
    "BMW",
    "Intel",
    "Facebook",
    "IBM",
    "Nike",
    "Cisco",
    "Louis Vuitton",
    "SAP",
    "Instagram",
    "Honda",
    "Chanel",
    "J.P. Morgan",
    "American Express",
    "UPS",
    "Ikea",
    "Pepsi",
    "Adobe",
    "Herm\xE8s",
    "General Electric",
    "YouTube",
    "Accenture",
    "Gucci",
    "Budweiser",
    "Pampers",
    "Zara",
    "Hyundai",
    "H&M",
    "Nescaf\xE9",
    "Allianz",
    "Tesla",
    "Netflix",
    "Ford",
    "L'Oreal",
    "Audi",
    "Visa",
    "Ebay",
    "Volkswagen",
    "AXA",
    "Goldman Sachs",
    "Adidas",
    "Sony",
    "Citi",
    "Philips",
    "Gillette",
    "Porsche",
    "Starbucks",
    "Mastercard",
    "Salesforce",
    "Nissan",
    "PayPal",
    "Siemens",
    "Danone",
    "Nestl\xE9",
    "HSBC",
    "Hewlett Packard",
    "Kellogg's",
    "3M",
    "Colgate",
    "Morgan Stanely",
    "Spotify",
    "Canon",
    "Lego",
    "Cartier",
    "Santander",
    "FedEx",
    "Nintendo",
    "Hewlett Packard Enterprise",
    "Corona",
    "Ferrari",
    "Huawei",
    "DHL",
    "Jack Daniel's",
    "Dior",
    "Caterpillar",
    "Panasonic",
    "Kia",
    "Johnson & Johnson",
    "Heineken",
    "John Deere",
    "LinkedIn",
    "Hennessy",
    "KFC",
    "Land Rover",
    "Tiffany & Co.",
    "Mini",
    "Uber",
    "Burberry",
    "Johnnie Walker",
    "Prada",
    "Zoom"
];
function randBrand(options) {
    return fake(data$1J, options);
}
var data$1D = [
    "South Dagmarshire",
    "New Solonmouth",
    "New Montemouth",
    "Langborough",
    "Padbergmouth",
    "Connfurt",
    "Metairie",
    "New Merle",
    "Willbury",
    "North Sigmund",
    "Opalbury",
    "North Antonetta",
    "Tallahassee",
    "Janefurt",
    "Port Adalberto",
    "West Dorris",
    "Kettering",
    "Lake Adell",
    "Bellingham",
    "Buffalo",
    "West Brendonville",
    "South Laila",
    "West Lucy",
    "Marionton",
    "Lake Brianne",
    "New Ansley",
    "Johnnieburgh",
    "Jaskolskifort",
    "New Davonteside",
    "New Kyle",
    "Williemouth",
    "Lake Cesar",
    "Bernierfurt",
    "West Janetborough",
    "Port Asa",
    "East Filibertofurt",
    "Fort Lauderdale",
    "West Dellside",
    "Glen Burnie",
    "Port Amie",
    "Shoreline",
    "West Estaton",
    "Cuyahoga Falls",
    "North Kaleighshire",
    "Kuvalismouth",
    "South Darienbury",
    "Venamouth",
    "North Winnifred",
    "Bahringertown",
    "Haneborough",
    "South Ahmedfort",
    "East Khalilton",
    "Aliso Viejo",
    "Jaquelinview",
    "Lake Ludie",
    "West Simone",
    "Katrinaside",
    "North Nona",
    "Tryciastad",
    "Tabithaville",
    "Frisco",
    "Olympia",
    "State College",
    "New Garlandfort",
    "Lake Anthony",
    "West Everardo",
    "Wehnerfort",
    "South Verdieton",
    "Lawrence",
    "New Wallaceberg",
    "White Plains",
    "South Stacey",
    "Farmington",
    "Borerville",
    "Erynside",
    "Lake Zackton",
    "Port Salvador",
    "Funkville",
    "North Frankie",
    "East Vicentaborough",
    "North Braulio",
    "East Providence",
    "Denesikburgh",
    "New Philip",
    "Durwardton",
    "Kissimmee",
    "North Celia",
    "Maxwellport",
    "Reichertland",
    "Rettaland",
    "West Amiya",
    "Elisabethland",
    "Rogers",
    "Henderson",
    "Franeckiview",
    "Grand Rapids",
    "Murray",
    "Port Ricky",
    "Port Hardymouth",
    "Cruzshire"
];
function randCity(options) {
    return fake(data$1D, options);
}
var data$1A = [
    "Kautzer, Macejkovic and Fisher",
    "Greenholt - Mosciski",
    "Marquardt - Runolfsdottir",
    "Abernathy Inc",
    "Dickens - Lang",
    "Hand, Bernhard and Kessler",
    "Abbott LLC",
    "Kub Inc",
    "Johnston - Wisozk",
    "Reichert LLC",
    "Kohler LLC",
    "Shanahan - Boyle",
    "Batz - Rice",
    "Cronin, Oberbrunner and Beier",
    "Kuhlman, Schowalter and West",
    "Luettgen Inc",
    "Ward Group",
    "Hills and Sons",
    "Prohaska, Balistreri and Walker",
    "Rempel - Durgan",
    "Bernier LLC",
    "Stehr - Lockman",
    "Roberts, Rogahn and Dooley",
    "Lesch - Jakubowski",
    "Jenkins - Turcotte",
    "Gerhold - Rowe",
    "Block - Rau",
    "Dickinson, Tremblay and Moore",
    "Nader - Fritsch",
    "Kreiger and Sons",
    "Bartell, Wehner and Schowalter",
    "Hegmann Inc",
    "Orn, Spencer and Kiehn",
    "Graham, Sipes and Towne",
    "Hodkiewicz Inc",
    "Mills Group",
    "Legros, Tillman and Hodkiewicz",
    "Lesch - Carter",
    "Lesch Group",
    "Kreiger - Sauer",
    "Cartwright - Schuster",
    "Labadie LLC",
    "Pfannerstill, White and Mosciski",
    "Jenkins LLC",
    "Boehm, Hettinger and Huels",
    "Maggio, Wisoky and Blick",
    "Kozey Inc",
    "Stracke - Wisozk",
    "Olson, Olson and Carter",
    "Orn, Gerlach and Runolfsdottir",
    "Stracke - Kertzmann",
    "Walker - Zieme",
    "Hodkiewicz - Hintz",
    "Lind Group",
    "Fahey, Leannon and Gleichner",
    "Mertz, Gusikowski and Lemke",
    "Heidenreich - Aufderhar",
    "Zboncak and Sons",
    "Carroll Group",
    "Brown LLC",
    "Weber Inc",
    "Rath LLC",
    "Walker Inc",
    "Heller, Hyatt and Jaskolski",
    "Jacobi - Kutch",
    "Skiles and Sons",
    "Durgan - Stamm",
    "Renner - Prosacco",
    "Hahn - Welch",
    "Lesch, Dooley and Bartell",
    "Crona and Sons",
    "Rogahn, Armstrong and Goyette",
    "Lubowitz, Kuhlman and Bailey",
    "Doyle Group",
    "Dooley and Sons",
    "Kerluke LLC",
    "Bogan - Daniel",
    "Hintz - Boehm",
    "Swaniawski and Sons",
    "Kris, Legros and Cartwright",
    "Reichel Group",
    "Russel - Hintz",
    "Welch, Lockman and Hand",
    "Pouros - Brakus",
    "Mohr, Fritsch and Wisozk",
    "Upton - Reichert",
    "Koepp and Sons",
    "Weber and Sons",
    "Quigley, Bins and Becker",
    "Strosin, Oberbrunner and Wunsch",
    "Rodriguez - Spencer",
    "Wilkinson - Dare",
    "Gutkowski Inc",
    "OReilly LLC",
    "Collins, Mante and Pacocha",
    "Steuber, Luettgen and Corkery",
    "Kub and Sons",
    "Lesch and Sons"
];
function randCompanyName(options) {
    return fake(data$1A, options);
}
var data$1z = [
    "Argentina",
    "Peru",
    "Colombia",
    "Chile",
    "Uruguay",
    "Gabon",
    "Congo",
    "Norfolk Island",
    "Qatar",
    "Syrian Arab Republic",
    "Wallis and Futuna",
    "Somalia",
    "Saint Barthelemy",
    "Comoros",
    "Sri Lanka",
    "Czech Republic",
    "Christmas Island",
    "Macao",
    "Montenegro",
    "Anguilla",
    "Canada",
    "Mayotte",
    "Tajikistan",
    "Afghanistan",
    "Liechtenstein",
    "Cocos (Keeling) Islands",
    "Angola",
    "Bahrain",
    "Dominican Republic",
    "Croatia",
    "Latvia",
    "Virgin Islands, U.S.",
    "United Kingdom",
    "Brazil",
    "Spain",
    "Mongolia",
    "Montserrat",
    "Estonia",
    "Benin",
    "Guinea",
    "Guinea-Bissau",
    "Greece",
    "Lao Peoples Democratic Republic",
    "Puerto Rico",
    "Slovakia (Slovak Republic)",
    "United States of America",
    "Switzerland",
    "Costa Rica",
    "Mauritius",
    "Nigeria",
    "Russian Federation",
    "Germany",
    "Antigua and Barbuda",
    "Albania",
    "Romania",
    "Moldova",
    "Senegal",
    "Tanzania",
    "British Indian Ocean Territory (Chagos Archipelago)",
    "Central African Republic",
    "New Caledonia",
    "Burundi",
    "Panama",
    "Azerbaijan",
    "Namibia",
    "French Southern Territories",
    "Vanuatu",
    "Ethiopia",
    "Burkina Faso",
    "Tunisia",
    "Mozambique",
    "Belarus",
    "Saint Kitts and Nevis",
    "Hungary",
    "Indonesia",
    "Cyprus",
    "Ecuador",
    "Saint Martin",
    "Nauru",
    "Faroe Islands",
    "Iran",
    "Bolivia",
    "Pitcairn Islands",
    "France",
    "Paraguay",
    "Isle of Man",
    "Sierra Leone",
    "Monaco",
    "Belize",
    "Trinidad and Tobago"
];
function randCountry(options) {
    return fake(data$1z, options);
}
var data$1y = [
    "Bedfordshire",
    "Berkshire",
    "Bristol",
    "Buckinghamshire",
    "Cambridgeshire",
    "Cheshire",
    "City of London",
    "Cornwall",
    "Cumbria",
    "Derbyshire",
    "Devon",
    "Dorset",
    "Durham",
    "East Riding of Yorkshire",
    "East Sussex",
    "Essex",
    "Gloucestershire",
    "Greater London",
    "Greater Manchester",
    "Hampshire",
    "Herefordshire",
    "Hertfordshire",
    "Isle of Wight",
    "Kent",
    "Lancashire",
    "Leicestershire",
    "Lincolnshire",
    "Merseyside",
    "Norfolk",
    "North Yorkshire",
    "Northamptonshire",
    "Northumberland",
    "Nottinghamshire",
    "Oxfordshire",
    "Rutland",
    "Shropshire",
    "Somerset",
    "South Yorkshire",
    "Staffordshire",
    "Suffolk",
    "Surrey",
    "Tyne and Wear",
    "Warwickshire",
    "West Midlands",
    "West Sussex",
    "West Yorkshire",
    "Wiltshire",
    "Worcestershire"
];
function randCounty(options) {
    return fake(data$1y, options);
}
function rand(arr, options) {
    return fake(arr, options);
}
var data$1j = [
    "org",
    "biz",
    "com",
    "net",
    "name",
    "info",
    "io",
    "dev"
];
function randDomainSuffix(options) {
    return fake(data$1j, options);
}
var data$1i = [
    "est",
    "voluptatem",
    "non",
    "aut",
    "aliquid",
    "quaerat",
    "quos",
    "vel",
    "tenetur",
    "consectetur",
    "ipsum",
    "voluptate",
    "numquam",
    "nulla",
    "asperiores",
    "in",
    "laborum",
    "quas",
    "et",
    "ullam",
    "consequuntur",
    "enim",
    "dicta",
    "quia",
    "facilis",
    "voluptatibus",
    "at",
    "hic",
    "sunt",
    "excepturi",
    "maiores",
    "vitae",
    "fugit",
    "possimus",
    "unde",
    "repellat",
    "sit",
    "necessitatibus",
    "nemo",
    "qui",
    "exercitationem",
    "dolores",
    "esse",
    "reiciendis",
    "nihil",
    "commodi",
    "id",
    "sequi",
    "consequatur",
    "occaecati",
    "deserunt",
    "quae",
    "eos",
    "sapiente",
    "fugiat",
    "neque",
    "quasi",
    "nostrum",
    "magnam",
    "sed",
    "omnis",
    "doloribus",
    "error",
    "ducimus",
    "rerum",
    "beatae",
    "cupiditate",
    "blanditiis",
    "labore"
];
function capitalizeFirstLetter(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}
function randWord(options) {
    const factory = ()=>{
        let word = randElement(data$1i);
        if (options != null && options.capitalize) {
            word = capitalizeFirstLetter(word);
        }
        return word;
    };
    return fake(factory, options);
}
var data$1g = [
    "aim",
    "alice",
    "aliceadsl",
    "aol",
    "arcor",
    "att",
    "bellsouth",
    "bigpond",
    "bluewin",
    "blueyonder",
    "bol",
    "centurytel",
    "charter",
    "chello",
    "club-internet",
    "comcast",
    "earthlink",
    "facebook",
    "free",
    "freenet",
    "frontiernet",
    "gmail",
    "gmx",
    "googlemail",
    "hetnet",
    "home",
    "hotmail",
    "ig",
    "juno",
    "laposte",
    "libero",
    "live",
    "mac",
    "mail",
    "me",
    "msn",
    "neuf",
    "ntlworld",
    "optonline",
    "optusnet",
    "orange",
    "outlook",
    "planet",
    "qq",
    "rambler",
    "rediffmail",
    "rocketmail",
    "sbcglobal",
    "sfr",
    "shaw",
    "sky",
    "skynet",
    "sympatico",
    "t-online",
    "telenet",
    "terra",
    "tin",
    "tiscali",
    "unaref",
    "uol",
    "verizon",
    "virgilio",
    "voila",
    "wanadoo",
    "web",
    "windstream",
    "yahoo",
    "yandex",
    "zonnet"
];
function randEmailProvider(options) {
    return fake(data$1g, options);
}
var data$1f = {
    withAccents: {
        male: [
            "Adri\xE1n",
            "\xC6gir",
            "\xC1lvaro",
            "Andr\xE9",
            "Andr\xE9s",
            "\xC1rni",
            "Asbj\xF8rn",
            "Bj\xF6rn",
            "C\xE9sar",
            "Dan\xEDel",
            "Dav\xED\xF0",
            "Em\xEDlio",
            "Fa\xF1ch",
            "Fran\xE7ois",
            "Franti\u0161ek",
            "G\xEDsli",
            "G\xF6tz",
            "Gu\xF0j\xF3n",
            "Gu\xF0mundur",
            "G\xFCnter",
            "Halld\xF3r",
            "Hans-J\xF6rg",
            "Hans-J\xFCrgen",
            "H\xFCseyin",
            "I\xF1aki",
            "J\xE1nos",
            "Jes\xFAs",
            "Ji\u0159\xED",
            "J\xF3hann",
            "J\xF3hannes",
            "Jok\u016Bbas",
            "J\xF3n",
            "Jos\xE9",
            "J\xF6rn",
            "Juli\xE3o",
            "J\xFCrgen",
            "Kristj\xE1n",
            "Ma\xEBl",
            "Magn\xFAs",
            "Math\xE9o",
            "M\xE1ty\xE1s",
            "Micha\u0142",
            "No\xEBl",
            "Nu\xF1ez",
            "\xD3lafur",
            "\xD3scar",
            "\xD8yvind",
            "P\xE1ll",
            "Pawe\u0142",
            "P\xE9tur",
            "Ram\xF3n",
            "Ra\xFAl",
            "Ren\xE9",
            "Ruair\xED",
            "Rub\xE9n",
            "Se\xE1n",
            "S\xE9rgio",
            "Sigur\xF0ur",
            "S\xF6nke",
            "Stef\xE1n",
            "Tom\xE1\u0161",
            "\xDEorsteinn"
        ],
        female: [
            "\xC6del",
            "Agn\xE8s",
            "Al\xEDcia",
            "\xC4nne",
            "Ant\xF3nia",
            "\xC1sta",
            "Au\xF0ur",
            "C\xE4cilia",
            "Chlo\xEB",
            "Cla\xFAdia",
            "D\xF6rte",
            "El\xEDn",
            "El\xEDsabet",
            "Eli\u0161ka",
            "Franti\u0161ka",
            "Gl\xF3ria",
            "Gra\u017Cyna",
            "Gu\xF0bj\xF6rg",
            "Gu\xF0n\xFD",
            "Gu\xF0r\xFAn",
            "Henri\xEBtte",
            "Ingibj\xF6rg",
            "\xCDris",
            "J\xF3hanna",
            "J\xF3na",
            "J\xFAlia",
            "K\xE4te",
            "Katr\xEDn",
            "Kolbr\xFAn",
            "Krist\xEDn",
            "K\u0160the",
            "Let\xEDcia",
            "L\xEDdia",
            "L\xFAcia",
            "Ma\u0142gorzata",
            "Margr\xE9t",
            "Mar\xEDa",
            "M\xF3nica",
            "Nat\xE1lia",
            "\xD3l\xF6f",
            "Patr\xEDcia",
            "Ragnhei\xF0ur",
            "Ren\xE9e",
            "Ru\u017Eena",
            "Si\xE2n",
            "Sigr\xED\xF0ur",
            "Sigr\xFAn",
            "S\xEDlvia",
            "S\xF8rina",
            "V\u011Bra",
            "Virg\xEDnia",
            "Zo\xEB",
            "\xDE\xF3ra",
            "\xDE\xF3runn"
        ]
    },
    withoutAccents: {
        male: [
            "Abdul",
            "Abdullahi",
            "Abubakar",
            "Adam",
            "Adamu",
            "Adiy",
            "Ahmad",
            "Ajay",
            "Akira",
            "Alan",
            "Alberto",
            "Alejandro",
            "Aleksander",
            "Aleksandr",
            "Aleksey",
            "Alex",
            "Alexander",
            "Alexey",
            "Ali",
            "Aliyu",
            "Aminu",
            "Amit",
            "Amiyr",
            "Amiyt",
            "Amnuai",
            "Amphon",
            "Anah",
            "Anan",
            "Andreas",
            "Andrew",
            "Andrey",
            "Andri",
            "Andries",
            "Andrzej",
            "Anil",
            "Anthony",
            "Anton",
            "Antonio",
            "Arnar",
            "Artur",
            "Artyom",
            "Arun",
            "Ashok",
            "Atli",
            "Avraham",
            "Bartosz",
            "Bello",
            "Bernd",
            "Bin",
            "Birgir",
            "Bjarni",
            "Blessing",
            "Bongani",
            "Brian",
            "Bunmi",
            "Carlos",
            "Carol",
            "Chan",
            "Chao",
            "Charles",
            "Charoen",
            "Chen",
            "Cheng",
            "Christian",
            "Christopher",
            "Colin",
            "Daniel",
            "Daniyel",
            "Dariusz",
            "David",
            "Denis",
            "Dennis",
            "Diego",
            "Dieter",
            "Dilip",
            "Dinesh",
            "Dmitriy",
            "Dmitry",
            "Einar",
            "Eliyahu",
            "Emmanuel",
            "Evgeniy",
            "Fernando",
            "Fran",
            "Francis",
            "Francisco",
            "Francisco-Javier",
            "Frank",
            "Franz",
            "Gang",
            "Gareth",
            "Gary",
            "George",
            "Gerhard",
            "Graham",
            "Grzegorz",
            "Gunnar",
            "Guy",
            "Haim",
            "Haiyan",
            "Hans",
            "Hans-Ulrich",
            "Haruna",
            "Hassan",
            "Heike",
            "Heinz",
            "Helgi",
            "Helmut",
            "Hendrik",
            "Herbert",
            "Hideo",
            "Hiromi",
            "Hiroshi",
            "Hong",
            "Horst",
            "Hui",
            "Ian",
            "Ibrahim",
            "Idris",
            "Igor",
            "Ilya",
            "Isa",
            "Isaac",
            "Isah",
            "Ivan",
            "Jabulani",
            "Jacek",
            "Jacobus",
            "Jakub",
            "James",
            "Jan",
            "Janusz",
            "Javier",
            "Jean",
            "Jerzy",
            "Jesus",
            "Jason",
            "Jianguo",
            "Jianhua",
            "Jianjun",
            "Jianping",
            "Jin",
            "Joan",
            "Johan",
            "Johannes",
            "John",
            "Jonathan",
            "Jorge",
            "Jose",
            "Jose-Antonio",
            "Jose-Luis",
            "Jose-Manuel",
            "Jose-Maria",
            "Josef",
            "Joseph",
            "Joyce",
            "Juan",
            "Kabiru",
            "Kai",
            "Kamil",
            "Karen",
            "Karl",
            "Karl-Heinz",
            "Katsumi",
            "Kazuo",
            "Kelvin",
            "Kenji",
            "Kenneth",
            "Kevin",
            "Kiran",
            "Kirill",
            "Kiyoshi",
            "Kjartan",
            "Klaus",
            "Ko",
            "Koichi",
            "Koji",
            "Konstantin",
            "Koshi",
            "Krishna",
            "Kristinn",
            "Krzysztof",
            "Kun",
            "Lakshmi",
            "Lan",
            "Laxmi",
            "Lei",
            "Li",
            "Lihua",
            "Lijun",
            "Lilian",
            "Lin",
            "Ling",
            "Liping",
            "Liyor",
            "Luis",
            "Lukasz",
            "Maciej",
            "Mahmood",
            "Maksim",
            "Manfred",
            "Manoj",
            "Manuel",
            "Marcin",
            "Mardkhay",
            "Marek",
            "Mariusz",
            "Mark",
            "Martin",
            "Masami",
            "Masao",
            "Mateusz",
            "Matt",
            "Matthew",
            "Meiyr",
            "Michael",
            "Michal",
            "Miguel",
            "Miguel-Angel",
            "Mikhail",
            "Min",
            "Ming",
            "Mitsuo",
            "Miykhael",
            "Miykhal",
            "Mo",
            "Mohamed",
            "Mohammad",
            "Mohammed",
            "Mohan",
            "Moses",
            "Moshe",
            "Mpho",
            "Muhammad",
            "Muhammed",
            "Mukesh",
            "Musa",
            "Narong",
            "Nathan",
            "Nicola",
            "Nikita",
            "Nikolay",
            "Ning",
            "Nkosinathi",
            "Noam",
            "Oleg",
            "Omer",
            "Otieno",
            "Pablo",
            "Patrick",
            "Paul",
            "Pavel",
            "Pawel",
            "Pedro",
            "Peng",
            "Peter",
            "Petrus",
            "Philip",
            "Pieter",
            "Ping",
            "Piotr",
            "Prasit",
            "Prasoet",
            "Pricha",
            "Pushpa",
            "Qiang",
            "Qing",
            "Radha",
            "Rafael",
            "Ragnar",
            "Raj",
            "Rajendra",
            "Rajesh",
            "Raju",
            "Rakesh",
            "Ram",
            "Ramesh",
            "Raphael",
            "Rattana",
            "Ravi",
            "Richard",
            "Robert",
            "Roman",
            "Rong",
            "Roy",
            "Ryan",
            "Salisu",
            "Saman",
            "Samran",
            "Samuel",
            "Sani",
            "Sanjay",
            "Santosh",
            "Sam",
            "Sammy",
            "Sawat",
            "Sebastian",
            "Sergey",
            "Sergio",
            "Shankar",
            "Shay",
            "Shigeru",
            "Shimon",
            "Shlomo",
            "Shoji",
            "Sibusiso",
            "Simon",
            "Sipho",
            "Sombat",
            "Sombun",
            "Somchai",
            "Somchit",
            "Somkhit",
            "Somkiat",
            "Sommai",
            "Somnuek",
            "Somphon",
            "Somphong",
            "Somsak",
            "Sri",
            "Stefan",
            "Stephen",
            "Steve",
            "Steven",
            "Suman",
            "Sunday",
            "Sunil",
            "Sunthon",
            "Suresh",
            "Sushila",
            "Suwit",
            "Sveinn",
            "Tadashi",
            "Takashi",
            "Takeshi",
            "Tal",
            "Tebogo",
            "Thabo",
            "Thawi",
            "Themba",
            "Thomas",
            "Thulani",
            "Tomasz",
            "Toshio",
            "Udom",
            "Umar",
            "Uriy",
            "Usman",
            "Uwe",
            "Victor",
            "Vijay",
            "Viktor",
            "Vincent",
            "Vinod",
            "Vladimir",
            "Walter",
            "Wanchai",
            "Waraphon",
            "Wei",
            "Werner",
            "Wichai",
            "Wichian",
            "Willem",
            "William",
            "Winai",
            "Wirat",
            "Wirot",
            "Wojciech",
            "Wolfgang",
            "Xiang",
            "Xiaohong",
            "Xiaoli",
            "Xiaoping",
            "Xiaoyan",
            "Xin",
            "Xolani",
            "Yaakv",
            "Yahaya",
            "Yakubu",
            "Yan",
            "Yasuo",
            "Yhudah",
            "Ying",
            "Yisrael",
            "Yong",
            "Yosef",
            "Yoshie",
            "Yoshimi",
            "Yoshio",
            "Yu",
            "Yue",
            "Yukio",
            "Yun",
            "Yuriy",
            "Yusuf",
            "Yuval",
            "Zbigniew",
            "Zhen",
            "Zhiqiang"
        ],
        female: [
            "Agata",
            "Agnieszka",
            "Aisha",
            "Akira",
            "Aleksandra",
            "Alina",
            "Alyona",
            "Amina",
            "Amnuai",
            "Ana",
            "Ana-Maria",
            "Anah",
            "Anan",
            "Anastasiya",
            "Andrea",
            "Angela",
            "Anita",
            "Ann",
            "Anna",
            "Anong",
            "Antonia",
            "Asha",
            "Barbara",
            "Beata",
            "Berglind",
            "Bin",
            "Birgit",
            "Birna",
            "Blessing",
            "Brigitte",
            "Bunmi",
            "Busisiwe",
            "Carmen",
            "Carol",
            "Caroline",
            "Catherine",
            "Chan",
            "Chanah",
            "Chao",
            "Charoen",
            "Chayah",
            "Chen",
            "Cheng",
            "Christa",
            "Christine",
            "Claire",
            "Claudia",
            "Cristina",
            "Darya",
            "Dolores",
            "Dorota",
            "Edda",
            "Ekaterina",
            "Elena",
            "Elisabeth",
            "Elizabeth",
            "Elke",
            "Emiko",
            "Emma",
            "Erika",
            "Erla",
            "Erna",
            "Ester",
            "Esther",
            "Eunice",
            "Eva",
            "Eugenia",
            "Ewa",
            "Faith",
            "Fatima",
            "Fiona",
            "Fran",
            "Francisca",
            "Fumiko",
            "Galina",
            "Gabra",
            "Gisela",
            "Gita",
            "Grace",
            "Hadiza",
            "Haiyan",
            "Hanna",
            "Haruna",
            "Hauwa",
            "Heike",
            "Helen",
            "Helga",
            "Hildur",
            "Hiroko",
            "Hiromi",
            "Hisako",
            "Hong",
            "Hui",
            "Hulda",
            "Inga",
            "Ingrid",
            "Irina",
            "Isa",
            "Isabel",
            "Isah",
            "Iwona",
            "Jackline",
            "Jan",
            "Jane",
            "Janet",
            "Jean",
            "Jennifer",
            "Jianhua",
            "Jianping",
            "Jin",
            "Joan",
            "Joanna",
            "Johanna",
            "Josefa",
            "Joy",
            "Joyce",
            "Juan",
            "Julie",
            "Justyna",
            "Kai",
            "Kanchana",
            "Karen",
            "Karin",
            "Karolina",
            "Kasia",
            "Katarzyna",
            "Katsumi",
            "Keiko",
            "Kiran",
            "Kiyoko",
            "Kristina",
            "Kseniya",
            "Kun",
            "Lakshmi",
            "Lalita",
            "Lan",
            "Latda",
            "Laura",
            "Laxmi",
            "Leah",
            "Lei",
            "Li",
            "Lihua",
            "Lijun",
            "Lilian",
            "Lilja",
            "Lin",
            "Linda",
            "Lindiwe",
            "Ling",
            "Liping",
            "Lisa",
            "Lucia",
            "Lucy",
            "Lyubov",
            "Lyudmila",
            "Magda",
            "Magdalena",
            "Mali",
            "Manju",
            "Margaret",
            "Maria",
            "Maria-Isabel",
            "Maria-Jose",
            "Maria-Pilar",
            "Marina",
            "Mariya",
            "Marta",
            "Martha",
            "Mary",
            "Maryam",
            "Masako",
            "Masami",
            "Mei",
            "Mercy",
            "Michal",
            "Michiko",
            "Mieko",
            "Min",
            "Mina",
            "Ming",
            "Miriam",
            "Miyoko",
            "Mo",
            "Monika",
            "Mpho",
            "Na",
            "Nadezhda",
            "Nan",
            "Nancy",
            "Natalya",
            "Ngozi",
            "Nicola",
            "Ning",
            "Nittaya",
            "Noam",
            "Nobuko",
            "Nokuthula",
            "Nonhlanhla",
            "Noriko",
            "Nushi",
            "Olga",
            "Omer",
            "Patricia",
            "Paula",
            "Paulina",
            "Peng",
            "Petra",
            "Phonthip",
            "Pilar",
            "Ping",
            "Prani",
            "Purity",
            "Pushpa",
            "Qing",
            "Rachel",
            "Radha",
            "Rattana",
            "Rebecca",
            "Reiko",
            "Rekha",
            "Renate",
            "Rita",
            "Rong",
            "Rosa",
            "Rose",
            "Rut",
            "Ruth",
            "Ryoko",
            "Sabine",
            "Sachiko",
            "Samran",
            "Santosh",
            "Sara",
            "Sarah",
            "Sam",
            "Sammy",
            "Sawat",
            "Shanti",
            "Sharon",
            "Shay",
            "Shizuko",
            "Shoshanah",
            "Sibongile",
            "Sita",
            "Sombat",
            "Sombun",
            "Somchit",
            "Somkhit",
            "Sommai",
            "Somnuek",
            "Somphon",
            "Somphong",
            "Sri",
            "Steinunn",
            "Sukanya",
            "Suman",
            "Sunday",
            "Sunita",
            "Suphaphon",
            "Susan",
            "Susanne",
            "Sushila",
            "Svetlana",
            "Takako",
            "Tamar",
            "Tatyana",
            "Tal",
            "Tebogo",
            "Teruko",
            "Thawi",
            "Tomiko",
            "Toshiko",
            "Unnur",
            "Urai",
            "Urmila",
            "Ursula",
            "Usha",
            "Valentina",
            "Victoria",
            "Wanjiru",
            "Wanphen",
            "Watsana",
            "Wei",
            "Wilai",
            "Xiang",
            "Xiaohong",
            "Xiaoli",
            "Xiaoping",
            "Xiaoyan",
            "Xin",
            "Yael",
            "Yan",
            "Yasuko",
            "Yelena",
            "Yhudiyt",
            "Ying",
            "Yoko",
            "Yong",
            "Yoshie",
            "Yoshiko",
            "Yoshimi",
            "Yu",
            "Yue",
            "Yuko",
            "Yuliya",
            "Yun",
            "Yuval",
            "Zainab",
            "Zandile",
            "Zanele",
            "Zhen"
        ]
    }
};
function randFirstName(options) {
    var _options$withAccents, _options$gender;
    const withAccents = (_options$withAccents = options == null ? void 0 : options.withAccents) != null ? _options$withAccents : false;
    const gender = (_options$gender = options == null ? void 0 : options.gender) != null ? _options$gender : rand([
        "male",
        "female"
    ]);
    const locale = options == null ? void 0 : options.locale;
    const names = withAccents ? locale ? locale == null ? void 0 : locale.withAccents[gender] : data$1f.withAccents[gender] : locale ? locale == null ? void 0 : locale.withoutAccents[gender] : data$1f.withoutAccents[gender];
    return fake(names, options);
}
var data$1e = {
    withAccents: [
        "\xC6bel\xF8",
        "\xC6beltoft",
        "\xC1g\xFAstsd\xF3ttir",
        "\xC1g\xFAstsson",
        "\xC1lvarez",
        "\xC1rnad\xF3ttir",
        "\xC1rnason",
        "\xC1sgeirsd\xF3ttir",
        "\xC3shaikh",
        "Bene\u0161",
        "Bene\u0161ov\xE1",
        "Baldursd\xF3ttir",
        "Birgisd\xF3ttir",
        "Bjarnad\xF3ttir",
        "Bj\xF6rnsd\xF3ttir",
        "Bj\xF6rnsson",
        "B\xF6ttcher",
        "\u010Cern\xE1",
        "\u010Cern\xFD",
        "Ch\xE1vez",
        "\xD0eki\u0107",
        "D\xEDaz",
        "\xD0or\xF0i\u0107",
        "Dvo\u0159\xE1k",
        "Dvo\u0159\xE1kov\xE1",
        "Einarsd\xF3ttir",
        "Fern\xE1ndez",
        "Fialov\xE1",
        "F\xF6rster",
        "Fri\xF0riksson",
        "Fr\xF6hlich",
        "Garc\xEDa",
        "G\xEDslad\xF3ttir",
        "G\xEDslason",
        "G\xF6bel",
        "G\xF3mez",
        "Gro\xDF",
        "Gunnarsd\xF3ttir",
        "Gu\xF0j\xF3nsd\xF3ttir",
        "Gu\xF0j\xF3nsson",
        "Gu\xF0mundsd\xF3ttir",
        "Gu\xF0mundsson",
        "G\xFCnther",
        "Halld\xF3rsd\xF3ttir",
        "Halld\xF3rsson",
        "Guti\xE9rrez",
        "Guzm\xE1n",
        "H\xE1jek",
        "Haraldsd\xF3ttir",
        "Har\xF0ard\xF3ttir",
        "Har\xF0arson",
        "Helgad\xF3ttir",
        "Hern\xE1ndez",
        "Hauksd\xF3ttir",
        "Hor\xE1k",
        "Hor\xE1kov\xE1",
        "Jab\u0142o\u0144ski",
        "J\xE4ger",
        "Jasi\u0144ski",
        "Jim\xE9nez",
        "J\xF3hannesd\xF3ttir",
        "J\xF3hannesson",
        "J\xF3hannsd\xF3ttir",
        "J\xF3hannsson",
        "J\xF3nasd\xF3ttir",
        "J\xF3nasson",
        "J\xF3nsd\xF3ttir",
        "J\xF3nsson",
        "Kami\u0144ski",
        "Karlsd\xF3ttir",
        "Kjartansd\xF3ttir",
        "K\xF6hler",
        "K\xF6nig",
        "Koz\u0142owski",
        "Kr\xE1lov\xE1",
        "Krej\u010D\xED",
        "Kristinsd\xF3ttir",
        "Kristj\xE1nsd\xF3ttir",
        "Kristj\xE1nsson",
        "Kr\xFCger",
        "Ku\u010Dera",
        "Ku\u010Derov\xE1",
        "\u0141api\u0144ski",
        "L\xF6ffler",
        "L\xF3pez",
        "\u0141uczak",
        "\u0141ukaszewski",
        "Magn\xFAsd\xF3ttir",
        "Magn\xFAsson",
        "Markov\xE1",
        "Mart\xEDnez",
        "Mei\xDFner",
        "M\xE9ndez",
        "M\xF6ller",
        "M\xFCller",
        "Mu\xF1oz",
        "Nov\xE1k",
        "Nov\xE1kov\xE1",
        "Novotn\xE1",
        "Novotn\xFD",
        "Nu\xF1ez",
        "N\xFA\xF1ez",
        "\xD8deg\xE5rd",
        "\u0150hlschl\xE4gerov\xE1",
        "\xD3lafsd\xF3ttir",
        "\xD3lafsson",
        "\u0150ll\xF6sov\xE1",
        "Olszewski",
        "\u0150ri",
        "\u0150rs\xE9gi-Z\xF6lderd\u0151",
        "\xD3skarsd\xF3ttir",
        "\xD3skarsson",
        "\xD8verg\xE5rd",
        "\u0150zse",
        "P\xE1lsd\xF3ttir",
        "P\xE1lsson",
        "Paw\u0142owski",
        "Pe\xF1a",
        "P\xE9rez",
        "P\xE9tursd\xF3ttir",
        "P\xE9tursson",
        "Pokorn\xE1",
        "Pokorn\xFD",
        "Posp\xED\u0161il",
        "Posp\xED\u0161ilov\xE1",
        "Proch\xE1zka",
        "Proch\xE1zkov\xE1",
        "Ragnarsd\xF3ttir",
        "Ram\xEDrez",
        "R\xEDos",
        "Rodr\xEDguez",
        "S\xE1nchez",
        "Sch\xE4fer",
        "Schr\xF6der",
        "Sch\xFCtz",
        "Sigur\xF0ard\xF3ttir",
        "Sigur\xF0sson",
        "Sigurj\xF3nsd\xF3ttir",
        "Sigurj\xF3nsson",
        "Soko\u0142owski",
        "Stef\xE1nsd\xF3ttir",
        "Stef\xE1nsson",
        "Sveinsd\xF3ttir",
        "Svobodov\xE1",
        "Szczepa\u0144ski",
        "Szyma\u0144ski",
        "Urba\u0144ski",
        "\u016Asas",
        "\u016A\u017Eien",
        "V\xE1squez",
        "Vesel\xE1",
        "Vesel\xFD",
        "Wei\xDF",
        "\u017Bak",
        "\u017D\xE1kov\xE1",
        "Zemanov\xE1",
        "Zieli\u0144ski",
        "\u017Dukauskas",
        "\u017Dukauskien\u0117",
        "\xDE\xF3r\xF0ard\xF3ttir",
        "\xDE\xF3r\xF0arson",
        "\xDEorsteinsd\xF3ttir",
        "\xDEorsteinsson"
    ],
    withoutAccents: [
        "Abdi",
        "Abdullahi",
        "Abe",
        "Abubakar",
        "Achieng",
        "Adamczyk",
        "Adamu",
        "Adan",
        "Adebayo",
        "Adhiambo",
        "Adri",
        "Agbaria",
        "Aguilar",
        "Ahmad",
        "Ahmed",
        "Akinyi",
        "Akpan",
        "Ali",
        "Aliev",
        "Aliyu",
        "Allen",
        "Alonso",
        "Alvarez",
        "Amadi",
        "Aminu",
        "Andreev",
        "Andreeva",
        "Ansari",
        "Anyango",
        "Aoki",
        "Arai",
        "Arnarson",
        "Ashknaziy",
        "Atieno",
        "Attias",
        "Audu",
        "Avraham",
        "Ayutthaya",
        "Azulay",
        "Baba",
        "Bai",
        "Bailey",
        "Baker",
        "Bakker",
        "Bala",
        "Baldursson",
        "Baloyi",
        "Baran",
        "Barasa",
        "Barman",
        "Bauer",
        "Becker",
        "Begam",
        "Begum",
        "Behera",
        "Bekher",
        "Bello",
        "Bennett",
        "Ber",
        "Bevan",
        "Bibi",
        "Birgisson",
        "Biswas",
        "Bitton",
        "Bjarnason",
        "Blanco",
        "Blom",
        "Borkowski",
        "Bos",
        "Botha",
        "Bowen",
        "Braun",
        "Brouwer",
        "Brown",
        "Bunma",
        "Bunmi",
        "Bunsi",
        "Buthelezi",
        "Cai",
        "Cano",
        "Cao",
        "Carter",
        "Castillo",
        "Castro",
        "Cele",
        "Ceng",
        "Chaichana",
        "Chand",
        "Chanthara",
        "Chauke",
        "Chebet",
        "Chen",
        "Cheng",
        "Chepkemoi",
        "Cherinsuk",
        "Cheruiyot",
        "Chided",
        "Chmielewski",
        "Chukwu",
        "Clark",
        "Clarke",
        "Coetzee",
        "Cohen",
        "Collins",
        "Cook",
        "Cooper",
        "Cortes",
        "Cruz",
        "Cui",
        "Czarnecki",
        "Dahan",
        "Dai",
        "Das",
        "Dauda",
        "David",
        "Davies",
        "Davis",
        "Dayan",
        "De-Bruijn",
        "De-Graaf",
        "De-Groot",
        "De-Jong",
        "Dekker",
        "Delgado",
        "Deng",
        "Devi",
        "Diaz",
        "Dijkstra",
        "Ding",
        "Dlamini",
        "Dominguez",
        "Dong",
        "Du-Plessis",
        "Dube",
        "Duda",
        "Dudek",
        "Dumont",
        "Edwards",
        "Egorov",
        "Egorova",
        "Einarsson",
        "Elbaz",
        "Eliyahu",
        "Ellis",
        "Emmanuel",
        "Endo",
        "Espinoza",
        "Esteban",
        "Evans",
        "Eze",
        "Fan",
        "Fang",
        "Feldman",
        "Feng",
        "Fernandez",
        "Fiala",
        "Fischer",
        "Flores",
        "Friedman",
        "Frolova",
        "Fu",
        "Fuchs",
        "Fujii",
        "Fujita",
        "Fukuda",
        "Gaby",
        "Gao",
        "Garba",
        "Garcia",
        "Garrido",
        "Garza",
        "Ghosh",
        "Gil",
        "Golan",
        "Goldstein",
        "Gomez",
        "Gonzales",
        "Gonzalez",
        "Goto",
        "Govender",
        "Grabowski",
        "Green",
        "Greenberg",
        "Griffiths",
        "Gu",
        "Guerrero",
        "Gumede",
        "Gunnarsson",
        "Guo",
        "Gupta",
        "Gutierrez",
        "Hahn",
        "Hall",
        "Han",
        "Haraldsson",
        "Harle",
        "Harle-Cowan",
        "Harris",
        "Harrison",
        "Hartmann",
        "Haruna",
        "Hasegawa",
        "Hashimoto",
        "Hasna",
        "Hassan",
        "Hauksson",
        "Hayashi",
        "He",
        "Helgason",
        "Hen",
        "Hendriks",
        "Herbulot",
        "Hernandez",
        "Herrera",
        "Herrmann",
        "Hill",
        "Hoekstra",
        "Hoffmann",
        "Hofmann",
        "Hongthong",
        "Hopkins",
        "Howells",
        "Hu",
        "Huang",
        "Huber",
        "Hughes",
        "Huisman",
        "Hussein",
        "Ibrahim",
        "Idris",
        "Iglesias",
        "Igwe",
        "Ikeda",
        "Inoue",
        "Isa",
        "Isaac",
        "Isah",
        "Ishii",
        "Ishikawa",
        "Ito",
        "Ivanov",
        "Ivanova",
        "Jabarin",
        "Jackson",
        "Jacobs",
        "Jadhav",
        "Jakubowski",
        "James",
        "Jankowski",
        "Jansen",
        "Janssen",
        "Jaworski",
        "Jenkins",
        "Jia",
        "Jiang",
        "Jimenez",
        "Jin",
        "John",
        "Johnson",
        "Jones",
        "Joseph",
        "Juma",
        "Jung",
        "Kaczmarek",
        "Kaiser",
        "Kamau",
        "Karanja",
        "Kariuki",
        "Karlsson",
        "Kato",
        "Katz",
        "Kaur",
        "Keller",
        "Khan",
        "Khatib",
        "Khatoon",
        "Khatun",
        "Khoury",
        "Khoza",
        "Khumalo",
        "Kibet",
        "Kikuchi",
        "Kim",
        "Kimani",
        "Kimura",
        "King",
        "Kjartansson",
        "Klein",
        "Kobayashi",
        "Koch",
        "Koech",
        "Kok",
        "Kondo",
        "Kongkaeo",
        "Koster",
        "Kovalenko",
        "Kowalczyk",
        "Kowalski",
        "Kozlov",
        "Kozlova",
        "Krause",
        "Krawczyk",
        "Kristinsson",
        "Kubiak",
        "Kucharski",
        "Kuipers",
        "Kumar",
        "Kumari",
        "Kuznetsov",
        "Kuznetsova",
        "Kwiatkowski",
        "Lal",
        "Lang",
        "Langat",
        "Lange",
        "Lavyan",
        "Lawal",
        "Lebedeva",
        "Lee",
        "Lehmann",
        "Levy",
        "Lewandowski",
        "Lewis",
        "Li",
        "Liang",
        "Liao",
        "Lim",
        "Lin",
        "Lis",
        "Liu",
        "Llewellyn",
        "Lloyd",
        "Lopez",
        "Lozano",
        "Lu",
        "Luo",
        "Ma",
        "Maas",
        "Mabaso",
        "Macharia",
        "Maciejewski",
        "Maeda",
        "Magomedov",
        "Mahagna",
        "Mahato",
        "Mahlangu",
        "Mahto",
        "Maier",
        "Maina",
        "Majewski",
        "Makarov",
        "Makarova",
        "Malinowski",
        "Malkah",
        "Maluleke",
        "Mandal",
        "Marciniak",
        "Marek",
        "Marin",
        "Martin",
        "Martinez",
        "Masarweh",
        "Maseko",
        "Mathebula",
        "Matsumoto",
        "Matthews",
        "Mayer",
        "Mazibuko",
        "Mazur",
        "Mazurek",
        "Mbatha",
        "Medina",
        "Meier",
        "Meijer",
        "Mendoza",
        "Meng",
        "Meyer",
        "Mhamid",
        "Mhlongo",
        "Michalak",
        "Michalski",
        "Mikhaylov",
        "Mikhaylova",
        "Mishra",
        "Mitchell",
        "Mizrahi",
        "Mkhize",
        "Mofokeng",
        "Mohamed",
        "Mohammed",
        "Mokoena",
        "Molefe",
        "Molina",
        "Mondal",
        "Moore",
        "Mor",
        "Morales",
        "Moreno",
        "Morgan",
        "Mori",
        "Morozov",
        "Morozova",
        "Morris",
        "Moshe",
        "Mthembu",
        "Mthethwa",
        "Mtshali",
        "Muhammad",
        "Muhammadu",
        "Muhammed",
        "Mulder",
        "Murakami",
        "Musa",
        "Mustapha",
        "Muthoni",
        "Mutua",
        "Mutuku",
        "Mwangi",
        "Naidoo",
        "Nakajima",
        "Nakamura",
        "Nakano",
        "Navarro",
        "Nayak",
        "Ndlovu",
        "Nel",
        "Neumann",
        "Ngcobo",
        "Ngobeni",
        "Ngubane",
        "Nguyen",
        "Ngwenya",
        "Nikitina",
        "Nikolaev",
        "Nikolaeva",
        "Njeri",
        "Njoroge",
        "Njuguna",
        "Nkosi",
        "Novikov",
        "Novikova",
        "Nowak",
        "Nowakowski",
        "Nowicki",
        "Ntuli",
        "Nxumalo",
        "Nyambura",
        "Oakley",
        "Ochieng",
        "Odhiambo",
        "Ogawa",
        "Ohana",
        "Ohayon",
        "Ojo",
        "Okada",
        "Okafor",
        "Okeke",
        "Okon",
        "Okoro",
        "Okoth",
        "Omar",
        "Omer",
        "Omondi",
        "Ono",
        "Onyango",
        "Ortega",
        "Ortiz",
        "Ostrowski",
        "Ota",
        "Otieno",
        "Ouma",
        "Owen",
        "Owino",
        "Pal",
        "Pan",
        "Panya",
        "Paramar",
        "Parker",
        "Parry",
        "Paswan",
        "Patel",
        "Patil",
        "Pavlov",
        "Pavlova",
        "Pawlak",
        "Peeters",
        "Peng",
        "Peretz",
        "Perez",
        "Peter",
        "Peters",
        "Petrov",
        "Petrova",
        "Pfeiffer",
        "Phillips",
        "Photsi",
        "Pietrzak",
        "Pillay",
        "Piotrowski",
        "Popov",
        "Popova",
        "Powell",
        "Prasad",
        "Pretorius",
        "Price",
        "Prieto",
        "Prins",
        "Pritchard",
        "Pugh",
        "Qiu",
        "Rabiu",
        "Radebe",
        "Ragnarsson",
        "Ram",
        "Ramirez",
        "Ramos",
        "Rani",
        "Rathod",
        "Ray",
        "Rees",
        "Ren",
        "Reuben",
        "Reyes",
        "Richards",
        "Richardson",
        "Richter",
        "Rivera",
        "Roberts",
        "Robinson",
        "Rodriguez",
        "Rogers",
        "Romanov",
        "Romanova",
        "Romero",
        "Rosenberg",
        "Rotich",
        "Rowlands",
        "Roy",
        "Rubio",
        "Ruiz",
        "Rungrueang",
        "Rumbelow",
        "Rutkowski",
        "Sadowski",
        "Saeli",
        "Saelim",
        "Saengthong",
        "Saetan",
        "Saetang",
        "Saeueng",
        "Sah",
        "Saha",
        "Sahu",
        "Saidu",
        "Saito",
        "Sakai",
        "Sakamoto",
        "Salazar",
        "Salisu",
        "Samuel",
        "Sanchez",
        "Sangthong",
        "Sani",
        "Santiago",
        "Santos",
        "Sanz",
        "Sarkar",
        "Sasaki",
        "Sato",
        "Sawicki",
        "Schmid",
        "Schmidt",
        "Schmitt",
        "Schmitz",
        "Schneider",
        "Scholz",
        "Schouten",
        "Schulz",
        "Schulze",
        "Schwartz",
        "Schwarz",
        "Scott",
        "Segel",
        "Sekh",
        "Sergeeva",
        "Serrano",
        "Shaikh",
        "Shalom",
        "Shapiro",
        "Sharabi",
        "Sharma",
        "Shaw",
        "Shehu",
        "Shemesh",
        "Shevchenko",
        "Shi",
        "Shimizu",
        "Sibiya",
        "Sichantha",
        "Sikora",
        "Simiyu",
        "Singh",
        "Sisuk",
        "Sithole",
        "Sitwat",
        "Smee",
        "Smirnov",
        "Smirnova",
        "Smit",
        "Smith",
        "Smits",
        "Sokolov",
        "Sokolova",
        "Sombun",
        "Song",
        "Soto",
        "Smoakley",
        "Starr",
        "Stepanov",
        "Stepanova",
        "Su",
        "Suad",
        "Suarez",
        "Suissa",
        "Sukkasem",
        "Sulaiman",
        "Suleiman",
        "Sun",
        "Sunday",
        "Suwan",
        "Suzuki",
        "Sveinsson",
        "Svoboda",
        "Szewczyk",
        "Takahashi",
        "Takeuchi",
        "Tal",
        "Tan",
        "Tanaka",
        "Tang",
        "Taylor",
        "Thakur",
        "Thomas",
        "Thompson",
        "Thongdi",
        "Thongkham",
        "Thongsuk",
        "Tian",
        "Tomaszewski",
        "Torres",
        "Tshabalala",
        "Turner",
        "Udo",
        "Ueda",
        "Umar",
        "Umaru",
        "Usman",
        "Vaknin",
        "Valdez",
        "Van-Beek",
        "Van-Dam",
        "Van-den-Berg",
        "Van-der-Heijden",
        "Van-der-Linden",
        "Van-Dijk",
        "Vargas",
        "Vasilev",
        "Vasileva",
        "Vazquez",
        "Vega",
        "Venter",
        "Verhoeven",
        "Vermeulen",
        "Visser",
        "Volkov",
        "Volkova",
        "Vos",
        "Wafula",
        "Wagner",
        "Wairimu",
        "Walczak",
        "Walker",
        "Walter",
        "Walters",
        "Wambua",
        "Wambui",
        "Wang",
        "Wangui",
        "Wanjala",
        "Wanjiku",
        "Ward",
        "Watanabe",
        "Watkins",
        "Watson",
        "Weber",
        "Wei",
        "Wekesa",
        "Wen",
        "Werner",
        "White",
        "Wieczorek",
        "Wilk",
        "Willems",
        "Williams",
        "Wilson",
        "Witkowski",
        "Wojciechowski",
        "Wolf",
        "Wood",
        "Wright",
        "Wu",
        "Xiao",
        "Xie",
        "Xu",
        "Yaakv",
        "Yadav",
        "Yahaya",
        "Yakovleva",
        "Yakubu",
        "Yamada",
        "Yamaguchi",
        "Yamamoto",
        "Yamashita",
        "Yamazaki",
        "Yan",
        "Yang",
        "Yao",
        "Ye",
        "Yin",
        "Yosef",
        "Yoshida",
        "Young",
        "Yu",
        "Yuan",
        "Yusuf",
        "Zajac",
        "Zakharov",
        "Zakharova",
        "Zalewski",
        "Zawadzki",
        "Zaytseva",
        "Zhang",
        "Zhao",
        "Zheng",
        "Zhong",
        "Zhou",
        "Zhu",
        "Zimmermann",
        "Zoabi",
        "Zulu",
        "Zwane"
    ]
};
function randLastName(options) {
    var _options$withAccents;
    const withAccents = (_options$withAccents = options == null ? void 0 : options.withAccents) != null ? _options$withAccents : randBoolean();
    const names = withAccents ? data$1e["withAccents"] : data$1e["withoutAccents"];
    return fake(names, options);
}
function randFormattedName(options) {
    var _options$firstName, _options$lastName;
    let separator = "";
    const firstName = (_options$firstName = options == null ? void 0 : options.firstName) != null ? _options$firstName : randFirstName({
        withAccents: false
    });
    const lastName = (_options$lastName = options == null ? void 0 : options.lastName) != null ? _options$lastName : randLastName({
        withAccents: false
    });
    if (!(options != null && options.nameSeparator)) {
        separator = fake([
            ".",
            "-",
            "_",
            "+",
            ""
        ]);
    } else if (options.nameSeparator !== "none") {
        separator = options.nameSeparator;
    }
    let name = `${firstName} ${lastName}`.replace(" ", separator);
    if (randBoolean()) {
        name += randNumber({
            min: 1,
            max: 1e3
        });
    }
    return name.toLowerCase();
}
function randEmail(options) {
    const factory = ()=>{
        const emailProvider = (options == null ? void 0 : options.provider) || randEmailProvider();
        const formattedName = randFormattedName(options);
        const emailSuffix = (options == null ? void 0 : options.suffix) || randDomainSuffix();
        return `${formattedName}@${emailProvider}.${emailSuffix}`;
    };
    return fake(factory, options);
}
var data$1d = [
    "\u{1F600}",
    "\u{1F603}",
    "\u{1F604}",
    "\u{1F601}",
    "\u{1F606}",
    "\u{1F605}",
    "\u{1F923}",
    "\u{1F602}",
    "\u{1F642}",
    "\u{1F643}",
    "\u{1F609}",
    "\u{1F60A}",
    "\u{1F607}",
    "\u{1F970}",
    "\u{1F60D}",
    "\u{1F929}",
    "\u{1F618}",
    "\u{1F617}",
    "\u263A\uFE0F",
    "\u{1F61A}",
    "\u{1F619}",
    "\u{1F972}",
    "\u{1F60B}",
    "\u{1F61B}",
    "\u{1F61C}",
    "\u{1F92A}",
    "\u{1F61D}",
    "\u{1F911}",
    "\u{1F917}",
    "\u{1F92D}",
    "\u{1F92B}",
    "\u{1F914}",
    "\u{1F910}",
    "\u{1F928}",
    "\u{1F610}",
    "\u{1F611}",
    "\u{1F636}",
    "\u{1F636}\u200D\u{1F32B}\uFE0F",
    "\u{1F60F}",
    "\u{1F612}",
    "\u{1F644}",
    "\u{1F62C}",
    "\u{1F62E}\u200D\u{1F4A8}",
    "\u{1F925}",
    "\u{1F60C}",
    "\u{1F614}",
    "\u{1F62A}",
    "\u{1F924}",
    "\u{1F634}",
    "\u{1F637}",
    "\u{1F912}",
    "\u{1F915}",
    "\u{1F922}",
    "\u{1F92E}",
    "\u{1F927}",
    "\u{1F975}",
    "\u{1F976}",
    "\u{1F974}",
    "\u{1F635}",
    "\u{1F635}\u200D\u{1F4AB}",
    "\u{1F92F}",
    "\u{1F920}",
    "\u{1F973}",
    "\u{1F978}",
    "\u{1F60E}",
    "\u{1F913}",
    "\u{1F9D0}",
    "\u{1F615}",
    "\u{1F61F}",
    "\u{1F641}",
    "\u2639\uFE0F",
    "\u{1F62E}",
    "\u{1F62F}",
    "\u{1F632}",
    "\u{1F633}",
    "\u{1F97A}",
    "\u{1F626}",
    "\u{1F627}",
    "\u{1F628}",
    "\u{1F630}",
    "\u{1F625}",
    "\u{1F622}",
    "\u{1F62D}",
    "\u{1F631}",
    "\u{1F616}",
    "\u{1F623}",
    "\u{1F61E}",
    "\u{1F613}",
    "\u{1F629}",
    "\u{1F62B}",
    "\u{1F971}",
    "\u{1F624}",
    "\u{1F621}",
    "\u{1F620}",
    "\u{1F92C}",
    "\u{1F608}",
    "\u{1F47F}",
    "\u{1F480}",
    "\u2620\uFE0F",
    "\u{1F4A9}",
    "\u{1F921}",
    "\u{1F479}",
    "\u{1F47A}",
    "\u{1F47B}",
    "\u{1F47D}",
    "\u{1F47E}",
    "\u{1F916}",
    "\u{1F63A}",
    "\u{1F638}",
    "\u{1F639}",
    "\u{1F63B}",
    "\u{1F63C}",
    "\u{1F63D}",
    "\u{1F640}",
    "\u{1F63F}",
    "\u{1F63E}",
    "\u{1F648}",
    "\u{1F649}",
    "\u{1F64A}",
    "\u{1F48B}",
    "\u{1F48C}",
    "\u{1F498}",
    "\u{1F49D}",
    "\u{1F496}",
    "\u{1F497}",
    "\u{1F493}",
    "\u{1F49E}",
    "\u{1F495}",
    "\u{1F49F}",
    "\u2763\uFE0F",
    "\u{1F494}",
    "\u2764\uFE0F\u200D\u{1F525}",
    "\u2764\uFE0F\u200D\u{1FA79}",
    "\u2764\uFE0F",
    "\u{1F9E1}",
    "\u{1F49B}",
    "\u{1F49A}",
    "\u{1F499}",
    "\u{1F49C}",
    "\u{1F90E}",
    "\u{1F5A4}",
    "\u{1F90D}",
    "\u{1F4AF}",
    "\u{1F4A2}",
    "\u{1F4A5}",
    "\u{1F4AB}",
    "\u{1F4A6}",
    "\u{1F4A8}",
    "\u{1F573}\uFE0F",
    "\u{1F4A3}",
    "\u{1F4AC}",
    "\u{1F441}\uFE0F\u200D\u{1F5E8}\uFE0F",
    "\u{1F5E8}\uFE0F",
    "\u{1F5EF}\uFE0F",
    "\u{1F4AD}",
    "\u{1F4A4}",
    "\u{1F44B}",
    "\u{1F91A}",
    "\u{1F590}\uFE0F",
    "\u270B",
    "\u{1F596}",
    "\u{1F44C}",
    "\u{1F90C}",
    "\u{1F90F}",
    "\u270C\uFE0F",
    "\u{1F91E}",
    "\u{1F91F}",
    "\u{1F918}",
    "\u{1F919}",
    "\u{1F448}",
    "\u{1F449}",
    "\u{1F446}",
    "\u{1F595}",
    "\u{1F447}",
    "\u261D\uFE0F",
    "\u{1F44D}",
    "\u{1F44E}",
    "\u270A",
    "\u{1F44A}",
    "\u{1F91B}",
    "\u{1F91C}",
    "\u{1F44F}",
    "\u{1F64C}",
    "\u{1F450}",
    "\u{1F932}",
    "\u{1F91D}",
    "\u{1F64F}",
    "\u270D\uFE0F",
    "\u{1F485}",
    "\u{1F933}",
    "\u{1F4AA}",
    "\u{1F9BE}",
    "\u{1F9BF}",
    "\u{1F9B5}",
    "\u{1F9B6}",
    "\u{1F442}",
    "\u{1F9BB}",
    "\u{1F443}",
    "\u{1F9E0}",
    "\u{1FAC0}",
    "\u{1FAC1}",
    "\u{1F9B7}",
    "\u{1F9B4}",
    "\u{1F440}",
    "\u{1F441}\uFE0F",
    "\u{1F445}",
    "\u{1F444}",
    "\u{1F476}",
    "\u{1F9D2}",
    "\u{1F466}",
    "\u{1F467}",
    "\u{1F9D1}",
    "\u{1F471}",
    "\u{1F468}",
    "\u{1F9D4}",
    "\u{1F9D4}\u200D\u2642\uFE0F",
    "\u{1F9D4}\u200D\u2640\uFE0F",
    "\u{1F468}\u200D\u{1F9B0}",
    "\u{1F468}\u200D\u{1F9B1}",
    "\u{1F468}\u200D\u{1F9B3}",
    "\u{1F468}\u200D\u{1F9B2}",
    "\u{1F469}",
    "\u{1F469}\u200D\u{1F9B0}",
    "\u{1F9D1}\u200D\u{1F9B0}",
    "\u{1F469}\u200D\u{1F9B1}",
    "\u{1F9D1}\u200D\u{1F9B1}",
    "\u{1F469}\u200D\u{1F9B3}",
    "\u{1F9D1}\u200D\u{1F9B3}",
    "\u{1F469}\u200D\u{1F9B2}",
    "\u{1F9D1}\u200D\u{1F9B2}",
    "\u{1F471}\u200D\u2640\uFE0F",
    "\u{1F471}\u200D\u2642\uFE0F",
    "\u{1F9D3}",
    "\u{1F474}",
    "\u{1F475}",
    "\u{1F64D}",
    "\u{1F64D}\u200D\u2642\uFE0F",
    "\u{1F64D}\u200D\u2640\uFE0F",
    "\u{1F64E}",
    "\u{1F64E}\u200D\u2642\uFE0F",
    "\u{1F64E}\u200D\u2640\uFE0F",
    "\u{1F645}",
    "\u{1F645}\u200D\u2642\uFE0F",
    "\u{1F645}\u200D\u2640\uFE0F",
    "\u{1F646}",
    "\u{1F646}\u200D\u2642\uFE0F",
    "\u{1F646}\u200D\u2640\uFE0F",
    "\u{1F481}",
    "\u{1F481}\u200D\u2642\uFE0F",
    "\u{1F481}\u200D\u2640\uFE0F",
    "\u{1F64B}",
    "\u{1F64B}\u200D\u2642\uFE0F",
    "\u{1F64B}\u200D\u2640\uFE0F",
    "\u{1F9CF}",
    "\u{1F9CF}\u200D\u2642\uFE0F",
    "\u{1F9CF}\u200D\u2640\uFE0F",
    "\u{1F647}",
    "\u{1F647}\u200D\u2642\uFE0F",
    "\u{1F647}\u200D\u2640\uFE0F",
    "\u{1F926}",
    "\u{1F926}\u200D\u2642\uFE0F",
    "\u{1F926}\u200D\u2640\uFE0F",
    "\u{1F937}",
    "\u{1F937}\u200D\u2642\uFE0F",
    "\u{1F937}\u200D\u2640\uFE0F",
    "\u{1F9D1}\u200D\u2695\uFE0F",
    "\u{1F468}\u200D\u2695\uFE0F",
    "\u{1F469}\u200D\u2695\uFE0F",
    "\u{1F9D1}\u200D\u{1F393}",
    "\u{1F468}\u200D\u{1F393}",
    "\u{1F469}\u200D\u{1F393}",
    "\u{1F9D1}\u200D\u{1F3EB}",
    "\u{1F468}\u200D\u{1F3EB}",
    "\u{1F469}\u200D\u{1F3EB}",
    "\u{1F9D1}\u200D\u2696\uFE0F",
    "\u{1F468}\u200D\u2696\uFE0F",
    "\u{1F469}\u200D\u2696\uFE0F",
    "\u{1F9D1}\u200D\u{1F33E}",
    "\u{1F468}\u200D\u{1F33E}",
    "\u{1F469}\u200D\u{1F33E}",
    "\u{1F9D1}\u200D\u{1F373}",
    "\u{1F468}\u200D\u{1F373}",
    "\u{1F469}\u200D\u{1F373}",
    "\u{1F9D1}\u200D\u{1F527}",
    "\u{1F468}\u200D\u{1F527}",
    "\u{1F469}\u200D\u{1F527}",
    "\u{1F9D1}\u200D\u{1F3ED}",
    "\u{1F468}\u200D\u{1F3ED}",
    "\u{1F469}\u200D\u{1F3ED}",
    "\u{1F9D1}\u200D\u{1F4BC}",
    "\u{1F468}\u200D\u{1F4BC}",
    "\u{1F469}\u200D\u{1F4BC}",
    "\u{1F9D1}\u200D\u{1F52C}",
    "\u{1F468}\u200D\u{1F52C}",
    "\u{1F469}\u200D\u{1F52C}",
    "\u{1F9D1}\u200D\u{1F4BB}",
    "\u{1F468}\u200D\u{1F4BB}",
    "\u{1F469}\u200D\u{1F4BB}",
    "\u{1F9D1}\u200D\u{1F3A4}",
    "\u{1F468}\u200D\u{1F3A4}",
    "\u{1F469}\u200D\u{1F3A4}",
    "\u{1F9D1}\u200D\u{1F3A8}",
    "\u{1F468}\u200D\u{1F3A8}",
    "\u{1F469}\u200D\u{1F3A8}",
    "\u{1F9D1}\u200D\u2708\uFE0F",
    "\u{1F468}\u200D\u2708\uFE0F",
    "\u{1F469}\u200D\u2708\uFE0F",
    "\u{1F9D1}\u200D\u{1F680}",
    "\u{1F468}\u200D\u{1F680}",
    "\u{1F469}\u200D\u{1F680}",
    "\u{1F9D1}\u200D\u{1F692}",
    "\u{1F468}\u200D\u{1F692}",
    "\u{1F469}\u200D\u{1F692}",
    "\u{1F46E}",
    "\u{1F46E}\u200D\u2642\uFE0F",
    "\u{1F46E}\u200D\u2640\uFE0F",
    "\u{1F575}\uFE0F",
    "\u{1F575}\uFE0F\u200D\u2642\uFE0F",
    "\u{1F575}\uFE0F\u200D\u2640\uFE0F",
    "\u{1F482}",
    "\u{1F482}\u200D\u2642\uFE0F",
    "\u{1F482}\u200D\u2640\uFE0F",
    "\u{1F977}",
    "\u{1F477}",
    "\u{1F477}\u200D\u2642\uFE0F",
    "\u{1F477}\u200D\u2640\uFE0F",
    "\u{1F934}",
    "\u{1F478}",
    "\u{1F473}",
    "\u{1F473}\u200D\u2642\uFE0F",
    "\u{1F473}\u200D\u2640\uFE0F",
    "\u{1F472}",
    "\u{1F9D5}",
    "\u{1F935}",
    "\u{1F935}\u200D\u2642\uFE0F",
    "\u{1F935}\u200D\u2640\uFE0F",
    "\u{1F470}",
    "\u{1F470}\u200D\u2642\uFE0F",
    "\u{1F470}\u200D\u2640\uFE0F",
    "\u{1F930}",
    "\u{1F931}",
    "\u{1F469}\u200D\u{1F37C}",
    "\u{1F468}\u200D\u{1F37C}",
    "\u{1F9D1}\u200D\u{1F37C}",
    "\u{1F47C}",
    "\u{1F385}",
    "\u{1F936}",
    "\u{1F9D1}\u200D\u{1F384}",
    "\u{1F9B8}",
    "\u{1F9B8}\u200D\u2642\uFE0F",
    "\u{1F9B8}\u200D\u2640\uFE0F",
    "\u{1F9B9}",
    "\u{1F9B9}\u200D\u2642\uFE0F",
    "\u{1F9B9}\u200D\u2640\uFE0F",
    "\u{1F9D9}",
    "\u{1F9D9}\u200D\u2642\uFE0F",
    "\u{1F9D9}\u200D\u2640\uFE0F",
    "\u{1F9DA}",
    "\u{1F9DA}\u200D\u2642\uFE0F",
    "\u{1F9DA}\u200D\u2640\uFE0F",
    "\u{1F9DB}",
    "\u{1F9DB}\u200D\u2642\uFE0F",
    "\u{1F9DB}\u200D\u2640\uFE0F",
    "\u{1F9DC}",
    "\u{1F9DC}\u200D\u2642\uFE0F",
    "\u{1F9DC}\u200D\u2640\uFE0F",
    "\u{1F9DD}",
    "\u{1F9DD}\u200D\u2642\uFE0F",
    "\u{1F9DD}\u200D\u2640\uFE0F",
    "\u{1F9DE}",
    "\u{1F9DE}\u200D\u2642\uFE0F",
    "\u{1F9DE}\u200D\u2640\uFE0F",
    "\u{1F9DF}",
    "\u{1F9DF}\u200D\u2642\uFE0F",
    "\u{1F9DF}\u200D\u2640\uFE0F",
    "\u{1F486}",
    "\u{1F486}\u200D\u2642\uFE0F",
    "\u{1F486}\u200D\u2640\uFE0F",
    "\u{1F487}",
    "\u{1F487}\u200D\u2642\uFE0F",
    "\u{1F487}\u200D\u2640\uFE0F",
    "\u{1F6B6}",
    "\u{1F6B6}\u200D\u2642\uFE0F",
    "\u{1F6B6}\u200D\u2640\uFE0F",
    "\u{1F9CD}",
    "\u{1F9CD}\u200D\u2642\uFE0F",
    "\u{1F9CD}\u200D\u2640\uFE0F",
    "\u{1F9CE}",
    "\u{1F9CE}\u200D\u2642\uFE0F",
    "\u{1F9CE}\u200D\u2640\uFE0F",
    "\u{1F9D1}\u200D\u{1F9AF}",
    "\u{1F468}\u200D\u{1F9AF}",
    "\u{1F469}\u200D\u{1F9AF}",
    "\u{1F9D1}\u200D\u{1F9BC}",
    "\u{1F468}\u200D\u{1F9BC}",
    "\u{1F469}\u200D\u{1F9BC}",
    "\u{1F9D1}\u200D\u{1F9BD}",
    "\u{1F468}\u200D\u{1F9BD}",
    "\u{1F469}\u200D\u{1F9BD}",
    "\u{1F3C3}",
    "\u{1F3C3}\u200D\u2642\uFE0F",
    "\u{1F3C3}\u200D\u2640\uFE0F",
    "\u{1F483}",
    "\u{1F57A}",
    "\u{1F574}\uFE0F",
    "\u{1F46F}",
    "\u{1F46F}\u200D\u2642\uFE0F",
    "\u{1F46F}\u200D\u2640\uFE0F",
    "\u{1F9D6}",
    "\u{1F9D6}\u200D\u2642\uFE0F",
    "\u{1F9D6}\u200D\u2640\uFE0F",
    "\u{1F9D7}",
    "\u{1F9D7}\u200D\u2642\uFE0F",
    "\u{1F9D7}\u200D\u2640\uFE0F",
    "\u{1F93A}",
    "\u{1F3C7}",
    "\u26F7\uFE0F",
    "\u{1F3C2}",
    "\u{1F3CC}\uFE0F",
    "\u{1F3CC}\uFE0F\u200D\u2642\uFE0F",
    "\u{1F3CC}\uFE0F\u200D\u2640\uFE0F",
    "\u{1F3C4}",
    "\u{1F3C4}\u200D\u2642\uFE0F",
    "\u{1F3C4}\u200D\u2640\uFE0F",
    "\u{1F6A3}",
    "\u{1F6A3}\u200D\u2642\uFE0F",
    "\u{1F6A3}\u200D\u2640\uFE0F",
    "\u{1F3CA}",
    "\u{1F3CA}\u200D\u2642\uFE0F",
    "\u{1F3CA}\u200D\u2640\uFE0F",
    "\u26F9\uFE0F",
    "\u26F9\uFE0F\u200D\u2642\uFE0F",
    "\u26F9\uFE0F\u200D\u2640\uFE0F",
    "\u{1F3CB}\uFE0F",
    "\u{1F3CB}\uFE0F\u200D\u2642\uFE0F",
    "\u{1F3CB}\uFE0F\u200D\u2640\uFE0F",
    "\u{1F6B4}",
    "\u{1F6B4}\u200D\u2642\uFE0F",
    "\u{1F6B4}\u200D\u2640\uFE0F",
    "\u{1F6B5}",
    "\u{1F6B5}\u200D\u2642\uFE0F",
    "\u{1F6B5}\u200D\u2640\uFE0F",
    "\u{1F938}",
    "\u{1F938}\u200D\u2642\uFE0F",
    "\u{1F938}\u200D\u2640\uFE0F",
    "\u{1F93C}",
    "\u{1F93C}\u200D\u2642\uFE0F",
    "\u{1F93C}\u200D\u2640\uFE0F",
    "\u{1F93D}",
    "\u{1F93D}\u200D\u2642\uFE0F",
    "\u{1F93D}\u200D\u2640\uFE0F",
    "\u{1F93E}",
    "\u{1F93E}\u200D\u2642\uFE0F",
    "\u{1F93E}\u200D\u2640\uFE0F",
    "\u{1F939}",
    "\u{1F939}\u200D\u2642\uFE0F",
    "\u{1F939}\u200D\u2640\uFE0F",
    "\u{1F9D8}",
    "\u{1F9D8}\u200D\u2642\uFE0F",
    "\u{1F9D8}\u200D\u2640\uFE0F",
    "\u{1F6C0}",
    "\u{1F6CC}",
    "\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1}",
    "\u{1F46D}",
    "\u{1F46B}",
    "\u{1F46C}",
    "\u{1F48F}",
    "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}",
    "\u{1F468}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}",
    "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}",
    "\u{1F491}",
    "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F468}",
    "\u{1F468}\u200D\u2764\uFE0F\u200D\u{1F468}",
    "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F469}",
    "\u{1F46A}",
    "\u{1F468}\u200D\u{1F469}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}",
    "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F469}\u200D\u{1F466}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F467}",
    "\u{1F468}\u200D\u{1F468}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F468}\u200D\u{1F467}",
    "\u{1F468}\u200D\u{1F468}\u200D\u{1F467}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F468}\u200D\u{1F466}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F468}\u200D\u{1F467}\u200D\u{1F467}",
    "\u{1F469}\u200D\u{1F469}\u200D\u{1F466}",
    "\u{1F469}\u200D\u{1F469}\u200D\u{1F467}",
    "\u{1F469}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
    "\u{1F469}\u200D\u{1F469}\u200D\u{1F466}\u200D\u{1F466}",
    "\u{1F469}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F467}",
    "\u{1F468}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F466}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F467}",
    "\u{1F468}\u200D\u{1F467}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F467}\u200D\u{1F467}",
    "\u{1F469}\u200D\u{1F466}",
    "\u{1F469}\u200D\u{1F466}\u200D\u{1F466}",
    "\u{1F469}\u200D\u{1F467}",
    "\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
    "\u{1F469}\u200D\u{1F467}\u200D\u{1F467}",
    "\u{1F5E3}\uFE0F",
    "\u{1F464}",
    "\u{1F465}",
    "\u{1FAC2}",
    "\u{1F463}",
    "\u{1F435}",
    "\u{1F412}",
    "\u{1F98D}",
    "\u{1F9A7}",
    "\u{1F436}",
    "\u{1F415}",
    "\u{1F9AE}",
    "\u{1F415}\u200D\u{1F9BA}",
    "\u{1F429}",
    "\u{1F43A}",
    "\u{1F98A}",
    "\u{1F99D}",
    "\u{1F431}",
    "\u{1F408}",
    "\u{1F408}\u200D\u2B1B",
    "\u{1F981}",
    "\u{1F42F}",
    "\u{1F405}",
    "\u{1F406}",
    "\u{1F434}",
    "\u{1F40E}",
    "\u{1F984}",
    "\u{1F993}",
    "\u{1F98C}",
    "\u{1F9AC}",
    "\u{1F42E}",
    "\u{1F402}",
    "\u{1F403}",
    "\u{1F404}",
    "\u{1F437}",
    "\u{1F416}",
    "\u{1F417}",
    "\u{1F43D}",
    "\u{1F40F}",
    "\u{1F411}",
    "\u{1F410}",
    "\u{1F42A}",
    "\u{1F42B}",
    "\u{1F999}",
    "\u{1F992}",
    "\u{1F418}",
    "\u{1F9A3}",
    "\u{1F98F}",
    "\u{1F99B}",
    "\u{1F42D}",
    "\u{1F401}",
    "\u{1F400}",
    "\u{1F439}",
    "\u{1F430}",
    "\u{1F407}",
    "\u{1F43F}\uFE0F",
    "\u{1F9AB}",
    "\u{1F994}",
    "\u{1F987}",
    "\u{1F43B}",
    "\u{1F43B}\u200D\u2744\uFE0F",
    "\u{1F428}",
    "\u{1F43C}",
    "\u{1F9A5}",
    "\u{1F9A6}",
    "\u{1F9A8}",
    "\u{1F998}",
    "\u{1F9A1}",
    "\u{1F43E}",
    "\u{1F983}",
    "\u{1F414}",
    "\u{1F413}",
    "\u{1F423}",
    "\u{1F424}",
    "\u{1F425}",
    "\u{1F426}",
    "\u{1F427}",
    "\u{1F54A}\uFE0F",
    "\u{1F985}",
    "\u{1F986}",
    "\u{1F9A2}",
    "\u{1F989}",
    "\u{1F9A4}",
    "\u{1FAB6}",
    "\u{1F9A9}",
    "\u{1F99A}",
    "\u{1F99C}",
    "\u{1F438}",
    "\u{1F40A}",
    "\u{1F422}",
    "\u{1F98E}",
    "\u{1F40D}",
    "\u{1F432}",
    "\u{1F409}",
    "\u{1F995}",
    "\u{1F996}",
    "\u{1F433}",
    "\u{1F40B}",
    "\u{1F42C}",
    "\u{1F9AD}",
    "\u{1F41F}",
    "\u{1F420}",
    "\u{1F421}",
    "\u{1F988}",
    "\u{1F419}",
    "\u{1F41A}",
    "\u{1F40C}",
    "\u{1F98B}",
    "\u{1F41B}",
    "\u{1F41C}",
    "\u{1F41D}",
    "\u{1FAB2}",
    "\u{1F41E}",
    "\u{1F997}",
    "\u{1FAB3}",
    "\u{1F577}\uFE0F",
    "\u{1F578}\uFE0F",
    "\u{1F982}",
    "\u{1F99F}",
    "\u{1FAB0}",
    "\u{1FAB1}",
    "\u{1F9A0}",
    "\u{1F490}",
    "\u{1F338}",
    "\u{1F4AE}",
    "\u{1F3F5}\uFE0F",
    "\u{1F339}",
    "\u{1F940}",
    "\u{1F33A}",
    "\u{1F33B}",
    "\u{1F33C}",
    "\u{1F337}",
    "\u{1F331}",
    "\u{1FAB4}",
    "\u{1F332}",
    "\u{1F333}",
    "\u{1F334}",
    "\u{1F335}",
    "\u{1F33E}",
    "\u{1F33F}",
    "\u2618\uFE0F",
    "\u{1F340}",
    "\u{1F341}",
    "\u{1F342}",
    "\u{1F343}",
    "\u{1F347}",
    "\u{1F348}",
    "\u{1F349}",
    "\u{1F34A}",
    "\u{1F34B}",
    "\u{1F34C}",
    "\u{1F34D}",
    "\u{1F96D}",
    "\u{1F34E}",
    "\u{1F34F}",
    "\u{1F350}",
    "\u{1F351}",
    "\u{1F352}",
    "\u{1F353}",
    "\u{1FAD0}",
    "\u{1F95D}",
    "\u{1F345}",
    "\u{1FAD2}",
    "\u{1F965}",
    "\u{1F951}",
    "\u{1F346}",
    "\u{1F954}",
    "\u{1F955}",
    "\u{1F33D}",
    "\u{1F336}\uFE0F",
    "\u{1FAD1}",
    "\u{1F952}",
    "\u{1F96C}",
    "\u{1F966}",
    "\u{1F9C4}",
    "\u{1F9C5}",
    "\u{1F344}",
    "\u{1F95C}",
    "\u{1F330}",
    "\u{1F35E}",
    "\u{1F950}",
    "\u{1F956}",
    "\u{1FAD3}",
    "\u{1F968}",
    "\u{1F96F}",
    "\u{1F95E}",
    "\u{1F9C7}",
    "\u{1F9C0}",
    "\u{1F356}",
    "\u{1F357}",
    "\u{1F969}",
    "\u{1F953}",
    "\u{1F354}",
    "\u{1F35F}",
    "\u{1F355}",
    "\u{1F32D}",
    "\u{1F96A}",
    "\u{1F32E}",
    "\u{1F32F}",
    "\u{1FAD4}",
    "\u{1F959}",
    "\u{1F9C6}",
    "\u{1F95A}",
    "\u{1F373}",
    "\u{1F958}",
    "\u{1F372}",
    "\u{1FAD5}",
    "\u{1F963}",
    "\u{1F957}",
    "\u{1F37F}",
    "\u{1F9C8}",
    "\u{1F9C2}",
    "\u{1F96B}",
    "\u{1F371}",
    "\u{1F358}",
    "\u{1F359}",
    "\u{1F35A}",
    "\u{1F35B}",
    "\u{1F35C}",
    "\u{1F35D}",
    "\u{1F360}",
    "\u{1F362}",
    "\u{1F363}",
    "\u{1F364}",
    "\u{1F365}",
    "\u{1F96E}",
    "\u{1F361}",
    "\u{1F95F}",
    "\u{1F960}",
    "\u{1F961}",
    "\u{1F980}",
    "\u{1F99E}",
    "\u{1F990}",
    "\u{1F991}",
    "\u{1F9AA}",
    "\u{1F366}",
    "\u{1F367}",
    "\u{1F368}",
    "\u{1F369}",
    "\u{1F36A}",
    "\u{1F382}",
    "\u{1F370}",
    "\u{1F9C1}",
    "\u{1F967}",
    "\u{1F36B}",
    "\u{1F36C}",
    "\u{1F36D}",
    "\u{1F36E}",
    "\u{1F36F}",
    "\u{1F37C}",
    "\u{1F95B}",
    "\u2615",
    "\u{1FAD6}",
    "\u{1F375}",
    "\u{1F376}",
    "\u{1F37E}",
    "\u{1F377}",
    "\u{1F378}",
    "\u{1F379}",
    "\u{1F37A}",
    "\u{1F37B}",
    "\u{1F942}",
    "\u{1F943}",
    "\u{1F964}",
    "\u{1F9CB}",
    "\u{1F9C3}",
    "\u{1F9C9}",
    "\u{1F9CA}",
    "\u{1F962}",
    "\u{1F37D}\uFE0F",
    "\u{1F374}",
    "\u{1F944}",
    "\u{1F52A}",
    "\u{1F3FA}",
    "\u{1F30D}",
    "\u{1F30E}",
    "\u{1F30F}",
    "\u{1F310}",
    "\u{1F5FA}\uFE0F",
    "\u{1F5FE}",
    "\u{1F9ED}",
    "\u{1F3D4}\uFE0F",
    "\u26F0\uFE0F",
    "\u{1F30B}",
    "\u{1F5FB}",
    "\u{1F3D5}\uFE0F",
    "\u{1F3D6}\uFE0F",
    "\u{1F3DC}\uFE0F",
    "\u{1F3DD}\uFE0F",
    "\u{1F3DE}\uFE0F",
    "\u{1F3DF}\uFE0F",
    "\u{1F3DB}\uFE0F",
    "\u{1F3D7}\uFE0F",
    "\u{1F9F1}",
    "\u{1FAA8}",
    "\u{1FAB5}",
    "\u{1F6D6}",
    "\u{1F3D8}\uFE0F",
    "\u{1F3DA}\uFE0F",
    "\u{1F3E0}",
    "\u{1F3E1}",
    "\u{1F3E2}",
    "\u{1F3E3}",
    "\u{1F3E4}",
    "\u{1F3E5}",
    "\u{1F3E6}",
    "\u{1F3E8}",
    "\u{1F3E9}",
    "\u{1F3EA}",
    "\u{1F3EB}",
    "\u{1F3EC}",
    "\u{1F3ED}",
    "\u{1F3EF}",
    "\u{1F3F0}",
    "\u{1F492}",
    "\u{1F5FC}",
    "\u{1F5FD}",
    "\u26EA",
    "\u{1F54C}",
    "\u{1F6D5}",
    "\u{1F54D}",
    "\u26E9\uFE0F",
    "\u{1F54B}",
    "\u26F2",
    "\u26FA",
    "\u{1F301}",
    "\u{1F303}",
    "\u{1F3D9}\uFE0F",
    "\u{1F304}",
    "\u{1F305}",
    "\u{1F306}",
    "\u{1F307}",
    "\u{1F309}",
    "\u2668\uFE0F",
    "\u{1F3A0}",
    "\u{1F3A1}",
    "\u{1F3A2}",
    "\u{1F488}",
    "\u{1F3AA}",
    "\u{1F682}",
    "\u{1F683}",
    "\u{1F684}",
    "\u{1F685}",
    "\u{1F686}",
    "\u{1F687}",
    "\u{1F688}",
    "\u{1F689}",
    "\u{1F68A}",
    "\u{1F69D}",
    "\u{1F69E}",
    "\u{1F68B}",
    "\u{1F68C}",
    "\u{1F68D}",
    "\u{1F68E}",
    "\u{1F690}",
    "\u{1F691}",
    "\u{1F692}",
    "\u{1F693}",
    "\u{1F694}",
    "\u{1F695}",
    "\u{1F696}",
    "\u{1F697}",
    "\u{1F698}",
    "\u{1F699}",
    "\u{1F6FB}",
    "\u{1F69A}",
    "\u{1F69B}",
    "\u{1F69C}",
    "\u{1F3CE}\uFE0F",
    "\u{1F3CD}\uFE0F",
    "\u{1F6F5}",
    "\u{1F9BD}",
    "\u{1F9BC}",
    "\u{1F6FA}",
    "\u{1F6B2}",
    "\u{1F6F4}",
    "\u{1F6F9}",
    "\u{1F6FC}",
    "\u{1F68F}",
    "\u{1F6E3}\uFE0F",
    "\u{1F6E4}\uFE0F",
    "\u{1F6E2}\uFE0F",
    "\u26FD",
    "\u{1F6A8}",
    "\u{1F6A5}",
    "\u{1F6A6}",
    "\u{1F6D1}",
    "\u{1F6A7}",
    "\u2693",
    "\u26F5",
    "\u{1F6F6}",
    "\u{1F6A4}",
    "\u{1F6F3}\uFE0F",
    "\u26F4\uFE0F",
    "\u{1F6E5}\uFE0F",
    "\u{1F6A2}",
    "\u2708\uFE0F",
    "\u{1F6E9}\uFE0F",
    "\u{1F6EB}",
    "\u{1F6EC}",
    "\u{1FA82}",
    "\u{1F4BA}",
    "\u{1F681}",
    "\u{1F69F}",
    "\u{1F6A0}",
    "\u{1F6A1}",
    "\u{1F6F0}\uFE0F",
    "\u{1F680}",
    "\u{1F6F8}",
    "\u{1F6CE}\uFE0F",
    "\u{1F9F3}",
    "\u231B",
    "\u23F3",
    "\u231A",
    "\u23F0",
    "\u23F1\uFE0F",
    "\u23F2\uFE0F",
    "\u{1F570}\uFE0F",
    "\u{1F55B}",
    "\u{1F567}",
    "\u{1F550}",
    "\u{1F55C}",
    "\u{1F551}",
    "\u{1F55D}",
    "\u{1F552}",
    "\u{1F55E}",
    "\u{1F553}",
    "\u{1F55F}",
    "\u{1F554}",
    "\u{1F560}",
    "\u{1F555}",
    "\u{1F561}",
    "\u{1F556}",
    "\u{1F562}",
    "\u{1F557}",
    "\u{1F563}",
    "\u{1F558}",
    "\u{1F564}",
    "\u{1F559}",
    "\u{1F565}",
    "\u{1F55A}",
    "\u{1F566}",
    "\u{1F311}",
    "\u{1F312}",
    "\u{1F313}",
    "\u{1F314}",
    "\u{1F315}",
    "\u{1F316}",
    "\u{1F317}",
    "\u{1F318}",
    "\u{1F319}",
    "\u{1F31A}",
    "\u{1F31B}",
    "\u{1F31C}",
    "\u{1F321}\uFE0F",
    "\u2600\uFE0F",
    "\u{1F31D}",
    "\u{1F31E}",
    "\u{1FA90}",
    "\u2B50",
    "\u{1F31F}",
    "\u{1F320}",
    "\u{1F30C}",
    "\u2601\uFE0F",
    "\u26C5",
    "\u26C8\uFE0F",
    "\u{1F324}\uFE0F",
    "\u{1F325}\uFE0F",
    "\u{1F326}\uFE0F",
    "\u{1F327}\uFE0F",
    "\u{1F328}\uFE0F",
    "\u{1F329}\uFE0F",
    "\u{1F32A}\uFE0F",
    "\u{1F32B}\uFE0F",
    "\u{1F32C}\uFE0F",
    "\u{1F300}",
    "\u{1F308}",
    "\u{1F302}",
    "\u2602\uFE0F",
    "\u2614",
    "\u26F1\uFE0F",
    "\u26A1",
    "\u2744\uFE0F",
    "\u2603\uFE0F",
    "\u26C4",
    "\u2604\uFE0F",
    "\u{1F525}",
    "\u{1F4A7}",
    "\u{1F30A}",
    "\u{1F383}",
    "\u{1F384}",
    "\u{1F386}",
    "\u{1F387}",
    "\u{1F9E8}",
    "\u2728",
    "\u{1F388}",
    "\u{1F389}",
    "\u{1F38A}",
    "\u{1F38B}",
    "\u{1F38D}",
    "\u{1F38E}",
    "\u{1F38F}",
    "\u{1F390}",
    "\u{1F391}",
    "\u{1F9E7}",
    "\u{1F380}",
    "\u{1F381}",
    "\u{1F397}\uFE0F",
    "\u{1F39F}\uFE0F",
    "\u{1F3AB}",
    "\u{1F396}\uFE0F",
    "\u{1F3C6}",
    "\u{1F3C5}",
    "\u{1F947}",
    "\u{1F948}",
    "\u{1F949}",
    "\u26BD",
    "\u26BE",
    "\u{1F94E}",
    "\u{1F3C0}",
    "\u{1F3D0}",
    "\u{1F3C8}",
    "\u{1F3C9}",
    "\u{1F3BE}",
    "\u{1F94F}",
    "\u{1F3B3}",
    "\u{1F3CF}",
    "\u{1F3D1}",
    "\u{1F3D2}",
    "\u{1F94D}",
    "\u{1F3D3}",
    "\u{1F3F8}",
    "\u{1F94A}",
    "\u{1F94B}",
    "\u{1F945}",
    "\u26F3",
    "\u26F8\uFE0F",
    "\u{1F3A3}",
    "\u{1F93F}",
    "\u{1F3BD}",
    "\u{1F3BF}",
    "\u{1F6F7}",
    "\u{1F94C}",
    "\u{1F3AF}",
    "\u{1FA80}",
    "\u{1FA81}",
    "\u{1F3B1}",
    "\u{1F52E}",
    "\u{1FA84}",
    "\u{1F9FF}",
    "\u{1F3AE}",
    "\u{1F579}\uFE0F",
    "\u{1F3B0}",
    "\u{1F3B2}",
    "\u{1F9E9}",
    "\u{1F9F8}",
    "\u{1FA85}",
    "\u{1FA86}",
    "\u2660\uFE0F",
    "\u2665\uFE0F",
    "\u2666\uFE0F",
    "\u2663\uFE0F",
    "\u265F\uFE0F",
    "\u{1F0CF}",
    "\u{1F004}",
    "\u{1F3B4}",
    "\u{1F3AD}",
    "\u{1F5BC}\uFE0F",
    "\u{1F3A8}",
    "\u{1F9F5}",
    "\u{1FAA1}",
    "\u{1F9F6}",
    "\u{1FAA2}",
    "\u{1F453}",
    "\u{1F576}\uFE0F",
    "\u{1F97D}",
    "\u{1F97C}",
    "\u{1F9BA}",
    "\u{1F454}",
    "\u{1F455}",
    "\u{1F456}",
    "\u{1F9E3}",
    "\u{1F9E4}",
    "\u{1F9E5}",
    "\u{1F9E6}",
    "\u{1F457}",
    "\u{1F458}",
    "\u{1F97B}",
    "\u{1FA71}",
    "\u{1FA72}",
    "\u{1FA73}",
    "\u{1F459}",
    "\u{1F45A}",
    "\u{1F45B}",
    "\u{1F45C}",
    "\u{1F45D}",
    "\u{1F6CD}\uFE0F",
    "\u{1F392}",
    "\u{1FA74}",
    "\u{1F45E}",
    "\u{1F45F}",
    "\u{1F97E}",
    "\u{1F97F}",
    "\u{1F460}",
    "\u{1F461}",
    "\u{1FA70}",
    "\u{1F462}",
    "\u{1F451}",
    "\u{1F452}",
    "\u{1F3A9}",
    "\u{1F393}",
    "\u{1F9E2}",
    "\u{1FA96}",
    "\u26D1\uFE0F",
    "\u{1F4FF}",
    "\u{1F484}",
    "\u{1F48D}",
    "\u{1F48E}",
    "\u{1F507}",
    "\u{1F508}",
    "\u{1F509}",
    "\u{1F50A}",
    "\u{1F4E2}",
    "\u{1F4E3}",
    "\u{1F4EF}",
    "\u{1F514}",
    "\u{1F515}",
    "\u{1F3BC}",
    "\u{1F3B5}",
    "\u{1F3B6}",
    "\u{1F399}\uFE0F",
    "\u{1F39A}\uFE0F",
    "\u{1F39B}\uFE0F",
    "\u{1F3A4}",
    "\u{1F3A7}",
    "\u{1F4FB}",
    "\u{1F3B7}",
    "\u{1FA97}",
    "\u{1F3B8}",
    "\u{1F3B9}",
    "\u{1F3BA}",
    "\u{1F3BB}",
    "\u{1FA95}",
    "\u{1F941}",
    "\u{1FA98}",
    "\u{1F4F1}",
    "\u{1F4F2}",
    "\u260E\uFE0F",
    "\u{1F4DE}",
    "\u{1F4DF}",
    "\u{1F4E0}",
    "\u{1F50B}",
    "\u{1F50C}",
    "\u{1F4BB}",
    "\u{1F5A5}\uFE0F",
    "\u{1F5A8}\uFE0F",
    "\u2328\uFE0F",
    "\u{1F5B1}\uFE0F",
    "\u{1F5B2}\uFE0F",
    "\u{1F4BD}",
    "\u{1F4BE}",
    "\u{1F4BF}",
    "\u{1F4C0}",
    "\u{1F9EE}",
    "\u{1F3A5}",
    "\u{1F39E}\uFE0F",
    "\u{1F4FD}\uFE0F",
    "\u{1F3AC}",
    "\u{1F4FA}",
    "\u{1F4F7}",
    "\u{1F4F8}",
    "\u{1F4F9}",
    "\u{1F4FC}",
    "\u{1F50D}",
    "\u{1F50E}",
    "\u{1F56F}\uFE0F",
    "\u{1F4A1}",
    "\u{1F526}",
    "\u{1F3EE}",
    "\u{1FA94}",
    "\u{1F4D4}",
    "\u{1F4D5}",
    "\u{1F4D6}",
    "\u{1F4D7}",
    "\u{1F4D8}",
    "\u{1F4D9}",
    "\u{1F4DA}",
    "\u{1F4D3}",
    "\u{1F4D2}",
    "\u{1F4C3}",
    "\u{1F4DC}",
    "\u{1F4C4}",
    "\u{1F4F0}",
    "\u{1F5DE}\uFE0F",
    "\u{1F4D1}",
    "\u{1F516}",
    "\u{1F3F7}\uFE0F",
    "\u{1F4B0}",
    "\u{1FA99}",
    "\u{1F4B4}",
    "\u{1F4B5}",
    "\u{1F4B6}",
    "\u{1F4B7}",
    "\u{1F4B8}",
    "\u{1F4B3}",
    "\u{1F9FE}",
    "\u{1F4B9}",
    "\u2709\uFE0F",
    "\u{1F4E7}",
    "\u{1F4E8}",
    "\u{1F4E9}",
    "\u{1F4E4}",
    "\u{1F4E5}",
    "\u{1F4E6}",
    "\u{1F4EB}",
    "\u{1F4EA}",
    "\u{1F4EC}",
    "\u{1F4ED}",
    "\u{1F4EE}",
    "\u{1F5F3}\uFE0F",
    "\u270F\uFE0F",
    "\u2712\uFE0F",
    "\u{1F58B}\uFE0F",
    "\u{1F58A}\uFE0F",
    "\u{1F58C}\uFE0F",
    "\u{1F58D}\uFE0F",
    "\u{1F4DD}",
    "\u{1F4BC}",
    "\u{1F4C1}",
    "\u{1F4C2}",
    "\u{1F5C2}\uFE0F",
    "\u{1F4C5}",
    "\u{1F4C6}",
    "\u{1F5D2}\uFE0F",
    "\u{1F5D3}\uFE0F",
    "\u{1F4C7}",
    "\u{1F4C8}",
    "\u{1F4C9}",
    "\u{1F4CA}",
    "\u{1F4CB}",
    "\u{1F4CC}",
    "\u{1F4CD}",
    "\u{1F4CE}",
    "\u{1F587}\uFE0F",
    "\u{1F4CF}",
    "\u{1F4D0}",
    "\u2702\uFE0F",
    "\u{1F5C3}\uFE0F",
    "\u{1F5C4}\uFE0F",
    "\u{1F5D1}\uFE0F",
    "\u{1F512}",
    "\u{1F513}",
    "\u{1F50F}",
    "\u{1F510}",
    "\u{1F511}",
    "\u{1F5DD}\uFE0F",
    "\u{1F528}",
    "\u{1FA93}",
    "\u26CF\uFE0F",
    "\u2692\uFE0F",
    "\u{1F6E0}\uFE0F",
    "\u{1F5E1}\uFE0F",
    "\u2694\uFE0F",
    "\u{1F52B}",
    "\u{1FA83}",
    "\u{1F3F9}",
    "\u{1F6E1}\uFE0F",
    "\u{1FA9A}",
    "\u{1F527}",
    "\u{1FA9B}",
    "\u{1F529}",
    "\u2699\uFE0F",
    "\u{1F5DC}\uFE0F",
    "\u2696\uFE0F",
    "\u{1F9AF}",
    "\u{1F517}",
    "\u26D3\uFE0F",
    "\u{1FA9D}",
    "\u{1F9F0}",
    "\u{1F9F2}",
    "\u{1FA9C}",
    "\u2697\uFE0F",
    "\u{1F9EA}",
    "\u{1F9EB}",
    "\u{1F9EC}",
    "\u{1F52C}",
    "\u{1F52D}",
    "\u{1F4E1}",
    "\u{1F489}",
    "\u{1FA78}",
    "\u{1F48A}",
    "\u{1FA79}",
    "\u{1FA7A}",
    "\u{1F6AA}",
    "\u{1F6D7}",
    "\u{1FA9E}",
    "\u{1FA9F}",
    "\u{1F6CF}\uFE0F",
    "\u{1F6CB}\uFE0F",
    "\u{1FA91}",
    "\u{1F6BD}",
    "\u{1FAA0}",
    "\u{1F6BF}",
    "\u{1F6C1}",
    "\u{1FAA4}",
    "\u{1FA92}",
    "\u{1F9F4}",
    "\u{1F9F7}",
    "\u{1F9F9}",
    "\u{1F9FA}",
    "\u{1F9FB}",
    "\u{1FAA3}",
    "\u{1F9FC}",
    "\u{1FAA5}",
    "\u{1F9FD}",
    "\u{1F9EF}",
    "\u{1F6D2}",
    "\u{1F6AC}",
    "\u26B0\uFE0F",
    "\u{1FAA6}",
    "\u26B1\uFE0F",
    "\u{1F5FF}",
    "\u{1FAA7}",
    "\u{1F3E7}",
    "\u{1F6AE}",
    "\u{1F6B0}",
    "\u267F",
    "\u{1F6B9}",
    "\u{1F6BA}",
    "\u{1F6BB}",
    "\u{1F6BC}",
    "\u{1F6BE}",
    "\u{1F6C2}",
    "\u{1F6C3}",
    "\u{1F6C4}",
    "\u{1F6C5}",
    "\u26A0\uFE0F",
    "\u{1F6B8}",
    "\u26D4",
    "\u{1F6AB}",
    "\u{1F6B3}",
    "\u{1F6AD}",
    "\u{1F6AF}",
    "\u{1F6B1}",
    "\u{1F6B7}",
    "\u{1F4F5}",
    "\u{1F51E}",
    "\u2622\uFE0F",
    "\u2623\uFE0F",
    "\u2B06\uFE0F",
    "\u2197\uFE0F",
    "\u27A1\uFE0F",
    "\u2198\uFE0F",
    "\u2B07\uFE0F",
    "\u2199\uFE0F",
    "\u2B05\uFE0F",
    "\u2196\uFE0F",
    "\u2195\uFE0F",
    "\u2194\uFE0F",
    "\u21A9\uFE0F",
    "\u21AA\uFE0F",
    "\u2934\uFE0F",
    "\u2935\uFE0F",
    "\u{1F503}",
    "\u{1F504}",
    "\u{1F519}",
    "\u{1F51A}",
    "\u{1F51B}",
    "\u{1F51C}",
    "\u{1F51D}",
    "\u{1F6D0}",
    "\u269B\uFE0F",
    "\u{1F549}\uFE0F",
    "\u2721\uFE0F",
    "\u2638\uFE0F",
    "\u262F\uFE0F",
    "\u271D\uFE0F",
    "\u2626\uFE0F",
    "\u262A\uFE0F",
    "\u262E\uFE0F",
    "\u{1F54E}",
    "\u{1F52F}",
    "\u2648",
    "\u2649",
    "\u264A",
    "\u264B",
    "\u264C",
    "\u264D",
    "\u264E",
    "\u264F",
    "\u2650",
    "\u2651",
    "\u2652",
    "\u2653",
    "\u26CE",
    "\u{1F500}",
    "\u{1F501}",
    "\u{1F502}",
    "\u25B6\uFE0F",
    "\u23E9",
    "\u23ED\uFE0F",
    "\u23EF\uFE0F",
    "\u25C0\uFE0F",
    "\u23EA",
    "\u23EE\uFE0F",
    "\u{1F53C}",
    "\u23EB",
    "\u{1F53D}",
    "\u23EC",
    "\u23F8\uFE0F",
    "\u23F9\uFE0F",
    "\u23FA\uFE0F",
    "\u23CF\uFE0F",
    "\u{1F3A6}",
    "\u{1F505}",
    "\u{1F506}",
    "\u{1F4F6}",
    "\u{1F4F3}",
    "\u{1F4F4}",
    "\u2640\uFE0F",
    "\u2642\uFE0F",
    "\u26A7\uFE0F",
    "\u2716\uFE0F",
    "\u2795",
    "\u2796",
    "\u2797",
    "\u267E\uFE0F",
    "\u203C\uFE0F",
    "\u2049\uFE0F",
    "\u2753",
    "\u2754",
    "\u2755",
    "\u2757",
    "\u3030\uFE0F",
    "\u{1F4B1}",
    "\u{1F4B2}",
    "\u2695\uFE0F",
    "\u267B\uFE0F",
    "\u269C\uFE0F",
    "\u{1F531}",
    "\u{1F4DB}",
    "\u{1F530}",
    "\u2B55",
    "\u2705",
    "\u2611\uFE0F",
    "\u2714\uFE0F",
    "\u274C",
    "\u274E",
    "\u27B0",
    "\u27BF",
    "\u303D\uFE0F",
    "\u2733\uFE0F",
    "\u2734\uFE0F",
    "\u2747\uFE0F",
    "\xA9\uFE0F",
    "\xAE\uFE0F",
    "\u2122\uFE0F",
    "#\uFE0F\u20E3",
    "*\uFE0F\u20E3",
    "0\uFE0F\u20E3",
    "1\uFE0F\u20E3",
    "2\uFE0F\u20E3",
    "3\uFE0F\u20E3",
    "4\uFE0F\u20E3",
    "5\uFE0F\u20E3",
    "6\uFE0F\u20E3",
    "7\uFE0F\u20E3",
    "8\uFE0F\u20E3",
    "9\uFE0F\u20E3",
    "\u{1F51F}",
    "\u{1F520}",
    "\u{1F521}",
    "\u{1F522}",
    "\u{1F523}",
    "\u{1F524}",
    "\u{1F170}\uFE0F",
    "\u{1F18E}",
    "\u{1F171}\uFE0F",
    "\u{1F191}",
    "\u{1F192}",
    "\u{1F193}",
    "\u2139\uFE0F",
    "\u{1F194}",
    "\u24C2\uFE0F",
    "\u{1F195}",
    "\u{1F196}",
    "\u{1F17E}\uFE0F",
    "\u{1F197}",
    "\u{1F17F}\uFE0F",
    "\u{1F198}",
    "\u{1F199}",
    "\u{1F19A}",
    "\u{1F201}",
    "\u{1F202}\uFE0F",
    "\u{1F237}\uFE0F",
    "\u{1F236}",
    "\u{1F22F}",
    "\u{1F250}",
    "\u{1F239}",
    "\u{1F21A}",
    "\u{1F232}",
    "\u{1F251}",
    "\u{1F238}",
    "\u{1F234}",
    "\u{1F233}",
    "\u3297\uFE0F",
    "\u3299\uFE0F",
    "\u{1F23A}",
    "\u{1F235}",
    "\u{1F534}",
    "\u{1F7E0}",
    "\u{1F7E1}",
    "\u{1F7E2}",
    "\u{1F535}",
    "\u{1F7E3}",
    "\u{1F7E4}",
    "\u26AB",
    "\u26AA",
    "\u{1F7E5}",
    "\u{1F7E7}",
    "\u{1F7E8}",
    "\u{1F7E9}",
    "\u{1F7E6}",
    "\u{1F7EA}",
    "\u{1F7EB}",
    "\u2B1B",
    "\u2B1C",
    "\u25FC\uFE0F",
    "\u25FB\uFE0F",
    "\u25FE",
    "\u25FD",
    "\u25AA\uFE0F",
    "\u25AB\uFE0F",
    "\u{1F536}",
    "\u{1F537}",
    "\u{1F538}",
    "\u{1F539}",
    "\u{1F53A}",
    "\u{1F53B}",
    "\u{1F4A0}",
    "\u{1F518}",
    "\u{1F533}",
    "\u{1F532}",
    "\u{1F3C1}",
    "\u{1F6A9}",
    "\u{1F38C}",
    "\u{1F3F4}",
    "\u{1F3F3}\uFE0F",
    "\u{1F3F3}\uFE0F\u200D\u{1F308}",
    "\u{1F3F3}\uFE0F\u200D\u26A7\uFE0F",
    "\u{1F3F4}\u200D\u2620\uFE0F",
    "\u{1F1E6}\u{1F1E8}",
    "\u{1F1E6}\u{1F1E9}",
    "\u{1F1E6}\u{1F1EA}",
    "\u{1F1E6}\u{1F1EB}",
    "\u{1F1E6}\u{1F1EC}",
    "\u{1F1E6}\u{1F1EE}",
    "\u{1F1E6}\u{1F1F1}",
    "\u{1F1E6}\u{1F1F2}",
    "\u{1F1E6}\u{1F1F4}",
    "\u{1F1E6}\u{1F1F6}",
    "\u{1F1E6}\u{1F1F7}",
    "\u{1F1E6}\u{1F1F8}",
    "\u{1F1E6}\u{1F1F9}",
    "\u{1F1E6}\u{1F1FA}",
    "\u{1F1E6}\u{1F1FC}",
    "\u{1F1E6}\u{1F1FD}",
    "\u{1F1E6}\u{1F1FF}",
    "\u{1F1E7}\u{1F1E6}",
    "\u{1F1E7}\u{1F1E7}",
    "\u{1F1E7}\u{1F1E9}",
    "\u{1F1E7}\u{1F1EA}",
    "\u{1F1E7}\u{1F1EB}",
    "\u{1F1E7}\u{1F1EC}",
    "\u{1F1E7}\u{1F1ED}",
    "\u{1F1E7}\u{1F1EE}",
    "\u{1F1E7}\u{1F1EF}",
    "\u{1F1E7}\u{1F1F1}",
    "\u{1F1E7}\u{1F1F2}",
    "\u{1F1E7}\u{1F1F3}",
    "\u{1F1E7}\u{1F1F4}",
    "\u{1F1E7}\u{1F1F6}",
    "\u{1F1E7}\u{1F1F7}",
    "\u{1F1E7}\u{1F1F8}",
    "\u{1F1E7}\u{1F1F9}",
    "\u{1F1E7}\u{1F1FB}",
    "\u{1F1E7}\u{1F1FC}",
    "\u{1F1E7}\u{1F1FE}",
    "\u{1F1E7}\u{1F1FF}",
    "\u{1F1E8}\u{1F1E6}",
    "\u{1F1E8}\u{1F1E8}",
    "\u{1F1E8}\u{1F1E9}",
    "\u{1F1E8}\u{1F1EB}",
    "\u{1F1E8}\u{1F1EC}",
    "\u{1F1E8}\u{1F1ED}",
    "\u{1F1E8}\u{1F1EE}",
    "\u{1F1E8}\u{1F1F0}",
    "\u{1F1E8}\u{1F1F1}",
    "\u{1F1E8}\u{1F1F2}",
    "\u{1F1E8}\u{1F1F3}",
    "\u{1F1E8}\u{1F1F4}",
    "\u{1F1E8}\u{1F1F5}",
    "\u{1F1E8}\u{1F1F7}",
    "\u{1F1E8}\u{1F1FA}",
    "\u{1F1E8}\u{1F1FB}",
    "\u{1F1E8}\u{1F1FC}",
    "\u{1F1E8}\u{1F1FD}",
    "\u{1F1E8}\u{1F1FE}",
    "\u{1F1E8}\u{1F1FF}",
    "\u{1F1E9}\u{1F1EA}",
    "\u{1F1E9}\u{1F1EC}",
    "\u{1F1E9}\u{1F1EF}",
    "\u{1F1E9}\u{1F1F0}",
    "\u{1F1E9}\u{1F1F2}",
    "\u{1F1E9}\u{1F1F4}",
    "\u{1F1E9}\u{1F1FF}",
    "\u{1F1EA}\u{1F1E6}",
    "\u{1F1EA}\u{1F1E8}",
    "\u{1F1EA}\u{1F1EA}",
    "\u{1F1EA}\u{1F1EC}",
    "\u{1F1EA}\u{1F1ED}",
    "\u{1F1EA}\u{1F1F7}",
    "\u{1F1EA}\u{1F1F8}",
    "\u{1F1EA}\u{1F1F9}",
    "\u{1F1EA}\u{1F1FA}",
    "\u{1F1EB}\u{1F1EE}",
    "\u{1F1EB}\u{1F1EF}",
    "\u{1F1EB}\u{1F1F0}",
    "\u{1F1EB}\u{1F1F2}",
    "\u{1F1EB}\u{1F1F4}",
    "\u{1F1EB}\u{1F1F7}",
    "\u{1F1EC}\u{1F1E6}",
    "\u{1F1EC}\u{1F1E7}",
    "\u{1F1EC}\u{1F1E9}",
    "\u{1F1EC}\u{1F1EA}",
    "\u{1F1EC}\u{1F1EB}",
    "\u{1F1EC}\u{1F1EC}",
    "\u{1F1EC}\u{1F1ED}",
    "\u{1F1EC}\u{1F1EE}",
    "\u{1F1EC}\u{1F1F1}",
    "\u{1F1EC}\u{1F1F2}",
    "\u{1F1EC}\u{1F1F3}",
    "\u{1F1EC}\u{1F1F5}",
    "\u{1F1EC}\u{1F1F6}",
    "\u{1F1EC}\u{1F1F7}",
    "\u{1F1EC}\u{1F1F8}",
    "\u{1F1EC}\u{1F1F9}",
    "\u{1F1EC}\u{1F1FA}",
    "\u{1F1EC}\u{1F1FC}",
    "\u{1F1EC}\u{1F1FE}",
    "\u{1F1ED}\u{1F1F0}",
    "\u{1F1ED}\u{1F1F2}",
    "\u{1F1ED}\u{1F1F3}",
    "\u{1F1ED}\u{1F1F7}",
    "\u{1F1ED}\u{1F1F9}",
    "\u{1F1ED}\u{1F1FA}",
    "\u{1F1EE}\u{1F1E8}",
    "\u{1F1EE}\u{1F1E9}",
    "\u{1F1EE}\u{1F1EA}",
    "\u{1F1EE}\u{1F1F1}",
    "\u{1F1EE}\u{1F1F2}",
    "\u{1F1EE}\u{1F1F3}",
    "\u{1F1EE}\u{1F1F4}",
    "\u{1F1EE}\u{1F1F6}",
    "\u{1F1EE}\u{1F1F7}",
    "\u{1F1EE}\u{1F1F8}",
    "\u{1F1EE}\u{1F1F9}",
    "\u{1F1EF}\u{1F1EA}",
    "\u{1F1EF}\u{1F1F2}",
    "\u{1F1EF}\u{1F1F4}",
    "\u{1F1EF}\u{1F1F5}",
    "\u{1F1F0}\u{1F1EA}",
    "\u{1F1F0}\u{1F1EC}",
    "\u{1F1F0}\u{1F1ED}",
    "\u{1F1F0}\u{1F1EE}",
    "\u{1F1F0}\u{1F1F2}",
    "\u{1F1F0}\u{1F1F3}",
    "\u{1F1F0}\u{1F1F5}",
    "\u{1F1F0}\u{1F1F7}",
    "\u{1F1F0}\u{1F1FC}",
    "\u{1F1F0}\u{1F1FE}",
    "\u{1F1F0}\u{1F1FF}",
    "\u{1F1F1}\u{1F1E6}",
    "\u{1F1F1}\u{1F1E7}",
    "\u{1F1F1}\u{1F1E8}",
    "\u{1F1F1}\u{1F1EE}",
    "\u{1F1F1}\u{1F1F0}",
    "\u{1F1F1}\u{1F1F7}",
    "\u{1F1F1}\u{1F1F8}",
    "\u{1F1F1}\u{1F1F9}",
    "\u{1F1F1}\u{1F1FA}",
    "\u{1F1F1}\u{1F1FB}",
    "\u{1F1F1}\u{1F1FE}",
    "\u{1F1F2}\u{1F1E6}",
    "\u{1F1F2}\u{1F1E8}",
    "\u{1F1F2}\u{1F1E9}",
    "\u{1F1F2}\u{1F1EA}",
    "\u{1F1F2}\u{1F1EB}",
    "\u{1F1F2}\u{1F1EC}",
    "\u{1F1F2}\u{1F1ED}",
    "\u{1F1F2}\u{1F1F0}",
    "\u{1F1F2}\u{1F1F1}",
    "\u{1F1F2}\u{1F1F2}",
    "\u{1F1F2}\u{1F1F3}",
    "\u{1F1F2}\u{1F1F4}",
    "\u{1F1F2}\u{1F1F5}",
    "\u{1F1F2}\u{1F1F6}",
    "\u{1F1F2}\u{1F1F7}",
    "\u{1F1F2}\u{1F1F8}",
    "\u{1F1F2}\u{1F1F9}",
    "\u{1F1F2}\u{1F1FA}",
    "\u{1F1F2}\u{1F1FB}",
    "\u{1F1F2}\u{1F1FC}",
    "\u{1F1F2}\u{1F1FD}",
    "\u{1F1F2}\u{1F1FE}",
    "\u{1F1F2}\u{1F1FF}",
    "\u{1F1F3}\u{1F1E6}",
    "\u{1F1F3}\u{1F1E8}",
    "\u{1F1F3}\u{1F1EA}",
    "\u{1F1F3}\u{1F1EB}",
    "\u{1F1F3}\u{1F1EC}",
    "\u{1F1F3}\u{1F1EE}",
    "\u{1F1F3}\u{1F1F1}",
    "\u{1F1F3}\u{1F1F4}",
    "\u{1F1F3}\u{1F1F5}",
    "\u{1F1F3}\u{1F1F7}",
    "\u{1F1F3}\u{1F1FA}",
    "\u{1F1F3}\u{1F1FF}",
    "\u{1F1F4}\u{1F1F2}",
    "\u{1F1F5}\u{1F1E6}",
    "\u{1F1F5}\u{1F1EA}",
    "\u{1F1F5}\u{1F1EB}",
    "\u{1F1F5}\u{1F1EC}",
    "\u{1F1F5}\u{1F1ED}",
    "\u{1F1F5}\u{1F1F0}",
    "\u{1F1F5}\u{1F1F1}",
    "\u{1F1F5}\u{1F1F2}",
    "\u{1F1F5}\u{1F1F3}",
    "\u{1F1F5}\u{1F1F7}",
    "\u{1F1F5}\u{1F1F8}",
    "\u{1F1F5}\u{1F1F9}",
    "\u{1F1F5}\u{1F1FC}",
    "\u{1F1F5}\u{1F1FE}",
    "\u{1F1F6}\u{1F1E6}",
    "\u{1F1F7}\u{1F1EA}",
    "\u{1F1F7}\u{1F1F4}",
    "\u{1F1F7}\u{1F1F8}",
    "\u{1F1F7}\u{1F1FA}",
    "\u{1F1F7}\u{1F1FC}",
    "\u{1F1F8}\u{1F1E6}",
    "\u{1F1F8}\u{1F1E7}",
    "\u{1F1F8}\u{1F1E8}",
    "\u{1F1F8}\u{1F1E9}",
    "\u{1F1F8}\u{1F1EA}",
    "\u{1F1F8}\u{1F1EC}",
    "\u{1F1F8}\u{1F1ED}",
    "\u{1F1F8}\u{1F1EE}",
    "\u{1F1F8}\u{1F1EF}",
    "\u{1F1F8}\u{1F1F0}",
    "\u{1F1F8}\u{1F1F1}",
    "\u{1F1F8}\u{1F1F2}",
    "\u{1F1F8}\u{1F1F3}",
    "\u{1F1F8}\u{1F1F4}",
    "\u{1F1F8}\u{1F1F7}",
    "\u{1F1F8}\u{1F1F8}",
    "\u{1F1F8}\u{1F1F9}",
    "\u{1F1F8}\u{1F1FB}",
    "\u{1F1F8}\u{1F1FD}",
    "\u{1F1F8}\u{1F1FE}",
    "\u{1F1F8}\u{1F1FF}",
    "\u{1F1F9}\u{1F1E6}",
    "\u{1F1F9}\u{1F1E8}",
    "\u{1F1F9}\u{1F1E9}",
    "\u{1F1F9}\u{1F1EB}",
    "\u{1F1F9}\u{1F1EC}",
    "\u{1F1F9}\u{1F1ED}",
    "\u{1F1F9}\u{1F1EF}",
    "\u{1F1F9}\u{1F1F0}",
    "\u{1F1F9}\u{1F1F1}",
    "\u{1F1F9}\u{1F1F2}",
    "\u{1F1F9}\u{1F1F3}",
    "\u{1F1F9}\u{1F1F4}",
    "\u{1F1F9}\u{1F1F7}",
    "\u{1F1F9}\u{1F1F9}",
    "\u{1F1F9}\u{1F1FB}",
    "\u{1F1F9}\u{1F1FC}",
    "\u{1F1F9}\u{1F1FF}",
    "\u{1F1FA}\u{1F1E6}",
    "\u{1F1FA}\u{1F1EC}",
    "\u{1F1FA}\u{1F1F2}",
    "\u{1F1FA}\u{1F1F3}",
    "\u{1F1FA}\u{1F1F8}",
    "\u{1F1FA}\u{1F1FE}",
    "\u{1F1FA}\u{1F1FF}",
    "\u{1F1FB}\u{1F1E6}",
    "\u{1F1FB}\u{1F1E8}",
    "\u{1F1FB}\u{1F1EA}",
    "\u{1F1FB}\u{1F1EC}",
    "\u{1F1FB}\u{1F1EE}",
    "\u{1F1FB}\u{1F1F3}",
    "\u{1F1FB}\u{1F1FA}",
    "\u{1F1FC}\u{1F1EB}",
    "\u{1F1FC}\u{1F1F8}",
    "\u{1F1FD}\u{1F1F0}",
    "\u{1F1FE}\u{1F1EA}",
    "\u{1F1FE}\u{1F1F9}",
    "\u{1F1FF}\u{1F1E6}",
    "\u{1F1FF}\u{1F1F2}",
    "\u{1F1FF}\u{1F1FC}",
    "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
    "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
    "\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}"
];
function randEmoji(options) {
    return fake(data$1d, options);
}
var data$1a = [
    "/opt/bin/turn_key_bedfordshire_contingency.mts.acu",
    "/lib/niches_account_springs.w3d.gtm",
    "/Applications/plains_fresh_hack.s.onepkg",
    "/usr/libexec/gold_plum_toys.mbk.xdf",
    "/net/green_terrace_faroe.csh.wspolicy",
    "/net/monitor_saint_engineer.mrc.ogv",
    "/usr/lib/dong.gsf.dxr",
    "/usr/include/rand_sleek.uvs.qxt",
    "/usr/buckinghamshire.pdb.so",
    "/tmp/soft.fxp.dist",
    "/lost+found/producer_metal_networked.spot.ktz",
    "/lost+found/gorgeous_plastic.z1.dwf",
    "/usr/sbin/car.cba.dssc",
    "/Applications/responsive_mobile.twds.markdown",
    "/usr/share/copying.scq.teacher",
    "/bin/neural_net.btif.php",
    "/lost+found/sudanese.sm.m1v",
    "/usr/local/bin/compressing_bifurcated.crd.oda",
    "/etc/mail/uzbekistan_invoice_analyzer.lostxml.xht",
    "/usr/local/bin/turn_key.uvv.mng",
    "/usr/share/moldova_loan_administration.pvb.xaml",
    "/opt/include/frozen.z2.pnm",
    "/opt/bin/recontextualize_optimization.onetoc.opf",
    "/rescue/director_grocery.gml.nns",
    "/opt/bin/adp_keyboard.mcd.prf",
    "/Users/table_leading.ufd.aas",
    "/usr/include/avon_best_of_breed.tga.xif",
    "/etc/periodic/compatible.icm.pcf",
    "/var/log/withdrawal.sdc.aep",
    "/var/yp/tasty_silver_idaho.cbr.uvf",
    "/etc/periodic/web_readiness_international_licensed.lwp.xlf",
    "/var/spool/future_organic.bpk.wtb",
    "/home/account_cotton.xap.jpe",
    "/etc/mail/strategist.ngdat.mcd",
    "/lib/transmit_awesome.cba.flx",
    "/home/software.spc.dd2",
    "/rescue/sticky.asc.ots",
    "/usr/bin/fish_islands_estates.fdf.aif",
    "/usr/sbin/optimization_multi_tasking.hvp.mcd",
    "/etc/ppp/steel.cdf.mp4",
    "/etc/gorgeous_mews.pml.ppam",
    "/usr/lib/metrics.smzip.hpid",
    "/System/hacking.sass.sxg",
    "/home/user/gloves_grey.ami.svg",
    "/usr/include/overriding_png.txt.aw",
    "/lost+found/designer_decentralized.tcl.m4u",
    "/etc/namedb/de_engineered_bandwidth.igx.avi",
    "/opt/include/christmas.mp2a.vob",
    "/usr/X11R6/producer_deliver.txd.rtx",
    "/net/exploit_smtp.kpxx.qwd",
    "/private/var/azure_pine_iranian.rif.cst",
    "/Library/virtual.bdoc.ief",
    "/usr/bin/drive.hpid.joda",
    "/etc/namedb/account_parsing.bcpio.mj2",
    "/lib/configuration_programming.fly.nfo",
    "/usr/include/maryland_enterprise_wide_tuna.rmvb.mk3d",
    "/srv/back_end.java.mp3",
    "/rescue/trace_cotton_synergized.pgm.mpt",
    "/var/mail/incredible.elc.setreg",
    "/usr/share/avon_state.onepkg.dwg",
    "/usr/lib/composite_maryland.md.psd",
    "/lib/ports_calculating.ogg.wm",
    "/Network/embrace_interactions_internal.mng.lasxml",
    "/Users/mobility_avon_internal.mpp.cxx",
    "/home/smtp_keys_serbian.cbt.f90",
    "/boot/defaults/index_avon.stl.dxp",
    "/var/computers_bedfordshire.mp2.ami",
    "/etc/zimbabwe.html.crx",
    "/usr/share/alarm.vob.wmls",
    "/etc/namedb/calculate.cbz.gqs",
    "/usr/ports/experiences.uvvz.ifm",
    "/home/user/regional_gold.p8.silo",
    "/System/avon_representative_bandwidth_monitored.nlu.ez3",
    "/selinux/gardens.dwg.aiff",
    "/Library/direct.link66.ktx",
    "/sys/agp_borders_channels.uu.roa",
    "/opt/share/computer_indigo.sfs.x3dv",
    "/srv/payment_invoice.ppd.irm",
    "/usr/local/bin/indexing_health_tactics.fe_launch.sgl",
    "/sbin/online_technician.vcd.zmm",
    "/var/tmp/soap_cambridgeshire_regional.au.xps",
    "/opt/share/singapore.elc.hps",
    "/root/solutions_logistical.npx.kmz",
    "/sbin/system_contingency.xspf.pgp",
    "/root/dakota.pfa.xps",
    "/usr/X11R6/savings_expressway.json.uvf",
    "/usr/ports/intermediate_avon_soft.mml.xfdf",
    "/etc/namedb/won_fresh.et3.aam",
    "/dev/hacking.caf.vcd",
    "/sys/gorgeous_payment.skm.htm",
    "/Applications/niches.x3d.atom",
    "/Applications/website.pgp.clkp",
    "/etc/mail/barbados_azure.gre.php",
    "/var/tasty.cfs.uvvt",
    "/usr/src/real.box.gif",
    "/opt/include/engineer.qxd.xpw",
    "/opt/sbin/synthesizing_investor.ra.c4d",
    "/etc/defaults/incredible.spc.edm",
    "/usr/src/rufiyaa.odp.ace",
    "/usr/local/bin/tactics_maryland_xml.zip.gram"
];
function randFilePath(options) {
    return fake(data$1a, options);
}
var data$16 = {
    china: [
        "Peking roasted duck",
        "Kung pao chicken",
        "Sweet and sour pork",
        "Hot pot",
        "Dim sum",
        "Dumplings",
        "Ma po tofu",
        "Char siu",
        "Chicken chow mein",
        "Beef chow mein",
        "vegetable chow mein",
        "Chicken fried rice",
        "Beef fried rice",
        "Vegetable fried Rice",
        "Special fried Rice",
        "Sichuan pork",
        "Xiaolongbao",
        "Zhajiangmian",
        "Wonton soup",
        "Sweet and sour pork",
        "Duck spring Rolls",
        "Vegetable spring Rolls",
        "Wonton",
        "Peking duck",
        "Lamb hot pot",
        "Spicy crayfish",
        "Guilin rice noodles",
        "Lanzhou hand-pulled noodles",
        "Steamed crab",
        "Shredded pork with garlic sauce",
        "Red braised pork",
        "Sweet and sour Ribs",
        "Xinjiang",
        "Braised pork with vermicelli"
    ],
    italy: [
        "Butternut squash risotto",
        "Mushroom risotto",
        "Beetroot risotto",
        "Courgette risotto",
        "Pizza",
        "Gnocchi",
        "Spaghetti bolognese",
        "Spaghetti carbonara",
        "Pesto alla Genovese",
        "Beef lasagne",
        "Vegetable lasagne",
        "Gelato",
        "Prosciutto di Parma",
        "Ribollita",
        "Bagna cauda",
        "Polenta",
        "Tortelli and ravioli",
        "Focaccia",
        "Garlic bread",
        "Arancini",
        "Il tartufo",
        "Panzerotto fritto",
        "Fiorentina",
        "Minestrone",
        "Frico",
        "Arrosticini",
        "Olive ascolante",
        "Fritto misto piemontes",
        "Tiramis\xF9"
    ],
    india: [
        "Biryani",
        "Dosa",
        "Tandoori chicken",
        "Samosas",
        "Chaat",
        "Plain naan",
        "Garlic naan",
        "Pilau rice",
        "Steamed rice",
        "Chicken madras",
        "Vegetable madras",
        "Chicken vindaloo",
        "Chicken jalfrezi",
        "Chicken roghan josh",
        "Lamb roghan josh",
        "Beef roghan josh",
        "Butter chicken",
        "Dosa",
        "Gulab jamun",
        "Chicken korma",
        "Mutter paneer",
        "Papadum",
        "Paratha",
        "Raita",
        "Saag paneer",
        "Tandoori chicken",
        "Chicken tikka masala",
        "Pakora",
        "Dal",
        "Chapati",
        "Pasanda",
        "Aloo gobi",
        "Kofta",
        "Chicken makhani",
        "Paneer naan",
        "Chana Aloo Curry"
    ],
    mexico: [
        "Chilaquiles",
        "Pozole",
        "Tacos al pastor",
        "Tostadas",
        "Chiles en nogada",
        "Elote",
        "Enchiladas",
        "Mole",
        "Guacamole",
        "Tamales",
        "Huevos rancheros",
        "Machaca",
        "Discada",
        "Beef Burrito",
        "Chicken Burrito",
        "Pozole de pollo o duajolote",
        "Menudo",
        "Cochinita pibil",
        "Tamale",
        "Quesadilla",
        "Frijoles puercos",
        "Chile en nogada",
        "Esquites",
        "Alegria de amaranto",
        "Pipi\xE1n",
        "Aguachile",
        "Ceviche",
        "Pescado zarandeado",
        "Camarones a la diabla",
        "Birria de chivo",
        "Tlayuda",
        "Guacamole con chapulines",
        "Flautas",
        "Torta Ahogada",
        "Carnitas",
        "Caldo Azteca",
        "Gorditas de Nata"
    ],
    japan: [
        "Sushi",
        "Udon",
        "Tofu",
        "Tempura",
        "Yakitori",
        "Sashimi",
        "Ramen",
        "Donburi",
        "Natto",
        "Oden",
        "Tamagoyaki",
        "Soba",
        "Tonkatsu",
        "Kashipan",
        "Sukiyaki",
        "Miso soup",
        "Okonomiyaki",
        "Mentaiko",
        "Nikujaga",
        "Unagi no kabayaki",
        "Shabu Shabu",
        "Onigiri",
        "Gyoza",
        "Takoyaki",
        "aiseki ryori",
        "Edamame",
        "Yakisoba",
        "Chawanmushi",
        "Wagashi"
    ],
    france: [
        "Foie gras",
        "Hu\xEEtres",
        "Cassoulet",
        "Poulet basquaise",
        "Escargots au beurre persill\xE9",
        "Mouclade charentaise",
        "Galettes bretonnes",
        "Flemish carbonnade",
        "Quiche lorraine",
        "Raclette",
        "Cheese fondue",
        "Beef fondue",
        "Gratin dauphinois",
        "Tartiflette",
        "Bouillabaisse",
        "Ratatouille",
        "Boeuf bourguignon",
        "Blanquette de veau",
        "Pot-au-feu",
        "Coq-au-vin",
        "Hachis parmentier",
        "Steak tartare",
        "Choucroute",
        "Souffl\xE9 au fromage",
        "Cuisses de grenouilles",
        "Soupe \xE0 l\u2019oignon",
        "Baguette",
        "Croissant",
        "French cheeses",
        "Fondant au chocolat",
        "Tarte tatin",
        "Macarons",
        "Cr\xE8me br\xFBl\xE9e",
        "\xCEle flottante",
        "Profiteroles",
        "Pain au chocolat"
    ],
    lebanon: [
        "Kibbeh",
        "Kafta",
        "Kanafeh",
        "Hummus",
        "Rice pilaf",
        "Fattoush",
        "Manakish",
        "Tabbouleh",
        "Sfeeha",
        "Fattoush",
        "Labneh",
        "Muhammara",
        "Lahm bi ajin",
        "Kaak",
        "Chanklich",
        "Mssabaha",
        "Shawarma",
        "Kebbe",
        "Falafel",
        "Halewit el jeben",
        "Namoura",
        "Maamoul",
        "Foul mdammas",
        "Balila",
        "Kawarma",
        "Fattouch"
    ],
    thailand: [
        "Pad kra pao moo",
        "Tom kha gai",
        "Khao Pad",
        "Chicken pad Thai",
        "Vegetable pad Thai",
        "Moo satay",
        "Tom yum goong",
        "Khao niew mamuang",
        "Kai yad sai",
        "Khao soi",
        "Pad see ew",
        "Laab moo",
        "Gaeng panang",
        "Gai pad med ma muang",
        "Som tam",
        "Poh pia tod",
        "Gaeng massaman",
        "Pla kapung nueng manao",
        "Tod mun pla",
        "Gaeng ped",
        "Gaeng garee",
        "Gaeng keow wan",
        "Moo ping",
        "Durian",
        "Sai ooah",
        "Hoy tod",
        "Kuay teow reua",
        "Mu kratha",
        "Kao ka moo",
        "Yam nua"
    ],
    greece: [
        "Moussaka",
        "Papoutsakia",
        "Pastitsio",
        "Souvlaki",
        "Soutzoukakia",
        "Stifado",
        "Tomatokeftedes",
        "Tzatziki",
        "Kolokithokeftedes",
        "Giouvetsi",
        "Choriatiki",
        "Kleftiko",
        "Gemista",
        "Fasolada",
        "Bougatsa",
        "Tiropita",
        "Spanakopita",
        "Feta Cheese with Honey",
        "Horta",
        "Tirokroketes",
        "Briam",
        "Saganaki",
        "Gigantes",
        "Dolmades",
        "Fasolatha",
        "Koulouri",
        "Loukoumades",
        "Gyros",
        "Galaktoboureko",
        "Baklava"
    ],
    turkey: [
        "\u015Ei\u015F kebap",
        "D\xF6ner",
        "K\xF6fte",
        "Pide",
        "Kumpir",
        "Meze",
        "Mant\u0131",
        "Lahmacun",
        "Menemen",
        "\u015Ei\u015F kebap",
        "\u0130skender kebab",
        "Corba",
        "Kuzu tandir",
        "\xC7i\u011F K\xF6fte",
        "Pilav",
        "Yaprak sarma",
        "Dolma",
        "\u0130mam bay\u0131ld\u0131",
        "Borek",
        "Durum",
        "Kumpir",
        "Balik ekmek",
        "Simit",
        "Kunefe",
        "Baklava",
        "Lokum",
        "Halva",
        "Mozzaik pasta",
        "G\xFClla\xE7",
        "Mercimek K\xF6ftesi",
        "Haydari",
        "Tursu suyu",
        "Kahvalti",
        "Kazan dibi",
        "Hunkar begendi",
        "Islak burgers",
        "Salep",
        "Yogurtlu kebab"
    ],
    spain: [
        "Tortilla de patatas",
        "Fabada asturiana",
        "Cal\xE7ots",
        "Boquerones al vinagre",
        "Empanada gallega",
        "Paella",
        "Gazpacho",
        "Gachas",
        "Migas",
        "Bocadillo de calamares",
        "Pulpo a feira",
        "Caldo gallego",
        "Lentejas con chorizo",
        "Cocido madrile\xF1o",
        "Cachopo",
        "Caracoles"
    ],
    venezuela: [
        "Pabell\xF3n criollo",
        "Arepa",
        "Mondongo",
        "Empanadas",
        "Quesillo",
        "Chicha andina",
        "Teque\xF1os",
        "Cachapa",
        "Hallaca",
        "Perico",
        "Pasticho",
        "Mandocas",
        "Caraotas negras",
        "Patacones",
        "Dulce de leche",
        "Pan de Jam\xF3n"
    ],
    chile: [
        "Humitas",
        "Empanadas",
        "Porotos con riendas",
        "Completos",
        "Manjar",
        "Cordero al palo",
        "Pastel de choclo",
        "Mote con huesillos",
        "Sopaipillas",
        "Curanto"
    ],
    argentina: [
        "Milanesas",
        "Empanadas",
        "Pizza fugazeta",
        "Asado",
        "Choripan",
        "Bondiola",
        "Bife de chorizo"
    ],
    colombia: [
        "Bandeja paisa",
        "Chuleta valluna",
        "Sancocho trif\xE1sico",
        "Empanada valluna",
        "Salpicon de frutas",
        "Pastel de garbanzo",
        "Ajiaco",
        "Arepas",
        "Arroz de lisa",
        "Sancocho",
        "Pan de bono",
        "Cuchuco",
        "Oblea",
        "Cazuela de mariscos",
        "Pan de yuca",
        "Bollo Limpio",
        "Almoj\xE1bana",
        "Empanadas",
        "Arroz con Coco",
        "Sopa de mondongo",
        "Cazuela de Mariscos",
        "Arroz con Pollo",
        "Arepa de Huevo",
        "Mote de Queso"
    ],
    ecuador: [
        "Encebollado",
        "Ceviche",
        "Tigrillo",
        "Bolon de verde",
        "Llapingacho",
        "Mote pillo",
        "Locro de papa",
        "Churrasco"
    ],
    peru: [
        "Ceviche",
        "Arroz con pollo",
        "Aji de gallina",
        "Llunca de gallina"
    ],
    "el salvador": [
        "Pupusa",
        "Sopa de patas",
        "Rigua",
        "Flor de izote con huevo",
        "Gallo en chicha"
    ],
    romania: [
        "Sarmale",
        "Mici",
        "Pomana porcului",
        "Ciorb\u0103 de fasole cu ciolan",
        "Ciorb\u0103 de burt\u0103",
        "Ciorb\u0103 r\u0103d\u0103u\u021Bean\u0103",
        "Pl\u0103cint\u0103 cu br\xE2nz\u0103",
        "Ciorb\u0103 de potroace",
        "M\u0103m\u0103lig\u0103 cu br\xE2nz\u0103 \u0219i sm\xE2nt\xE2n\u0103",
        "Tochitur\u0103",
        "Piftie",
        "Iahnie de fasole",
        "Sl\u0103nin\u0103 afumat\u0103",
        "C\xE2rna\u021Bi afuma\u021Bi",
        "Varz\u0103 a la Cluj",
        "Gula\u0219 de cartofi cu afum\u0103tur\u0103",
        "Cozonac de cas\u0103",
        "Ciorb\u0103 ardeleneasc\u0103 de porc",
        "Mucenici moldovene\u0219ti",
        "Salat\u0103 de boeuf",
        "Dovleac copt",
        "Papana\u0219i cu br\xE2nz\u0103 de vac\u0103 \u0219i afine",
        "Drob de miel",
        "P\xE2rjoale moldovene\u0219ti",
        "Zacusc\u0103 de vinete",
        "Zacusc\u0103 de fasole",
        "Turt\u0103 dulce",
        "Cl\u0103titele cu gem",
        "Cl\u0103titele cu br\xE2nza de vac\u0103",
        "Balmo\u0219",
        "Cozonac",
        "Chiftele"
    ]
};
var _Object$keys$1;
(_Object$keys$1 = Object.keys(data$16)) == null ? void 0 : _Object$keys$1.length;
function randFullName(options) {
    const nameOptions = {
        withAccents: options == null ? void 0 : options.withAccents,
        gender: options == null ? void 0 : options.gender
    };
    return fake(()=>`${randFirstName(nameOptions)} ${randLastName(nameOptions)}`, options);
}
function randFutureDate(options) {
    var _options$years;
    const years = (_options$years = options == null ? void 0 : options.years) != null ? _options$years : 1;
    if (years <= 0) {
        throw new Error("Years must be positive, use past() instead");
    }
    const yearsInMilliseconds = years * 365 * 24 * 60 * 60 * 1e3;
    const from = new Date();
    const to = new Date(from.getTime() + yearsInMilliseconds);
    return fake(()=>randBetweenDate({
            from,
            to
        }), options);
}
const ipRange = {
    min: 0,
    max: 255
};
function randIp(options) {
    return fake(()=>Array.from({
            length: 4
        }, ()=>randNumber(ipRange)).join("."), options);
}
var data$Y = [
    "Brand",
    "Tactics",
    "Markets",
    "Usability",
    "Operations",
    "Integration",
    "Identity",
    "Marketing",
    "Creative",
    "Response",
    "Branding",
    "Quality",
    "Program",
    "Accounts",
    "Accountability",
    "Interactions",
    "Security",
    "Applications",
    "Configuration",
    "Factors",
    "Paradigm",
    "Division",
    "Group",
    "Data",
    "Directives",
    "Optimization",
    "Web",
    "Functionality",
    "Research",
    "Intranet",
    "Solutions",
    "Mobility",
    "Communications",
    "Metrics",
    "Assurance"
];
function randJobArea(options) {
    return fake(data$Y, options);
}
var data$W = [
    "Internal Quality Coordinator",
    "Legacy Marketing Planner",
    "Investor Configuration Specialist",
    "Human Directives Engineer",
    "District Quality Technician",
    "Central Mobility Liaison",
    "International Interactions Orchestrator",
    "Central Implementation Producer",
    "Forward Configuration Facilitator",
    "Internal Solutions Coordinator",
    "Global Web Agent",
    "International Brand Associate",
    "Regional Applications Strategist",
    "Direct Brand Analyst",
    "Investor Mobility Consultant",
    "Principal Division Supervisor",
    "Chief Interactions Administrator",
    "District Web Facilitator",
    "Investor Metrics Consultant",
    "Corporate Applications Director",
    "Corporate Group Planner",
    "Global Functionality Manager",
    "Principal Web Engineer",
    "National Directives Executive",
    "Dynamic Factors Officer",
    "Principal Identity Supervisor",
    "Dynamic Solutions Administrator",
    "Corporate Interactions Analyst",
    "Senior Configuration Consultant",
    "Human Web Consultant",
    "Customer Metrics Technician",
    "Senior Solutions Producer",
    "Central Operations Technician",
    "Product Security Producer",
    "Forward Security Executive",
    "Dynamic Assurance Architect",
    "Internal Integration Representative",
    "Lead Web Developer",
    "Human Directives Assistant",
    "Internal Operations Representative",
    "Chief Communications Associate",
    "Principal Branding Strategist",
    "International Paradigm Specialist",
    "Regional Security Administrator",
    "Forward Operations Architect",
    "Product Mobility Orchestrator",
    "Lead Functionality Orchestrator",
    "Lead Solutions Consultant",
    "Human Markets Strategist",
    "International Infrastructure Engineer",
    "Dynamic Response Officer",
    "Dynamic Quality Engineer",
    "National Creative Strategist",
    "Principal Security Representative",
    "Internal Usability Executive",
    "Product Usability Coordinator",
    "Global Optimization Associate",
    "Global Configuration Executive",
    "Global Research Engineer",
    "Regional Accounts Associate",
    "Central Identity Agent",
    "Principal Program Officer",
    "Senior Group Developer",
    "Forward Research Coordinator",
    "Legacy Identity Developer",
    "Central Interactions Developer",
    "Direct Research Technician",
    "Chief Web Planner",
    "Investor Program Architect",
    "National Intranet Architect",
    "Principal Operations Administrator",
    "Legacy Security Associate",
    "Global Communications Architect",
    "Forward Configuration Analyst",
    "Customer Program Representative",
    "Dynamic Communications Director",
    "Dynamic Division Architect",
    "Customer Security Manager",
    "Dynamic Branding Analyst",
    "Internal Configuration Agent",
    "Principal Program Liaison",
    "Regional Research Administrator",
    "Dynamic Functionality Coordinator",
    "Investor Configuration Producer",
    "Direct Web Engineer",
    "Central Implementation Orchestrator",
    "Investor Tactics Strategist",
    "National Creative Agent",
    "Central Intranet Specialist",
    "Future Creative Strategist",
    "Product Intranet Liaison",
    "Dynamic Markets Consultant",
    "Global Infrastructure Administrator",
    "Lead Interactions Supervisor",
    "Future Usability Designer",
    "Principal Research Producer",
    "International Quality Facilitator",
    "Legacy Data Director",
    "Dynamic Infrastructure Representative",
    "Direct Paradigm Analyst"
];
function randJobTitle(options) {
    return fake(data$W, options);
}
function randMask(options) {
    return fake(()=>{
        var _options$mask, _options$char, _options$digit;
        const [mask, __char, digit] = [
            (_options$mask = options == null ? void 0 : options.mask) != null ? _options$mask : "@##@#",
            (_options$char = options == null ? void 0 : options.char) != null ? _options$char : "@",
            (_options$digit = options == null ? void 0 : options.digit) != null ? _options$digit : "#"
        ];
        return mask.split("").map((item)=>{
            if (item === __char) return randAlpha();
            else if (item === digit) return getRandomInRange({
                min: 0,
                max: 9,
                fraction: 0
            });
            else return item;
        }).join("");
    }, options);
}
function randPastDate(options) {
    var _options$years;
    const years = (_options$years = options == null ? void 0 : options.years) != null ? _options$years : 1;
    if (years <= 0) {
        throw new Error("Years must be positive, use future() instead");
    }
    const yearsInMilliseconds = years * 365 * 24 * 60 * 60 * 1e3;
    const to = new Date();
    const from = new Date(to.getTime() - yearsInMilliseconds);
    return fake(()=>randBetweenDate({
            from,
            to
        }), options);
}
var data$F = [
    {
        formats: [
            "+247 ####"
        ],
        countryCode: [
            "AC"
        ]
    },
    {
        formats: [
            "+376 ### ###"
        ],
        countryCode: [
            "AD"
        ]
    },
    {
        formats: [
            "+971 ## ### ####",
            "+971 # ### ####"
        ],
        countryCode: [
            "AE"
        ]
    },
    {
        formats: [
            "+93 ## ### ####"
        ],
        countryCode: [
            "AF"
        ]
    },
    {
        formats: [
            "+1(268)### ####"
        ],
        countryCode: [
            "AG"
        ]
    },
    {
        formats: [
            "+1(264)### ####"
        ],
        countryCode: [
            "AI"
        ]
    },
    {
        formats: [
            "+355(###)### ###"
        ],
        countryCode: [
            "AL"
        ]
    },
    {
        formats: [
            "+374 ## ### ###"
        ],
        countryCode: [
            "AM"
        ]
    },
    {
        formats: [
            "+599 ### ####",
            "+599 9### ####"
        ],
        countryCode: [
            "AN"
        ]
    },
    {
        formats: [
            "+244(###)### ###"
        ],
        countryCode: [
            "AO"
        ]
    },
    {
        formats: [
            "+672 1## ###"
        ],
        countryCode: [
            "AQ"
        ]
    },
    {
        formats: [
            "+54(###)### ####"
        ],
        countryCode: [
            "AR"
        ]
    },
    {
        formats: [
            "+1(684)### ####"
        ],
        countryCode: [
            "AS"
        ]
    },
    {
        formats: [
            "+43(###)### ####"
        ],
        countryCode: [
            "AT"
        ]
    },
    {
        formats: [
            "+61 # #### ####"
        ],
        countryCode: [
            "AU"
        ]
    },
    {
        formats: [
            "+297 ### ####"
        ],
        countryCode: [
            "AW"
        ]
    },
    {
        formats: [
            "+994 ## ### ## ##"
        ],
        countryCode: [
            "AZ"
        ]
    },
    {
        formats: [
            "+387 ## #####",
            "+387 ## ####"
        ],
        countryCode: [
            "BA"
        ]
    },
    {
        formats: [
            "+1(246)### ####"
        ],
        countryCode: [
            "BB"
        ]
    },
    {
        formats: [
            "+880 ## ### ###"
        ],
        countryCode: [
            "BD"
        ]
    },
    {
        formats: [
            "+32(###)### ###"
        ],
        countryCode: [
            "BE"
        ]
    },
    {
        formats: [
            "+226 ## ## ####"
        ],
        countryCode: [
            "BF"
        ]
    },
    {
        formats: [
            "+359(###)### ###"
        ],
        countryCode: [
            "BG"
        ]
    },
    {
        formats: [
            "+973 #### ####"
        ],
        countryCode: [
            "BH"
        ]
    },
    {
        formats: [
            "+257 ## ## ####"
        ],
        countryCode: [
            "BI"
        ]
    },
    {
        formats: [
            "+229 ## ## ####"
        ],
        countryCode: [
            "BJ"
        ]
    },
    {
        formats: [
            "+1(441)### ####"
        ],
        countryCode: [
            "BM"
        ]
    },
    {
        formats: [
            "+673 ### ####"
        ],
        countryCode: [
            "BN"
        ]
    },
    {
        formats: [
            "+591 # ### ####"
        ],
        countryCode: [
            "BO"
        ]
    },
    {
        formats: [
            "+55 ## #### ####",
            "+55 ## ##### ####"
        ],
        countryCode: [
            "BR"
        ]
    },
    {
        formats: [
            "+1(242)### ####"
        ],
        countryCode: [
            "BS"
        ]
    },
    {
        formats: [
            "+975 17 ### ###",
            "+975 # ### ###"
        ],
        countryCode: [
            "BT"
        ]
    },
    {
        formats: [
            "+267 ## ### ###"
        ],
        countryCode: [
            "BW"
        ]
    },
    {
        formats: [
            "+375(##)### ## ##"
        ],
        countryCode: [
            "BY"
        ]
    },
    {
        formats: [
            "+501 ### ####"
        ],
        countryCode: [
            "BZ"
        ]
    },
    {
        formats: [
            "+243(###)### ###"
        ],
        countryCode: [
            "CD"
        ]
    },
    {
        formats: [
            "+236 ## ## ####"
        ],
        countryCode: [
            "CF"
        ]
    },
    {
        formats: [
            "+242 ## ### ####"
        ],
        countryCode: [
            "CG"
        ]
    },
    {
        formats: [
            "+41 ## ### ####"
        ],
        countryCode: [
            "CH"
        ]
    },
    {
        formats: [
            "+225 ## ### ###"
        ],
        countryCode: [
            "CI"
        ]
    },
    {
        formats: [
            "+682 ## ###"
        ],
        countryCode: [
            "CK"
        ]
    },
    {
        formats: [
            "+56 # #### ####"
        ],
        countryCode: [
            "CL"
        ]
    },
    {
        formats: [
            "+237 #### ####"
        ],
        countryCode: [
            "CM"
        ]
    },
    {
        formats: [
            "+86(###)#### ####",
            "+86(###)#### ###",
            "+86 ## ##### #####"
        ],
        countryCode: [
            "CN"
        ]
    },
    {
        formats: [
            "+57(###)### ####"
        ],
        countryCode: [
            "CO"
        ]
    },
    {
        formats: [
            "+506 #### ####"
        ],
        countryCode: [
            "CR"
        ]
    },
    {
        formats: [
            "+53 # ### ####"
        ],
        countryCode: [
            "CU"
        ]
    },
    {
        formats: [
            "+238(###)## ##"
        ],
        countryCode: [
            "CV"
        ]
    },
    {
        formats: [
            "+599 ### ####"
        ],
        countryCode: [
            "CW"
        ]
    },
    {
        formats: [
            "+357 ## ### ###"
        ],
        countryCode: [
            "CY"
        ]
    },
    {
        formats: [
            "+420(###)### ###"
        ],
        countryCode: [
            "CZ"
        ]
    },
    {
        formats: [
            "+49(####)### ####",
            "+49(###)### ####",
            "+49(###)## ####",
            "+49(###)## ###",
            "+49(###)## ##",
            "+49 ### ###"
        ],
        countryCode: [
            "DE"
        ]
    },
    {
        formats: [
            "+253 ## ## ## ##"
        ],
        countryCode: [
            "DJ"
        ]
    },
    {
        formats: [
            "+45 ## ## ## ##"
        ],
        countryCode: [
            "DK"
        ]
    },
    {
        formats: [
            "+1(767)### ####"
        ],
        countryCode: [
            "DM"
        ]
    },
    {
        formats: [
            "+1(809)### ####",
            "+1(829)### ####",
            "+1(849)### ####"
        ],
        countryCode: [
            "DO"
        ]
    },
    {
        formats: [
            "+213 ## ### ####"
        ],
        countryCode: [
            "DZ"
        ]
    },
    {
        formats: [
            "+593 ## ### ####",
            "+593 # ### ####"
        ],
        countryCode: [
            "EC"
        ]
    },
    {
        formats: [
            "+372 #### ####",
            "+372 ### ####"
        ],
        countryCode: [
            "EE"
        ]
    },
    {
        formats: [
            "+20(###)### ####"
        ],
        countryCode: [
            "EG"
        ]
    },
    {
        formats: [
            "+291 # ### ###"
        ],
        countryCode: [
            "ER"
        ]
    },
    {
        formats: [
            "+34(###)### ###"
        ],
        countryCode: [
            "ES"
        ]
    },
    {
        formats: [
            "+251 ## ### ####"
        ],
        countryCode: [
            "ET"
        ]
    },
    {
        formats: [
            "+358(###)### ## ##"
        ],
        countryCode: [
            "FI"
        ]
    },
    {
        formats: [
            "+679 ## #####"
        ],
        countryCode: [
            "FJ"
        ]
    },
    {
        formats: [
            "+500 #####"
        ],
        countryCode: [
            "FK"
        ]
    },
    {
        formats: [
            "+691 ### ####"
        ],
        countryCode: [
            "FM"
        ]
    },
    {
        formats: [
            "+298 ### ###"
        ],
        countryCode: [
            "FO"
        ]
    },
    {
        formats: [
            "+262 ##### ####",
            "+33 1 ## ## ## ##",
            "+33 2 ## ## ## ##",
            "+33 3 ## ## ## ##",
            "+33 4 ## ## ## ##",
            "+33 5 ## ## ## ##",
            "+33 6 ## ## ## ##",
            "+33 7 ## ## ## ##",
            "+508 ## ####",
            "+590(###)### ###"
        ],
        countryCode: [
            "FR"
        ]
    },
    {
        formats: [
            "+241 # ## ## ##"
        ],
        countryCode: [
            "GA"
        ]
    },
    {
        formats: [
            "+1(473)### ####"
        ],
        countryCode: [
            "GD"
        ]
    },
    {
        formats: [
            "+995(###)### ###"
        ],
        countryCode: [
            "GE"
        ]
    },
    {
        formats: [
            "+594 ##### ####"
        ],
        countryCode: [
            "GF"
        ]
    },
    {
        formats: [
            "+233(###)### ###"
        ],
        countryCode: [
            "GH"
        ]
    },
    {
        formats: [
            "+350 ### #####"
        ],
        countryCode: [
            "GI"
        ]
    },
    {
        formats: [
            "+299 ## ## ##"
        ],
        countryCode: [
            "GL"
        ]
    },
    {
        formats: [
            "+220(###)## ##"
        ],
        countryCode: [
            "GM"
        ]
    },
    {
        formats: [
            "+224 ## ### ###"
        ],
        countryCode: [
            "GN"
        ]
    },
    {
        formats: [
            "+240 ## ### ####"
        ],
        countryCode: [
            "GQ"
        ]
    },
    {
        formats: [
            "+30(###)### ####"
        ],
        countryCode: [
            "GR"
        ]
    },
    {
        formats: [
            "+502 # ### ####"
        ],
        countryCode: [
            "GT"
        ]
    },
    {
        formats: [
            "+1(671)### ####"
        ],
        countryCode: [
            "GU"
        ]
    },
    {
        formats: [
            "+245 # ######"
        ],
        countryCode: [
            "GW"
        ]
    },
    {
        formats: [
            "+592 ### ####"
        ],
        countryCode: [
            "GY"
        ]
    },
    {
        formats: [
            "+852 #### ####"
        ],
        countryCode: [
            "HK"
        ]
    },
    {
        formats: [
            "+504 #### ####"
        ],
        countryCode: [
            "HN"
        ]
    },
    {
        formats: [
            "+385 (##) ### ###",
            "+385 (##) ### ####",
            "+385 1 #### ###"
        ],
        countryCode: [
            "HR"
        ]
    },
    {
        formats: [
            "+509 ## ## ####"
        ],
        countryCode: [
            "HT"
        ]
    },
    {
        formats: [
            "+36(###)### ###"
        ],
        countryCode: [
            "HU"
        ]
    },
    {
        formats: [
            "+62(8##)### ####",
            "+62(8##)### ###",
            "+62(8##)### ## ###",
            "+62 ## ### ##",
            "+62 ## ### ###",
            "+62 ## ### ####"
        ],
        countryCode: [
            "ID"
        ]
    },
    {
        formats: [
            "+353(###)### ###"
        ],
        countryCode: [
            "IE"
        ]
    },
    {
        formats: [
            "+972 5# ### ####",
            "+972 # ### ####"
        ],
        countryCode: [
            "IL"
        ]
    },
    {
        formats: [
            "+91 ##### #####"
        ],
        countryCode: [
            "IN"
        ]
    },
    {
        formats: [
            "+246 ### ####"
        ],
        countryCode: [
            "IO"
        ]
    },
    {
        formats: [
            "+964(###)### ####"
        ],
        countryCode: [
            "IQ"
        ]
    },
    {
        formats: [
            "+98(###)### ####"
        ],
        countryCode: [
            "IR"
        ]
    },
    {
        formats: [
            "+354 ### ####"
        ],
        countryCode: [
            "IS"
        ]
    },
    {
        formats: [
            "+39(0##)#### ## ##",
            "+39(0##)#### ###",
            "+39(0##)### ###",
            "+39(0##)## ###",
            "+39(0##)## ##",
            "+39(0#)## ##",
            "+39(3##)### ## ##",
            "+39(3##)## ## ##"
        ],
        countryCode: [
            "IT"
        ]
    },
    {
        formats: [
            "+1(876)### ####"
        ],
        countryCode: [
            "JM"
        ]
    },
    {
        formats: [
            "+962 # #### ####"
        ],
        countryCode: [
            "JO"
        ]
    },
    {
        formats: [
            "+81 ## #### ####",
            "+81(###)### ###"
        ],
        countryCode: [
            "JP"
        ]
    },
    {
        formats: [
            "+254 ### ######"
        ],
        countryCode: [
            "KE"
        ]
    },
    {
        formats: [
            "+996(###)### ###"
        ],
        countryCode: [
            "KG"
        ]
    },
    {
        formats: [
            "+855 ## ### ###"
        ],
        countryCode: [
            "KH"
        ]
    },
    {
        formats: [
            "+686 ## ###"
        ],
        countryCode: [
            "KI"
        ]
    },
    {
        formats: [
            "+269 ## #####"
        ],
        countryCode: [
            "KM"
        ]
    },
    {
        formats: [
            "+1(869)### ####"
        ],
        countryCode: [
            "KN"
        ]
    },
    {
        formats: [
            "+850 191 ### ####",
            "+850 ## ### ###",
            "+850 ### #### ###",
            "+850 ### ###",
            "+850 #### ####",
            "+850 #### #############"
        ],
        countryCode: [
            "KP"
        ]
    },
    {
        formats: [
            "+82 ## ### ####"
        ],
        countryCode: [
            "KR"
        ]
    },
    {
        formats: [
            "+965 #### ####"
        ],
        countryCode: [
            "KW"
        ]
    },
    {
        formats: [
            "+1(345)### ####"
        ],
        countryCode: [
            "KY"
        ]
    },
    {
        formats: [
            "+7(6##)### ## ##",
            "+7(7##)### ## ##"
        ],
        countryCode: [
            "KZ"
        ]
    },
    {
        formats: [
            "+856(20##)### ###",
            "+856 ## ### ###"
        ],
        countryCode: [
            "LA"
        ]
    },
    {
        formats: [
            "+961 ## ### ###",
            "+961 # ### ###"
        ],
        countryCode: [
            "LB"
        ]
    },
    {
        formats: [
            "+1(758)### ####"
        ],
        countryCode: [
            "LC"
        ]
    },
    {
        formats: [
            "+423(###)### ####"
        ],
        countryCode: [
            "LI"
        ]
    },
    {
        formats: [
            "+94 ## ### ####"
        ],
        countryCode: [
            "LK"
        ]
    },
    {
        formats: [
            "+231 ## ### ###"
        ],
        countryCode: [
            "LR"
        ]
    },
    {
        formats: [
            "+266 # ### ####"
        ],
        countryCode: [
            "LS"
        ]
    },
    {
        formats: [
            "+370(###)## ###"
        ],
        countryCode: [
            "LT"
        ]
    },
    {
        formats: [
            "+352 ### ###",
            "+352 #### ###",
            "+352 ##### ###",
            "+352 ###### ###"
        ],
        countryCode: [
            "LU"
        ]
    },
    {
        formats: [
            "+371 ## ### ###"
        ],
        countryCode: [
            "LV"
        ]
    },
    {
        formats: [
            "+218 ## ### ###",
            "+218 21 ### ####"
        ],
        countryCode: [
            "LY"
        ]
    },
    {
        formats: [
            "+212 ## #### ###"
        ],
        countryCode: [
            "MA"
        ]
    },
    {
        formats: [
            "+377(###)### ###",
            "+377 ## ### ###"
        ],
        countryCode: [
            "MC"
        ]
    },
    {
        formats: [
            "+373 #### ####"
        ],
        countryCode: [
            "MD"
        ]
    },
    {
        formats: [
            "+382 ## ### ###"
        ],
        countryCode: [
            "ME"
        ]
    },
    {
        formats: [
            "+261 ## ## #####"
        ],
        countryCode: [
            "MG"
        ]
    },
    {
        formats: [
            "+692 ### ####"
        ],
        countryCode: [
            "MH"
        ]
    },
    {
        formats: [
            "+389 ## ### ###"
        ],
        countryCode: [
            "MK"
        ]
    },
    {
        formats: [
            "+223 ## ## ####"
        ],
        countryCode: [
            "ML"
        ]
    },
    {
        formats: [
            "+95 ## ### ###",
            "+95 # ### ###",
            "+95 ### ###"
        ],
        countryCode: [
            "MM"
        ]
    },
    {
        formats: [
            "+976 ## ## ####"
        ],
        countryCode: [
            "MN"
        ]
    },
    {
        formats: [
            "+853 #### ####"
        ],
        countryCode: [
            "MO"
        ]
    },
    {
        formats: [
            "+1(670)### ####"
        ],
        countryCode: [
            "MP"
        ]
    },
    {
        formats: [
            "+596(###)## ## ##"
        ],
        countryCode: [
            "MQ"
        ]
    },
    {
        formats: [
            "+222 ## ## ####"
        ],
        countryCode: [
            "MR"
        ]
    },
    {
        formats: [
            "+1(664)### ####"
        ],
        countryCode: [
            "MS"
        ]
    },
    {
        formats: [
            "+356 #### ####"
        ],
        countryCode: [
            "MT"
        ]
    },
    {
        formats: [
            "+230 ### ####"
        ],
        countryCode: [
            "MU"
        ]
    },
    {
        formats: [
            "+960 ### ####"
        ],
        countryCode: [
            "MV"
        ]
    },
    {
        formats: [
            "+265 1 ### ###",
            "+265 # #### ####"
        ],
        countryCode: [
            "MW"
        ]
    },
    {
        formats: [
            "+52(###)### ####",
            "+52 ## ## ####"
        ],
        countryCode: [
            "MX"
        ]
    },
    {
        formats: [
            "+60 ## ### ####",
            "+60 11 #### ####",
            "+60(###)### ###",
            "+60 ## ### ###",
            "+60 # ### ###"
        ],
        countryCode: [
            "MY"
        ]
    },
    {
        formats: [
            "+258 ## ### ###"
        ],
        countryCode: [
            "MZ"
        ]
    },
    {
        formats: [
            "+264 ## ### ####"
        ],
        countryCode: [
            "NA"
        ]
    },
    {
        formats: [
            "+687 ## ####"
        ],
        countryCode: [
            "NC"
        ]
    },
    {
        formats: [
            "+227 ## ## ####"
        ],
        countryCode: [
            "NE"
        ]
    },
    {
        formats: [
            "+672 3## ###"
        ],
        countryCode: [
            "NF"
        ]
    },
    {
        formats: [
            "+234(###)### ####",
            "+234 ## ### ###",
            "+234 ## ### ##",
            "+234(###)### ####"
        ],
        countryCode: [
            "NG"
        ]
    },
    {
        formats: [
            "+505 #### ####"
        ],
        countryCode: [
            "NI"
        ]
    },
    {
        formats: [
            "+31 ## ### ####"
        ],
        countryCode: [
            "NL"
        ]
    },
    {
        formats: [
            "+47(###)## ###"
        ],
        countryCode: [
            "NO"
        ]
    },
    {
        formats: [
            "+977 ## ### ###"
        ],
        countryCode: [
            "NP"
        ]
    },
    {
        formats: [
            "+674 ### ####"
        ],
        countryCode: [
            "NR"
        ]
    },
    {
        formats: [
            "+683 ####"
        ],
        countryCode: [
            "NU"
        ]
    },
    {
        formats: [
            "+64(###)### ###[#]",
            "+64 ## ### ###"
        ],
        countryCode: [
            "NZ"
        ]
    },
    {
        formats: [
            "+968 ## ### ###"
        ],
        countryCode: [
            "OM"
        ]
    },
    {
        formats: [
            "+507 ### ####"
        ],
        countryCode: [
            "PA"
        ]
    },
    {
        formats: [
            "+51(###)### ###"
        ],
        countryCode: [
            "PE"
        ]
    },
    {
        formats: [
            "+689 ## ## ##"
        ],
        countryCode: [
            "PF"
        ]
    },
    {
        formats: [
            "+675(###)## ###"
        ],
        countryCode: [
            "PG"
        ]
    },
    {
        formats: [
            "+63(###)### ####"
        ],
        countryCode: [
            "PH"
        ]
    },
    {
        formats: [
            "+92(###)### ####"
        ],
        countryCode: [
            "PK"
        ]
    },
    {
        formats: [
            "+48(###)### ###"
        ],
        countryCode: [
            "PL"
        ]
    },
    {
        formats: [
            "+970 ## ### ####"
        ],
        countryCode: [
            "PS"
        ]
    },
    {
        formats: [
            "+351 ## ### ####"
        ],
        countryCode: [
            "PT"
        ]
    },
    {
        formats: [
            "+680 ### ####"
        ],
        countryCode: [
            "PW"
        ]
    },
    {
        formats: [
            "+595(###)### ###"
        ],
        countryCode: [
            "PY"
        ]
    },
    {
        formats: [
            "+974 #### ####"
        ],
        countryCode: [
            "QA"
        ]
    },
    {
        formats: [
            "+262 ##### ####"
        ],
        countryCode: [
            "RE"
        ]
    },
    {
        formats: [
            "+40 ## ### ####"
        ],
        countryCode: [
            "RO"
        ]
    },
    {
        formats: [
            "+381 ## ### ####"
        ],
        countryCode: [
            "RS"
        ]
    },
    {
        formats: [
            "+7(###)### ## ##"
        ],
        countryCode: [
            "RU"
        ]
    },
    {
        formats: [
            "+250(###)### ###"
        ],
        countryCode: [
            "RW"
        ]
    },
    {
        formats: [
            "+966 5 #### ####",
            "+966 # ### ####"
        ],
        countryCode: [
            "SA"
        ]
    },
    {
        formats: [
            "+677 ### ####",
            "+677 #####"
        ],
        countryCode: [
            "SB"
        ]
    },
    {
        formats: [
            "+248 # ### ###"
        ],
        countryCode: [
            "SC"
        ]
    },
    {
        formats: [
            "+249 ## ### ####"
        ],
        countryCode: [
            "SD"
        ]
    },
    {
        formats: [
            "+46 ## ### ####"
        ],
        countryCode: [
            "SE"
        ]
    },
    {
        formats: [
            "+65 #### ####"
        ],
        countryCode: [
            "SG"
        ]
    },
    {
        formats: [
            "+290 ####",
            "+290 ####"
        ],
        countryCode: [
            "SH"
        ]
    },
    {
        formats: [
            "+386 ## ### ###"
        ],
        countryCode: [
            "SI"
        ]
    },
    {
        formats: [
            "+421(###)### ###"
        ],
        countryCode: [
            "SK"
        ]
    },
    {
        formats: [
            "+232 ## ######"
        ],
        countryCode: [
            "SL"
        ]
    },
    {
        formats: [
            "+378 #### ######"
        ],
        countryCode: [
            "SM"
        ]
    },
    {
        formats: [
            "+221 ## ### ####"
        ],
        countryCode: [
            "SN"
        ]
    },
    {
        formats: [
            "+252 ## ### ###",
            "+252 # ### ###",
            "+252 # ### ###"
        ],
        countryCode: [
            "SO"
        ]
    },
    {
        formats: [
            "+597 ### ####",
            "+597 ### ###"
        ],
        countryCode: [
            "SR"
        ]
    },
    {
        formats: [
            "+211 ## ### ####"
        ],
        countryCode: [
            "SS"
        ]
    },
    {
        formats: [
            "+239 ## #####"
        ],
        countryCode: [
            "ST"
        ]
    },
    {
        formats: [
            "+503 ## ## ####"
        ],
        countryCode: [
            "SV"
        ]
    },
    {
        formats: [
            "+1(721)### ####"
        ],
        countryCode: [
            "SX"
        ]
    },
    {
        formats: [
            "+963 ## #### ###"
        ],
        countryCode: [
            "SY"
        ]
    },
    {
        formats: [
            "+268 ## ## ####"
        ],
        countryCode: [
            "SZ"
        ]
    },
    {
        formats: [
            "+1(649)### ####"
        ],
        countryCode: [
            "TC"
        ]
    },
    {
        formats: [
            "+235 ## ## ## ##"
        ],
        countryCode: [
            "TD"
        ]
    },
    {
        formats: [
            "+228 ## ### ###"
        ],
        countryCode: [
            "TG"
        ]
    },
    {
        formats: [
            "+66 ## ### ####",
            "+66 ## ### ###"
        ],
        countryCode: [
            "TH"
        ]
    },
    {
        formats: [
            "+992 ## ### ####"
        ],
        countryCode: [
            "TJ"
        ]
    },
    {
        formats: [
            "+690 ####"
        ],
        countryCode: [
            "TK"
        ]
    },
    {
        formats: [
            "+670 ### ####",
            "+670 77# #####",
            "+670 78# #####"
        ],
        countryCode: [
            "TL"
        ]
    },
    {
        formats: [
            "+993 # ### ####"
        ],
        countryCode: [
            "TM"
        ]
    },
    {
        formats: [
            "+216 ## ### ###"
        ],
        countryCode: [
            "TN"
        ]
    },
    {
        formats: [
            "+676 #####"
        ],
        countryCode: [
            "TO"
        ]
    },
    {
        formats: [
            "+90(###)### ####"
        ],
        countryCode: [
            "TR"
        ]
    },
    {
        formats: [
            "+1(868)### ####"
        ],
        countryCode: [
            "TT"
        ]
    },
    {
        formats: [
            "+688 90####",
            "+688 2####"
        ],
        countryCode: [
            "TV"
        ]
    },
    {
        formats: [
            "+886 # #### ####",
            "+886 #### ####"
        ],
        countryCode: [
            "TW"
        ]
    },
    {
        formats: [
            "+255 ## ### ####"
        ],
        countryCode: [
            "TZ"
        ]
    },
    {
        formats: [
            "+380(##)### ## ##"
        ],
        countryCode: [
            "UA"
        ]
    },
    {
        formats: [
            "+256(###)### ###"
        ],
        countryCode: [
            "UG"
        ]
    },
    {
        formats: [
            "+44 #### ######"
        ],
        countryCode: [
            "GB",
            "UK"
        ]
    },
    {
        formats: [
            "+598 # ### ## ##"
        ],
        countryCode: [
            "UY"
        ]
    },
    {
        formats: [
            "+998 ## ### ####"
        ],
        countryCode: [
            "UZ"
        ]
    },
    {
        formats: [
            "+39 6 698 #####"
        ],
        countryCode: [
            "VA"
        ]
    },
    {
        formats: [
            "+1(784)### ####"
        ],
        countryCode: [
            "VC"
        ]
    },
    {
        formats: [
            "+58(###)### ####"
        ],
        countryCode: [
            "VE"
        ]
    },
    {
        formats: [
            "+1(284)### ####"
        ],
        countryCode: [
            "VG"
        ]
    },
    {
        formats: [
            "+1(340)### ####"
        ],
        countryCode: [
            "VI"
        ]
    },
    {
        formats: [
            "+84 ## #### ###",
            "+84(###)#### ###"
        ],
        countryCode: [
            "VN"
        ]
    },
    {
        formats: [
            "+678 ## #####",
            "+678 #####"
        ],
        countryCode: [
            "VU"
        ]
    },
    {
        formats: [
            "+681 ## ####"
        ],
        countryCode: [
            "WF"
        ]
    },
    {
        formats: [
            "+685 ## ####"
        ],
        countryCode: [
            "WS"
        ]
    },
    {
        formats: [
            "+967 ### ### ###",
            "+967 # ### ###",
            "+967 ## ### ###"
        ],
        countryCode: [
            "YE"
        ]
    },
    {
        formats: [
            "+27 ## ### ####"
        ],
        countryCode: [
            "ZA"
        ]
    },
    {
        formats: [
            "+260 ## ### ####"
        ],
        countryCode: [
            "ZM"
        ]
    },
    {
        formats: [
            "+263 # ######"
        ],
        countryCode: [
            "ZW"
        ]
    },
    {
        formats: [
            "+1(###)### ####"
        ],
        countryCode: [
            "US",
            "CA"
        ]
    }
];
function randPhoneNumber(options) {
    let formats;
    if (options != null && options.countryCode) {
        var _data$find;
        formats = ((_data$find = data$F.find((country)=>{
            return country.countryCode.includes(options.countryCode);
        })) == null ? void 0 : _data$find.formats) || [];
    } else {
        formats = data$F.map(({ formats: formats2  })=>formats2).flat();
    }
    const phoneNumber = Array.from({
        length: (options == null ? void 0 : options.length) || 1
    }, ()=>randMask({
            mask: randElement(formats)
        }));
    return fake(phoneNumber, options);
}
var data$E = [
    "Try to program the GB interface, maybe it will copy the wireless hard drive!",
    "Try to bypass the GB panel, maybe it will synthesize the back-end transmitter!",
    "If we program the protocol, we can get to the SDD application through the virtual RAM pixel!",
    "Use the open-source THX application, then you can quantify the solid state transmitter!",
    "You cant transmit the firewall without copying the 1080p SDD interface!",
    "Ill compress the open-source SAS bandwidth, that should array the FTP port!",
    "programming the alarm wont do anything, we need to hack the solid state ADP transmitter!",
    "calculating the interface wont do anything, we need to bypass the mobile IB panel!",
    "Try to calculate the GB transmitter, maybe it will quantify the online pixel!",
    "If we calculate the circuit, we can get to the HDD driver through the optical XML panel!",
    "navigating the program wont do anything, we need to calculate the cross-platform SMS capacitor!",
    "Try to calculate the JBOD firewall, maybe it will override the redundant port!",
    "If we quantify the alarm, we can get to the FTP pixel through the online SSL interface!",
    "You cant override the capacitor without indexing the bluetooth PNG pixel!",
    "quantifying the microchip wont do anything, we need to index the online SQL hard drive!",
    "connecting the port wont do anything, we need to program the haptic RSS pixel!",
    "We need to back up the 1080p JBOD bandwidth!",
    "If we index the card, we can get to the SMS hard drive through the bluetooth AGP bus!",
    "Ill compress the optical SDD hard drive, that should interface the XSS bandwidth!",
    "You cant copy the feed without compressing the primary JBOD circuit!",
    "If we back up the application, we can get to the TCP bus through the auxiliary FTP hard drive!",
    "Try to override the RSS port, maybe it will quantify the haptic port!",
    "We need to calculate the bluetooth JBOD bus!",
    "bypassing the bus wont do anything, we need to program the wireless SDD driver!",
    "Try to parse the PCI capacitor, maybe it will quantify the bluetooth interface!",
    "copying the monitor wont do anything, we need to synthesize the back-end ADP application!",
    "Try to index the PNG card, maybe it will transmit the neural system!",
    "Try to bypass the SCSI sensor, maybe it will generate the 1080p card!",
    "We need to calculate the open-source SDD driver!",
    "If we reboot the port, we can get to the RSS application through the 1080p SQL microchip!",
    "Use the cross-platform AI system, then you can connect the digital card!",
    "We need to navigate the virtual SSL transmitter!",
    "The JSON hard drive is down, bypass the redundant firewall so we can copy the FTP port!",
    "We need to navigate the haptic JBOD system!",
    "We need to generate the virtual USB pixel!",
    "Ill override the digital ADP alarm, that should microchip the USB firewall!",
    "We need to bypass the redundant RAM pixel!",
    "Ill compress the cross-platform EXE card, that should circuit the AGP sensor!",
    "The AGP protocol is down, compress the open-source card so we can override the XML program!",
    "Ill reboot the bluetooth GB capacitor, that should card the HDD panel!",
    "Ill connect the neural IB matrix, that should array the CSS card!",
    "The EXE matrix is down, transmit the wireless matrix so we can index the RAM pixel!",
    "The THX monitor is down, reboot the auxiliary array so we can parse the XML microchip!",
    "Try to override the HDD firewall, maybe it will generate the open-source panel!",
    "We need to index the digital JBOD bus!",
    "Use the multi-byte THX firewall, then you can back up the digital system!",
    "Use the 1080p IB feed, then you can reboot the haptic feed!",
    "Try to bypass the SAS card, maybe it will transmit the solid state system!",
    "Try to quantify the TCP array, maybe it will index the virtual transmitter!",
    "Ill override the cross-platform PCI port, that should driver the FTP card!",
    "If we override the bandwidth, we can get to the SMTP capacitor through the cross-platform RSS alarm!",
    "Use the redundant AGP transmitter, then you can generate the 1080p circuit!",
    "Use the auxiliary EXE monitor, then you can hack the haptic port!",
    "Try to synthesize the SCSI card, maybe it will back up the 1080p circuit!",
    "We need to transmit the auxiliary GB sensor!",
    "Use the mobile GB transmitter, then you can quantify the wireless system!",
    "Try to quantify the SQL application, maybe it will bypass the primary pixel!",
    "You cant override the protocol without programming the mobile RAM card!",
    "The JBOD port is down, program the wireless array so we can input the PCI program!",
    "Use the auxiliary JSON card, then you can copy the optical matrix!",
    "We need to calculate the wireless TCP circuit!",
    "Use the back-end AI firewall, then you can parse the optical program!",
    "navigating the hard drive wont do anything, we need to synthesize the auxiliary USB circuit!",
    "Ill quantify the redundant TCP bus, that should hard drive the ADP bandwidth!",
    "If we back up the sensor, we can get to the JBOD matrix through the optical EXE alarm!",
    "Try to generate the TCP bus, maybe it will override the neural bandwidth!",
    "The ADP protocol is down, parse the 1080p card so we can reboot the ADP application!",
    "calculating the driver wont do anything, we need to generate the optical SMTP feed!",
    "Ill calculate the 1080p XML transmitter, that should alarm the RSS firewall!",
    "You cant connect the interface without programming the virtual PNG protocol!",
    "Use the cross-platform THX array, then you can parse the primary capacitor!",
    "generating the sensor wont do anything, we need to hack the solid state AI bus!",
    "Try to calculate the JBOD program, maybe it will synthesize the mobile system!",
    "We need to program the back-end PNG pixel!",
    "Ill program the virtual XML microchip, that should transmitter the SDD protocol!",
    "If we hack the firewall, we can get to the USB application through the bluetooth SDD system!",
    "Use the auxiliary SDD system, then you can input the redundant hard drive!",
    "The GB port is down, quantify the mobile circuit so we can hack the SMTP system!",
    "You cant quantify the driver without transmitting the multi-byte SQL microchip!",
    "Try to parse the SMTP array, maybe it will generate the multi-byte port!",
    "copying the system wont do anything, we need to calculate the virtual SSL circuit!",
    "Use the bluetooth TCP capacitor, then you can reboot the open-source hard drive!",
    "If we navigate the card, we can get to the ADP array through the open-source IB feed!",
    "Try to input the HTTP feed, maybe it will reboot the mobile capacitor!",
    "If we input the driver, we can get to the RAM monitor through the 1080p GB bus!",
    "Ill calculate the wireless ADP port, that should bandwidth the SSL microchip!",
    "Use the haptic XSS driver, then you can connect the wireless program!",
    "quantifying the circuit wont do anything, we need to parse the back-end FTP interface!",
    "Ill reboot the online COM interface, that should system the THX protocol!",
    "Try to transmit the HTTP card, maybe it will override the multi-byte hard drive!",
    "Ill program the back-end THX matrix, that should interface the HDD panel!",
    "Ill generate the virtual SQL protocol, that should bus the AI hard drive!",
    "We need to calculate the mobile AGP panel!",
    "Ill compress the back-end PCI circuit, that should monitor the PNG driver!",
    "We need to quantify the primary TCP matrix!",
    "Ill synthesize the primary AI capacitor, that should array the JBOD sensor!",
    "You cant hack the card without indexing the primary XSS capacitor!",
    "The TCP feed is down, compress the cross-platform alarm so we can synthesize the XSS array!",
    "The JSON interface is down, hack the haptic transmitter so we can bypass the XML system!",
    "Use the online SDD protocol, then you can parse the open-source bandwidth!"
];
function randPhrase(options) {
    return fake(data$E, options);
}
function randUuid(options) {
    const v4options = {
        random: randNumber({
            min: 0,
            max: 255,
            length: 16
        })
    };
    return fake(()=>v4(v4options), options);
}
function randUserName(options) {
    return fake(()=>{
        var _options$firstName, _options$lastName;
        const firstName = (_options$firstName = options == null ? void 0 : options.firstName) != null ? _options$firstName : randFirstName();
        const lastName = (_options$lastName = options == null ? void 0 : options.lastName) != null ? _options$lastName : randLastName();
        let userName = `${firstName} ${lastName}`.replace(" ", fake([
            ".",
            "_"
        ]));
        if (randBoolean()) {
            userName += randNumber({
                min: 0,
                max: 100
            });
        }
        return userName;
    }, options);
}
var data$D = [
    "King Drives",
    "Georgiana Throughway",
    "Antonietta Highway",
    "Elian Road",
    "Reynold Crossing",
    "Max Wall",
    "Lehner Drive",
    "Graham Walks",
    "Buckridge Drives",
    "Schimmel Fields",
    "Doyle Expressway",
    "Cade Forks",
    "Myriam Spur",
    "Fannie Loaf",
    "Dorian Gateway",
    "Ruecker Fields",
    "Daugherty Center",
    "Emerald Key",
    "Jazmyn Isle",
    "Viviane Junctions",
    "Price Spring",
    "Aracely Row",
    "Chyna Plaza",
    "Harmon Lodge",
    "Konopelski Inlet",
    "Dave Stravenue",
    "Goyette Circle",
    "Stokes Wells",
    "Arturo Manors",
    "Schumm Land",
    "Bechtelar Fields",
    "Natalia Points",
    "Dianna Inlet",
    "Curt Locks",
    "Durgan Parkways",
    "Dante Summit",
    "Hilma Mills",
    "Stiedemann Field",
    "Genesis Plaza",
    "Carmelo Plaza",
    "Gutkowski Ferry",
    "Abbott Square",
    "Hodkiewicz Oval",
    "Heathcote Cliff",
    "Calista Via",
    "Kihn Expressway",
    "Caesar Place",
    "Lockman Greens",
    "Brisa Hill",
    "Quigley Parkways",
    "Howell Vista",
    "Fisher Light",
    "Tremblay Springs",
    "Stroman Turnpike",
    "Howell Plaza",
    "Wilma Greens",
    "Adell Mews",
    "Shakira Crossroad",
    "Moises Causeway",
    "Frances Groves",
    "Sammy Creek",
    "Wolf Glen",
    "Fay Corners",
    "Collins Lane",
    "Smitham Drive",
    "Cronin Shoal",
    "Missouri Extension",
    "Leffler Fields",
    "Laurianne Glens",
    "Parker Ways",
    "Benny River",
    "Kreiger Mission",
    "Dameon Mountain",
    "Emard Hill",
    "Quitzon Green",
    "Corwin Mission",
    "Rosendo Spring",
    "Carter Pike",
    "Harber Village",
    "Jade Shore",
    "Dariana Junction",
    "Beer Plaza",
    "Hauck Stream",
    "Joshuah Fork",
    "Rath Walk",
    "Eugenia Heights",
    "Kuphal Mountain",
    "Zboncak Harbor",
    "Torphy Fords",
    "Jocelyn Throughway",
    "Cole Center",
    "Forest Path",
    "Oswald Junction",
    "King Springs",
    "Zulauf Branch",
    "Esteban Inlet",
    "Conner Vista",
    "Zboncak Center",
    "Glover Lights",
    "Rohan Tunnel"
];
function randStreetName(options) {
    return fake(data$D, options);
}
function randStreetAddress(options) {
    return fake(()=>`${randNumber({
            min: 0,
            max: 1500
        })} ${randStreetName()}`, options);
}
function randZipCode(options) {
    return fake(()=>{
        let zipCode = "" + randNumber({
            min: 1e4,
            max: 99999
        });
        if (randBoolean()) {
            zipCode += "-" + randNumber({
                min: 1e3,
                max: 9999
            });
        }
        return zipCode;
    }, options);
}
function randAddress(options) {
    var _options$includeCount, _options$includeCount2;
    const includeCounty = (_options$includeCount = options == null ? void 0 : options.includeCounty) != null ? _options$includeCount : true;
    const includeCountry = (_options$includeCount2 = options == null ? void 0 : options.includeCountry) != null ? _options$includeCount2 : true;
    const factory = ()=>{
        const address = {
            street: randStreetAddress(),
            city: randCity(),
            zipCode: randZipCode()
        };
        if (includeCounty) {
            address.county = randCounty();
        }
        if (includeCountry) {
            address.country = randCountry();
        }
        return address;
    };
    return fake(factory, options);
}
var data$l = {
    olympic: [
        "Archery",
        "Artistic Gymnastics",
        "Artistic Swimming",
        "Athletics",
        "Badminton",
        "Baseball Softball",
        "Basketball",
        "Beach Volleyball",
        "BMX Freestyle",
        "BMX Racing",
        "Boxing",
        "Kayak Flatwater",
        "Kayak Slalom",
        "Diving",
        "Equestrian",
        "Fencing",
        "Football",
        "Golf",
        "Handball",
        "Hockey",
        "Judo",
        "Karate",
        "Marathon Swimming",
        "Modern Pentathlon",
        "Mountain Bike",
        "Rhythmic Gymnastics",
        "Road Cycling",
        "Rowing",
        "Rugby",
        "Sailing",
        "Shooting",
        "Skateboarding",
        "Sport Climbing",
        "Surfing",
        "Swimming",
        "Table Tennis",
        "Taekwondo",
        "Tennis",
        "Track Cycling",
        "Trampoline",
        "Triathlon",
        "Volleyball",
        "Water Polo",
        "Weightlifting",
        "Wrestling"
    ],
    winterOlympic: [
        "Alpine Skiing",
        "Biathlon",
        "Bobsleigh",
        "Cross-Country Skiing",
        "Curling",
        "Figure Skating",
        "Freestyle Skiing",
        "Ice Hockey",
        "Luge",
        "Nordic Combined",
        "Short Track Speed Skating",
        "Skeleton",
        "Ski Jumping",
        "Snowboard",
        "Speed Skating"
    ],
    outdoor: [
        "Archery",
        "Athletics",
        "Badminton",
        "Baseball",
        "Basketball",
        "Bowling",
        "Boxing",
        "Camping",
        "Canoeing",
        "Climbing",
        "Cricket",
        "Curling",
        "Cycling",
        "Equestrian",
        "Fencing",
        "Football",
        "Golf",
        "Gymnastics",
        "Handball",
        "Hang Gliding",
        "High Jumping",
        "Hockey",
        "Ice Hockey",
        "Judo",
        "Karate",
        "Kite Flying",
        "Monkey Bars",
        "Motorsports",
        "Netball",
        "Rowing",
        "Rugby",
        "Running",
        "Sailing",
        "Skateboarding",
        "Slide",
        "Snow Skiing",
        "Soccer",
        "Street Hockey",
        "Surfing",
        "Swimming",
        "Table Tennis",
        "Tennis",
        "Trekking",
        "Triathlon",
        "Volleyball",
        "Weightlifting",
        "Wrestling"
    ]
};
var _Object$keys;
const categoriesCount = (_Object$keys = Object.keys(data$l)) == null ? void 0 : _Object$keys.length;
function randSports(options) {
    const sportsData = data$l;
    const category = options == null ? void 0 : options.category;
    if (!categoriesCount) {
        throw "No Sport Categories found";
    }
    if (category && !sportsData[category]) {
        throw `No Sports found for selected category (${category})`;
    }
    const factory = ()=>{
        if (category) {
            return randElement(sportsData[category]);
        }
        const randIndex = getRandomInRange({
            min: 0,
            max: categoriesCount - 1,
            fraction: 0
        });
        const randomOrigin = Object.keys(sportsData)[randIndex];
        return randElement(sportsData[randomOrigin]);
    };
    return fake(factory, options);
}
function randUrl(options) {
    return fake(()=>{
        return `${fake([
            "http",
            "https"
        ])}://${randWord()}.${randDomainSuffix()}`;
    }, options);
}
({
    bash: '#!/bin/bash\n\nmove()\n{\n  local n="$1"\n  local from="$2"\n  local to="$3"\n  local via="$4"\n\n  if [[ "$n" == "1" ]]\n  then\n    echo "Move disk from pole $from to pole $to"\n  else\n    move $(($n - 1)) $from $via $to\n    move 1 $from $to $via\n    move $(($n - 1)) $via $to $from\n  fi\n}\n\nmove $1 $2 $3 $4',
    c: '#include <stdio.h>\n\nvoid move(int n, int from, int via, int to) {\n   if (n > 1) {\n      move(n - 1, from, to, via);\n      printf("Move disk from pole %d to pole %d\\n", from, to);\n      move(n - 1, via, from, to);\n   } else {\n      printf("Move disk from pole %d to pole %d\\n", from, to);\n   }\n}\nint main() {\n   move(4, 1, 2, 3);\n   return 0;\n}',
    "c#": 'public void move(int n, int from, int to, int via) {\n  if (n == 1) {\n    System.Console.WriteLine("Move disk from pole " + from + " to pole " + to);\n  } else {\n    move(n - 1, from, via, to);\n    move(1, from, to, via);\n    move(n - 1, via, to, from);\n  }\n}',
    "c++": 'void move(int n, int from, int to, int via) {\n  if (n == 1) {\n    std::cout << "Move disk from pole " << from << " to pole " << to << std::endl;\n  } else {\n    move(n - 1, from, via, to);\n    move(1, from, to, via);\n    move(n - 1, via, to, from);\n  }\n}',
    css: ".hover-rotate {\n  overflow: hidden;\n  margin: 8px;\n  min-width: 240px;\n  max-width: 320px;\n  width: 100%;\n}\n\n.hover-rotate img {\n  transition: all 0.3s;\n  box-sizing: border-box;\n  max-width: 100%;\n}\n\n.hover-rotate:hover img {\n  transform: scale(1.3) rotate(5deg);\n}",
    go: "func fib(a int) int {\n  if a < 2 {\n      return a\n  }\n  return fib(a - 1) + fib(a - 2)\n}",
    html: '<form action="http://maps.google.com/maps" method="get" target="_blank">\n  <label for="saddr">Enter your location</label>\n  <input type="text" name="saddr" />\n  <input type="hidden" name="daddr" value="350 5th Ave New York, NY 10018 (Empire State Building)" />\n  <input type="submit" value="Get directions" />\n</form>',
    java: 'public void move(int n, int from, int to, int via) {\n  if (n == 1) {\n      System.out.println("Move disk from pole " + from + " to pole " + to);\n  } else {\n      move(n - 1, from, via, to);\n      move(1, from, to, via);\n      move(n - 1, via, to, from);\n  }\n}',
    javascript: 'function move(n, a, b, c) {\n  if (n > 0) {\n    move(n - 1, a, c, b);\n    console.log("Move disk from " + a + " to " + c);\n    move(n - 1, b, a, c);\n  }\n}\nmove(4, "A", "B", "C");',
    php: 'function move($n,$from,$to,$via) {\n  if ($n === 1) {\n    print("Move disk from pole $from to pole $to");\n  } else {\n    move($n-1,$from,$via,$to);\n    move(1,$from,$to,$via);\n    move($n-1,$via,$to,$from);\n  }\n}',
    python: 'def hanoi(ndisks, startPeg=1, endPeg=3):\n  if ndisks:\n    hanoi(ndisks - 1, startPeg, 6 - startPeg - endPeg)\n    print "Move disk %d from peg %d to peg %d" % (ndisks, startPeg, endPeg)\n    hanoi(ndisks - 1, 6 - startPeg - endPeg, endPeg)\n\nhanoi(ndisks=4)',
    rust: 'fn move_(n: i32, from: i32, to: i32, via: i32) {\n  if n > 0 {\n      move_(n - 1, from, via, to);\n      println!("Move disk from pole {} to pole {}", from, to);\n      move_(n - 1, via, to, from);\n  }\n}\n \nfn main() {\n  move_(4, 1,2,3);\n}',
    sql: "SELECT *\nFROM   call\nORDER  BY call.employee_id ASC,\n          call.start_time ASC;",
    swift: `func hanoi(n: Int, a: String, b: String, c: String) {
  if n > 0 {
    hanoi(n - 1, a: a, b: c, c: b)
    print("Move disk from \\\\(a) to \\\\(c)")
    hanoi(n - 1, a: b, b: a, c: c)
  }
}
  
hanoi(4, a: "A", b: "B", c: "C")';`
});
class ParamValues {
    static generators = {
        request: {
            path: (req)=>pathname(req.url),
            params: (req, paramName)=>{
                if (paramName) {
                    return req.query(paramName);
                } else {
                    const params = req.query();
                    return isEmpty(params) ? undefined : params;
                }
            },
            payload: async (req, paramName)=>{
                const body = await req.parseBody();
                if (body instanceof ArrayBuffer) {
                    return undefined;
                }
                return paramName ? body[paramName] : body;
            },
            headers: (req, headerName)=>headerName ? req.header(headerName.toLowerCase()) : req.header()
        },
        random: {
            integer: (max = Number.MAX_SAFE_INTEGER)=>Math.floor(Math.random() * (+max + 1)),
            float: (max = 100.0)=>Math.random() * +max,
            boolean: ()=>Math.random() > 0.5,
            choose: (...values)=>values[Math.floor(Math.random() * values.length)] || null,
            hexColor: ()=>`#${Math.floor(Math.random() * 16777215).toString(16)}`,
            email: (provider, suffix)=>randEmail({
                    provider,
                    suffix
                }),
            personFullName: (gender)=>randFullName({
                    gender
                }),
            personFirstName: (gender)=>randFirstName({
                    gender
                }),
            personLastName: ()=>randLastName(),
            username: ()=>randUserName(),
            url: ()=>randUrl(),
            city: ()=>randAddress().city,
            phone: ()=>randPhoneNumber(),
            zipCode: ()=>randZipCode(),
            country: ()=>randCountry(),
            countryCode: ()=>randCountryCode(),
            emoji: ()=>randEmoji(),
            brand: ()=>randBrand(),
            company: ()=>randCompanyName(),
            sport: ()=>randSports(),
            filePath: ()=>randFilePath(),
            ip: ()=>randIp(),
            uuid: ()=>randUuid(),
            department: ()=>randJobArea(),
            jobTitle: ()=>randJobTitle(),
            pastDate: ()=>randPastDate({
                    years: 5
                }).toISOString().substring(0, 10),
            futureDate: ()=>randFutureDate({
                    years: 5
                }).toISOString().substring(0, 10),
            datetime: ()=>randPastDate({
                    years: 5
                }).toISOString(),
            phrase: ()=>randPhrase()
        },
        server: {
            timestamp: ()=>new Date().getTime(),
            isoDatetime: ()=>new Date().toISOString(),
            isoDate: ()=>new Date().toISOString().split('T')[0]
        }
    };
    static async get(paramName, req) {
        const [category, command, ...params] = paramName.split('.');
        const generator = ParamValues.generators[category];
        if (!generator) {
            return undefined;
        }
        const commandFn = generator[command];
        if (!commandFn) {
            return undefined;
        }
        const commandParams = category === 'request' ? [
            req,
            ...params
        ] : params;
        return await commandFn(...commandParams);
    }
}
class RefValue {
    obj;
    key;
    constructor(obj, key){
        this.obj = obj;
        this.key = key;
    }
    get() {
        return this.obj[this.key];
    }
    set(value) {
        this.obj[this.key] = value;
    }
}
class RefValueObject extends RefValue {
    vars;
    pattern;
    direct;
    constructor(obj, key){
        super(obj, key);
        this.pattern = this.get().trim();
        this.vars = this.pattern.match(ALL_PATH_VARIABLE_EXP).map((v)=>v.replace(/[\$\{\}]/g, ''));
        this.direct = this.vars.length === 1 && this.pattern === `\${${this.vars[0]}}`;
    }
}
class RefValueArray extends RefValue {
    static DEFAULT_LENGHT = 2;
    _length;
    async length() {
        if (this._length === undefined) {
            const currentArray = this.get();
            if (currentArray.length === 1) {
                const lengthExp = currentArray[0]['$length$'] || RefValueArray.DEFAULT_LENGHT;
                if (PATH_VARIABLE_EXP.test(lengthExp)) {
                    const expValue = await ParamValues.get(lengthExp.replace(/[\$\{\} ]/g, ''));
                    this._length = Math.max(+(expValue || RefValueArray.DEFAULT_LENGHT), 1);
                } else {
                    this._length = Math.max(+lengthExp || RefValueArray.DEFAULT_LENGHT, 1);
                }
                delete currentArray[0]['$length$'];
            } else {
                this._length = currentArray.length;
            }
        }
        return this._length;
    }
    internalRefs;
    constructor(obj, key, internalRefs = []){
        super(obj, key);
        this.internalRefs = internalRefs;
    }
}
const PATH_VARIABLE_EXP = /\$\{[\w\.\-]+\}/;
const ALL_PATH_VARIABLE_EXP = new RegExp(PATH_VARIABLE_EXP.source, 'g');
class ResponseGenerator {
    config;
    apiPrefix;
    matchedPath;
    pathVars = {};
    constructor(config, apiPrefix){
        this.preparePathMatchers(config);
        this.config = config;
        this.apiPrefix = apiPrefix;
    }
    preparePathMatchers(conf) {
        if (!conf._rePath) {
            const allPathMatchers = {};
            const routes = conf.routes || {};
            Object.keys(routes).forEach((method)=>{
                const routeConfig = routes[method];
                const paths = Object.keys(routeConfig);
                const pathMatchers = [];
                let pathContainsWildcard = false;
                paths.forEach((path)=>{
                    if (!path.startsWith('/') && path !== '*') {
                        const pathConfig = routeConfig[path];
                        path = '/' + path;
                        routeConfig[path] = pathConfig;
                        delete routeConfig[path.substring(1)];
                    }
                    if (PATH_VARIABLE_EXP.test(path)) {
                        const vars = path.match(ALL_PATH_VARIABLE_EXP).map((v)=>v.replace(/[\$\{\}]/g, ''));
                        const re = new RegExp("^" + path.replace(ALL_PATH_VARIABLE_EXP, '([^/]+)') + "$");
                        pathMatchers.push({
                            re,
                            vars,
                            path
                        });
                    } else {
                        if (path === '*') {
                            pathContainsWildcard = true;
                        } else {
                            pathMatchers.push({
                                path
                            });
                        }
                    }
                });
                if (pathContainsWildcard) {
                    pathMatchers.push({
                        path: '*'
                    });
                }
                allPathMatchers[method] = pathMatchers;
            });
            conf._rePath = allPathMatchers;
        }
    }
    async findMatchPath(request) {
        if (request.query('_clonePayload')) {
            return await request.parseBody();
        }
        let methodRouteConfig;
        const method = request.method.toLowerCase();
        if (this.config.routes) {
            methodRouteConfig = this.config.routes[method] || this.config.routes['*'];
        }
        if (!methodRouteConfig) {
            return this.config.defaultResponse || {};
        }
        const path = pathname(request.url).substring(this.apiPrefix.length);
        const pathMatchers = this.config._rePath[method] || this.config._rePath['*'];
        const matchedPath = pathMatchers.find((m)=>m.re?.test(path) || m.path === path || m.path === '*');
        if (!matchedPath) {
            return this.config.defaultResponse || {};
        } else {
            this.matchedPath = matchedPath.path;
            this.pathVars = matchedPath.re?.exec(path).slice(1).reduce((acc, v, i)=>{
                acc[matchedPath.vars[i]] = v;
                return acc;
            }, {}) || {};
            return methodRouteConfig[matchedPath.path];
        }
    }
    findGeneratedValue(obj, key, value) {
        if (typeof value === 'object') {
            return [
                ...this.findAllGeneratedValues(value)
            ];
        } else if (typeof value === 'string' && PATH_VARIABLE_EXP.test(value)) {
            return [
                new RefValueObject(obj, key)
            ];
        }
        return [];
    }
    findAllGeneratedValues(obj) {
        const values = [];
        for(const key in obj){
            const value = obj[key];
            if (Array.isArray(value)) {
                const insideRefs = [];
                if (value.length > 1) {
                    for (const item of value){
                        insideRefs.push(...this.findGeneratedValue(obj, key, item));
                    }
                }
                values.push(new RefValueArray(obj, key, insideRefs));
            } else {
                values.push(...this.findGeneratedValue(obj, key, value));
            }
        }
        return values;
    }
    async generateValueObj(request, rvo) {
        if (rvo.direct) {
            const uniqueVar = rvo.vars[0];
            rvo.set(this.pathVars[uniqueVar] || await ParamValues.get(uniqueVar, request));
        } else {
            let value = rvo.pattern;
            for (const v of rvo.vars){
                const genVal = '' + (this.pathVars[v] || await ParamValues.get(v, request) || '');
                value = value.replace(`\${${v}}`, genVal);
            }
            rvo.set(value);
        }
    }
    async generateValueArray(request, rva) {
        const currentArray = rva.get();
        const setRefValues = async (refs)=>{
            for (const ref of refs.filter((ref)=>ref instanceof RefValueObject)){
                await this.generateValueObj(request, ref);
            }
            for (const ref1 of refs.filter((ref)=>ref instanceof RefValueArray)){
                await this.generateValueArray(request, ref1);
            }
        };
        if (currentArray.length > 1) {
            await setRefValues(rva.internalRefs);
        } else {
            const arrayValues = [];
            for(let i = 0; i < await rva.length(); i++){
                if (typeof currentArray[0] === 'object') {
                    const rawObj = deepCopy(currentArray[0]);
                    const arrayInternalRefs = this.findAllGeneratedValues(rawObj);
                    await setRefValues(arrayInternalRefs);
                    arrayValues.push(rawObj);
                } else {
                    if (PATH_VARIABLE_EXP.test(currentArray[0])) {
                        const aux = {
                            value: currentArray[0]
                        };
                        await setRefValues([
                            new RefValueObject(aux, 'value')
                        ]);
                        arrayValues.push(aux.value);
                    } else {
                        arrayValues.push(currentArray[0]);
                    }
                }
            }
            rva.set(arrayValues);
        }
    }
    async generate(request) {
        const responseTemplate = deepCopy(await this.findMatchPath(request));
        if (Array.isArray(responseTemplate)) {
            let refValues = [];
            if (responseTemplate.length > 1) {
                refValues = responseTemplate.map((v)=>this.findAllGeneratedValues(v)).reduce((accu, value)=>accu.concat(value), []);
            }
            const aux = {
                value: responseTemplate
            };
            const refMainArray = new RefValueArray(aux, 'value', refValues);
            await this.generateValueArray(request, refMainArray);
            return aux.value;
        } else {
            const refValues1 = this.findAllGeneratedValues(responseTemplate);
            for (const rv of refValues1.filter((rv)=>rv instanceof RefValueObject)){
                await await this.generateValueObj(request, rv);
            }
            for (const rv1 of refValues1.filter((rv)=>rv instanceof RefValueArray)){
                await await this.generateValueArray(request, rv1);
            }
            return responseTemplate;
        }
    }
    async generateError(request, errorMessage, httpStatus) {
        if (!errorMessage) {
            errorMessage = "Error in request to path: ${request.path}";
        }
        let errorTemplate = this.config.errorResponse || {
            success: false
        };
        const errorTemplateJson = JSON.stringify(errorTemplate);
        errorTemplate = JSON.parse(errorTemplateJson.replace(/\${error}/g, errorMessage));
        const refValues = this.findAllGeneratedValues(errorTemplate);
        for (const rv of refValues.filter((rv)=>rv instanceof RefValueObject)){
            await await this.generateValueObj(request, rv);
        }
        httpStatus = httpStatus || +errorTemplate.$httpStatus$ || 500;
        if (httpStatus < 200 || httpStatus >= 600) {
            httpStatus = 500;
        }
        delete errorTemplate.$httpStatus$;
        return {
            payload: errorTemplate,
            httpStatus: httpStatus
        };
    }
}
extendRequest();
const sleep = (ms)=>new Promise((resolve)=>setTimeout(resolve, ms));
class MockServer {
    server;
    version;
    host;
    port;
    apiPrefix;
    verbose;
    silent;
    responseConfig;
    abortController = new AbortController();
    usemicros = false;
    constructor({ host , port , apiPrefix , verbose , silent , responseConfig , version  } = {}){
        this.apiPrefix = apiPrefix || Deno.env.get('MOCKR_PREFIX') || '';
        if (!this.apiPrefix.startsWith("/") && !!this.apiPrefix) {
            this.apiPrefix = "/" + this.apiPrefix;
        }
        this.version = version || 'unknown';
        this.host = host || Deno.env.get('assertEquals(localMockServer.apiPrefix, "/test");BINDING') || '0.0.0.0';
        this.port = port || +(Deno.env.get('MOCKR_PORT') || 3003);
        this.silent = !!silent;
        this.verbose = !this.silent && !!verbose;
        this.responseConfig = responseConfig || {};
        this.server = this.create();
        this.printConfig(this.responseConfig);
    }
    json2(c, obj, httpStatus = 200) {
        const prettySpaces = c.get('prettySpaces');
        const rawJson = JSON.stringify(obj, null, prettySpaces);
        c.res.headers.set('content-type', 'application/json; charset=UTF-8');
        return c.body(new TextEncoder().encode(rawJson), httpStatus);
    }
    txt2(c, text, httpStatus = 200) {
        c.res.headers.set('content-type', 'text/plain; charset=UTF-8');
        return c.body(new TextEncoder().encode(text), httpStatus);
    }
    async checkHRTime() {
        this.usemicros = (await Deno.permissions.query({
            name: "hrtime"
        })).state === "granted";
    }
    create() {
        this.server = this._createHonoServer();
        return this.server;
    }
    async start() {
        await this.checkHRTime();
        const listeningTxt = ()=>this.log(`[🟢 api-mockr v${this.version}] Server running at: http://${this.host}:${this.port}${this.apiPrefix}`);
        this.abortController = new AbortController();
        this.abortController.signal.addEventListener('abort', ()=>{
            this.log("❌ ➡️ Server stopped!");
            this.log(`⏱️ ➡️ Server was running for: ${(performance.now() / 1000).toFixed(1)}s`);
        });
        return serve(this.server.fetch, {
            port: this.port,
            hostname: this.host,
            signal: this.abortController.signal,
            onListen: listeningTxt
        });
    }
    stop() {
        this.abortController.abort();
    }
    printConfig(config) {
        this.log('verbose', "[INFO] API Mockr is using the following configuration:");
        this.log('verbose', JSON.stringify(config, null, 2) + "\n");
    }
    _createHonoServer() {
        const srv = new Hono();
        srv.use('*', async (c, next)=>{
            const start = performance.now();
            await next();
            const elapsed = performance.now() - start;
            const elapsedTxt = this.usemicros ? `${(elapsed * 1000).toFixed(0)} us` : `${elapsed.toFixed(2)} ms`;
            c.res.headers.set(RESPONSE_TIME_HEADER, elapsedTxt);
        });
        srv.use('*', cors());
        srv.use('*', async (c, next)=>{
            const pretty = !!(c.req.query(PRETTY_PARAM) || c.req.query(PRETTY_PARAM) === '');
            if (pretty) {
                c.pretty(pretty, 2);
                c.set('prettySpaces', 2);
            }
            await next();
        });
        const logRequest = async (req)=>{
            let logReq = `[DEBUG] [➡️] ${req.method.toUpperCase()} ${pathname(req.url)}`;
            if (!isEmpty(req.query())) {
                logReq += ` [params: ${JSON.stringify(req.query())}]`;
            }
            const body = await req.parseBody();
            if (!isEmpty(body)) {
                logReq += ` [payload: ${JSON.stringify(body)}]`;
            }
            this.log('verbose', logReq);
        };
        srv.use('*', async (c, next)=>{
            if (this.verbose) {
                logRequest(c.req);
            }
            await next();
            const { req , res  } = c;
            this.log(`[INFO] [➡️] ${req.method.toUpperCase()} ${pathname(req.url)} [↩️ ${res.status >= 400 ? '⭕' : '✅'}] (status: ${res.status}, content-type: ${res.headers.get('content-type')})`);
        });
        srv.use('*', async (c, next)=>{
            const delay = +c.req.query(DELAY_PARAM);
            if (delay) {
                await sleep(delay);
            }
            await next();
        });
        srv.use('*', async (c, next)=>{
            const { req  } = c;
            const forceError = !!req.query(FORCE_ERROR_PARAM);
            const errorCode = +req.header(FORCE_ERROR_HEADER);
            if (!!errorCode || forceError) {
                const errorMsg = req.header(FORCE_ERROR_MSG_HEADER);
                const responseGenerator = new ResponseGenerator(this.responseConfig, this.apiPrefix);
                const errorResponse = await responseGenerator.generateError(req, errorMsg, errorCode);
                return c.json(errorResponse.payload, errorResponse.httpStatus);
            }
            await next();
        });
        srv.notFound((c)=>{
            return c.text(`Missing route, try: ${this.apiPrefix}/<anything>`, 404);
        });
        srv.use(`${this.apiPrefix}/*`, async (c, next)=>{
            if (pathname(c.req.url) !== '/') {
                const responseGenerator = new ResponseGenerator(this.responseConfig, this.apiPrefix);
                return c.json(await responseGenerator.generate(c.req));
            } else {
                await next();
            }
        });
        srv.get('/', (c)=>c.text(`${PING_MSG} (v${this.version})`));
        return srv;
    }
    log(...args) {
        let tag;
        let msgs;
        if ([
            'info',
            'verbose'
        ].includes(args[0])) {
            tag = args[0];
            msgs = args.slice(1);
        } else {
            tag = 'info';
            msgs = args;
        }
        if (!this.silent) {
            if (tag === 'info') {
                console.info(...msgs);
            }
            if (this.verbose && tag === 'verbose') {
                console.info(...msgs);
            }
        }
    }
}
const importMeta = {
    url: "file:///home/rob/git/OSS/MOCK_SERVER/api-mocker/src/index.ts",
    main: import.meta.main
};
const VERSION1 = await getVersion();
const run = async ()=>{
    const params = await getParams();
    const mockServer = new MockServer({
        ...params,
        version: await getVersion()
    });
    const exitApp = ()=>{
        mockServer.stop();
        Deno.exit();
    };
    Deno.addSignalListener("SIGINT", exitApp);
    await mockServer.start();
};
if (importMeta.main) {
    run();
}
export { VERSION1 as VERSION };
export { run as run };
