import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const WEB_ROOT = new URL("../../", import.meta.url);
const WEB_ROOT_PATH = fileURLToPath(WEB_ROOT);
const NEXT_CACHE_SHIM = new URL("./next-cache.mjs", import.meta.url).href;

function tryTs(baseUrl) {
  const path = fileURLToPath(baseUrl);
  for (const candidate of [path, `${path}.ts`, `${path}.tsx`, `${path}/index.ts`]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return pathToFileURL(candidate).href;
  }
  return null;
}

export async function resolve(specifier, context, next) {
  if (specifier === "next/cache") return { url: NEXT_CACHE_SHIM, shortCircuit: true };
  if (specifier === "next/server") return next("next/server.js", context);
  if (specifier.startsWith("@/")) {
    const url = tryTs(new URL(specifier.slice(2), WEB_ROOT));
    if (url) return { url, shortCircuit: true };
  }
  const parent = context.parentURL ? fileURLToPath(context.parentURL) : "";
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && parent.startsWith(WEB_ROOT_PATH) && !parent.includes("node_modules")) {
    const url = tryTs(new URL(specifier, context.parentURL));
    if (url) return { url, shortCircuit: true };
  }
  return next(specifier, context);
}
