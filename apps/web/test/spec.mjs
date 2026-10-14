// Shared OpenAPI helpers for the web tests: the document, an Ajv validator over its
// schemas, and a response checker that records which documented responses were seen.
import Ajv2020Module from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import { buildOpenApi } from "../lib/openapi.ts";

const Ajv2020 = Ajv2020Module.default ?? Ajv2020Module;
const addFormats = addFormatsModule.default ?? addFormatsModule;

/** The URL the committed `docs/openapi.json` is generated with. */
export const DOC_SERVER_URL = "http://localhost:3210";
export const SPEC_ID = "urn:greenwood:openapi";
export const HTTP_METHODS = ["get", "put", "post", "delete", "patch", "head", "options", "trace"];

export function loadSpec() {
  return buildOpenApi(DOC_SERVER_URL);
}

export function makeAjv(spec = loadSpec()) {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(spec, SPEC_ID);
  return ajv;
}

const escape = (s) => s.replace(/~/g, "~0").replace(/\//g, "~1");
export const pointer = (...parts) => `${SPEC_ID}#/${parts.map((p) => escape(String(p))).join("/")}`;

export function validatorAt(ajv, ...parts) {
  const validate = ajv.getSchema(pointer(...parts));
  if (!validate) throw new Error(`No schema at ${parts.join(" ")}`);
  return validate;
}

export function formatErrors(errors) {
  return (errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`).join("; ");
}

/** Every (path, method, status) the document promises. */
export function documentedResponses(spec) {
  const out = [];
  for (const [path, item] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const op = item[method];
      if (!op) continue;
      for (const status of Object.keys(op.responses)) out.push(`${method.toUpperCase()} ${path} ${status}`);
    }
  }
  return out.sort();
}

/**
 * Checks a real handler response against the document: the status must be documented,
 * the media type must match, and the JSON body must validate. Returns the parsed body.
 */
export function createResponseChecker(spec = loadSpec()) {
  const ajv = makeAjv(spec);
  const seen = new Set();
  async function check(method, path, res) {
    const op = spec.paths[path]?.[method.toLowerCase()];
    if (!op) throw new Error(`${method} ${path} is not in the OpenAPI document`);
    const status = String(res.status);
    const documented = op.responses[status];
    if (!documented) throw new Error(`${method} ${path} returned ${status}, which the document does not list`);
    seen.add(`${method.toUpperCase()} ${path} ${status}`);
    const raw = await res.text();
    if (!documented.content) return raw;
    const mediaType = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!documented.content[mediaType]) throw new Error(`${method} ${path} ${status} sent ${mediaType}; documented: ${Object.keys(documented.content).join(", ")}`);
    const body = JSON.parse(raw);
    const validate = validatorAt(ajv, "paths", path, method.toLowerCase(), "responses", status, "content", mediaType, "schema");
    if (!validate(body)) throw new Error(`${method} ${path} ${status} does not match the document: ${formatErrors(validate.errors)}`);
    return body;
  }
  return { check, seen };
}
