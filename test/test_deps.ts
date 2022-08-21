export * from "../src/deps/deno.ts";
export * from "../src/deps/hono.ts";

//export  {type PermissionDescriptor, PermissionStatus } from Deno.PermissionStatus;



export {
    assertSpyCalls,
    assertSpyCall,
    assertSpyCallArgs,
    assertSpyCallArg,
    spy,
    stub,
    restore
  } from "https://deno.land/std@0.152.0/testing/mock.ts";

export { 
    assertEquals,
    assertExists,    
    assertThrows,
    assertInstanceOf,
    assertObjectMatch,
    assertIsError,
    assertStringIncludes,
    assertStrictEquals,    
    assertArrayIncludes,
    assertMatch, 
    assertNotEquals,
    assertFalse,
    assert,
    fail
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

export {
    afterAll,
    beforeAll,
    afterEach,
    beforeEach,
    describe,
    it,
  } from "https://deno.land/std@0.152.0/testing/bdd.ts";


export { extendRequestPrototype } from 'https://deno.land/x/hono@v2.0.9/request.ts';

// deno-lint-ignore no-explicit-any
export const toAny = (o: unknown) : any => o as any;
