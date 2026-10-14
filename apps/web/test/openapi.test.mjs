// The OpenAPI document is valid 3.1, matches the route handlers both ways, carries
// examples that validate, and matches the committed docs/openapi.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Validator } from "@seriousme/openapi-schema-validator";
import { HTTP_METHODS, formatErrors, loadSpec, makeAjv, validatorAt } from "./spec.mjs";

const WEB_ROOT = fileURLToPath(new URL("../", import.meta.url));
const API_ROOT = join(WEB_ROOT, "app", "api", "v1");
const REPO_ROOT = join(WEB_ROOT, "..", "..");

// CORS preflight handlers are transport plumbing, not API operations.
const UNDOCUMENTED_METHODS = new Set(["OPTIONS"]);

async function routeFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await routeFiles(full)));
    else if (/^route\.(ts|tsx|js|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

async function implementedOperations() {
  const ops = new Set();
  for (const file of await routeFiles(API_ROOT)) {
    const dir = relative(API_ROOT, file).split(sep).slice(0, -1);
    const path = "/" + dir.map((seg) => seg.replace(/^\[(.+)\]$/, "{$1}")).join("/");
    const mod = await import(pathToFileURL(file).href);
    for (const name of Object.keys(mod)) {
      if (HTTP_METHODS.includes(name.toLowerCase()) && name === name.toUpperCase() && typeof mod[name] === "function" && !UNDOCUMENTED_METHODS.has(name)) ops.add(`${name} ${path}`);
    }
  }
  return ops;
}

function documentedOperations(spec) {
  const ops = new Set();
  for (const [path, item] of Object.entries(spec.paths)) for (const m of HTTP_METHODS) if (item[m]) ops.add(`${m.toUpperCase()} ${path}`);
  return ops;
}

test("the document is valid OpenAPI 3.1", async () => {
  const spec = loadSpec();
  assert.equal(spec.openapi, "3.1.0");
  const result = await new Validator().validate(structuredClone(spec));
  assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));
});

test("every route handler under /api/v1 is documented, and every documented operation exists", async () => {
  const implemented = await implementedOperations();
  const documented = documentedOperations(loadSpec());
  assert.ok(implemented.size >= 9, "route discovery found the handlers");
  assert.deepEqual([...implemented].filter((op) => !documented.has(op)).sort(), [], "handlers missing from the document");
  assert.deepEqual([...documented].filter((op) => !implemented.has(op)).sort(), [], "documented operations with no handler");
});

test("every $ref resolves and every schema compiles", () => {
  const spec = loadSpec();
  const ajv = makeAjv(spec);
  for (const name of Object.keys(spec.components.schemas)) assert.doesNotThrow(() => validatorAt(ajv, "components", "schemas", name), name);
  const refs = JSON.stringify(spec).match(/"\$ref":"#\/components\/schemas\/[^"]+"/g) ?? [];
  for (const r of refs) {
    const name = r.split("/").pop().replace(/"$/, "");
    assert.ok(spec.components.schemas[name], `dangling ${r}`);
  }
});

test("request and schema examples validate against their schemas", () => {
  const spec = loadSpec();
  const ajv = makeAjv(spec);
  let checked = 0;
  for (const [path, item] of Object.entries(spec.paths)) {
    for (const m of HTTP_METHODS) {
      const op = item[m];
      if (!op) continue;
      const bodies = [["requestBody", op.requestBody?.content ?? {}], ...Object.entries(op.responses).map(([s, r]) => [`responses/${s}`, r.content ?? {}])];
      for (const [where, content] of bodies) {
        for (const [mediaType, media] of Object.entries(content)) {
          if (media.example === undefined) continue;
          const parts = where === "requestBody" ? ["paths", path, m, "requestBody", "content", mediaType, "schema"] : ["paths", path, m, "responses", where.split("/")[1], "content", mediaType, "schema"];
          const validate = validatorAt(ajv, ...parts);
          assert.ok(validate(media.example), `${m.toUpperCase()} ${path} ${where} example: ${formatErrors(validate.errors)}`);
          checked++;
        }
      }
    }
  }
  for (const [name, schema] of Object.entries(spec.components.schemas)) {
    for (const [i, example] of (schema.examples ?? []).entries()) {
      const validate = validatorAt(ajv, "components", "schemas", name);
      assert.ok(validate(example), `${name} example ${i}: ${formatErrors(validate.errors)}`);
      checked++;
    }
  }
  assert.ok(checked >= 2, "the document carries examples");
});

test("schemas reject what the contract forbids", () => {
  const ajv = makeAjv();
  const criterion = validatorAt(ajv, "components", "schemas", "ScreenCriterion");
  const good = { key: "build", label: "Playable build", score: null, weight: 0.3, basis: "Website check unavailable.", estimated: false };
  assert.equal(criterion(good), true);
  assert.equal(criterion({ ...good, basis: "" }), false, "a criterion without a basis is invalid");
  const { basis, ...withoutBasis } = good;
  assert.equal(criterion(withoutBasis), false);
  const report = validatorAt(ajv, "components", "schemas", "EconomyReport");
  assert.equal(report({ reportedAt: "2026-09-06T00:00:00Z", period: "month", source: "x" }), false);
  assert.equal(report({ reportedAt: "yesterday", period: "day", source: "x" }), false);
});

test("docs/openapi.json is the committed output of lib/openapi.ts", async () => {
  const committed = JSON.parse(await readFile(join(REPO_ROOT, "docs", "openapi.json"), "utf8"));
  assert.deepEqual(committed, JSON.parse(JSON.stringify(loadSpec())), "run `pnpm openapi:write` and commit docs/openapi.json");
});
