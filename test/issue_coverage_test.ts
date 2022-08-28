import { describe, it } from "https://deno.land/std@0.152.0/testing/bdd.ts";
import { assertEquals } from "https://deno.land/std@0.85.0/testing/asserts.ts";
import { x2 } from "../src/issue_coverage.ts";

describe('Testing coverage config', () => {

    it('checks issue', () => {
      const num = x2(5);
      assertEquals(num, 10);
    });

});