// Writes or checks docs/openapi.json against the source in apps/web/lib/openapi.ts.
//   node --experimental-strip-types scripts/openapi.mjs --write
//   node --experimental-strip-types scripts/openapi.mjs --check   (fails when the file is stale)
import { readFile, writeFile } from "node:fs/promises";
import { buildOpenApi } from "../apps/web/lib/openapi.ts";

const target = new URL("../docs/openapi.json", import.meta.url);
const expected = `${JSON.stringify(buildOpenApi("http://localhost:3210"), null, 2)}\n`;
const mode = process.argv[2];

if (mode === "--write") {
  await writeFile(target, expected);
  console.log("Wrote docs/openapi.json");
} else if (mode === "--check") {
  const current = await readFile(target, "utf8").catch(() => "");
  if (current.replace(/\r\n/g, "\n") !== expected) {
    console.error("docs/openapi.json is out of date with apps/web/lib/openapi.ts. Run `pnpm openapi:write` and commit the result.");
    process.exit(1);
  }
  console.log("docs/openapi.json matches apps/web/lib/openapi.ts");
} else {
  console.error("Usage: scripts/openapi.mjs --write | --check");
  process.exit(2);
}
