import { join } from "./test_deps.ts";

export * from "../src/deps/deno.ts";
export * from "../src/deps/hono.ts";

export const mockMainModule = () => {
  let mainPath = Deno.mainModule;
  if (mainPath.includes('/test')) {
      mainPath = join(mainPath.substring(0, mainPath.indexOf('/test')), 'src', 'index.ts');
  }
  Object.defineProperty(Deno, 'mainModule', { value: mainPath });
}
