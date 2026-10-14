// Lets node:test import the Next route handlers directly: resolves the `@/` alias and
// extensionless TypeScript imports, and swaps `next/cache` for a pass-through so handlers
// run outside the Next runtime. Types are stripped by Node (--experimental-strip-types).
import { register } from "node:module";

register("./hooks.mjs", import.meta.url);
