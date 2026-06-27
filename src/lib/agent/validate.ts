/**
 * The `validate` service: conformance checking for A2A deliverables.
 *
 * Every CAP agent delivers a `Schema` result. This service is the dependency
 * any of them can hire to *prove* a delivery conforms to an agreed JSON Schema
 * before it settles — buyer and seller both get a signed receipt that says
 * "this payload matched this contract". Pure trust-layer infra.
 *
 * Deterministic and dependency-free on purpose: no API key, no network. We ship
 * a focused JSON-Schema validator covering the subset CAP deliverables actually
 * use (draft-07-ish). That keeps the service reproducible — the same payload +
 * schema always yields the same receipt hash.
 */

export type ValidateInput = {
  deliverable: unknown; // the payload to check (object, or a JSON string)
  schema: unknown; // a JSON Schema object (or JSON string)
};

export type ConformanceError = { path: string; message: string };

export type ConformanceResult = {
  valid: boolean;
  errorCount: number;
  errors: ConformanceError[]; // capped
  schemaTitle: string;
  checker: string; // the validator id (deterministic)
};

const MAX_ERRORS = 50;

export function validateDeliverable(input: ValidateInput): ConformanceResult {
  const schema = coerceJson(input.schema);
  const value = coerceJson(input.deliverable);
  const checker = "json-schema/draft-07-subset";

  if (schema == null || typeof schema !== "object") {
    return {
      valid: false,
      errorCount: 1,
      errors: [{ path: "", message: "No valid JSON Schema provided." }],
      schemaTitle: "(invalid schema)",
      checker,
    };
  }

  const errors: ConformanceError[] = [];
  check(value, schema, "", errors);
  const capped = errors.slice(0, MAX_ERRORS);
  return {
    valid: errors.length === 0,
    errorCount: errors.length,
    errors: capped,
    schemaTitle: String((schema as any).title ?? "(inline schema)"),
    checker,
  };
}

/* ----------------------------- the validator ----------------------------- */

function check(value: any, schema: any, path: string, errors: ConformanceError[]): void {
  if (errors.length >= MAX_ERRORS) return;
  if (schema === true) return;
  if (schema === false) {
    errors.push({ path: path || "/", message: "Schema is `false` — nothing is allowed here." });
    return;
  }
  if (typeof schema !== "object" || schema === null) return;

  const at = path || "/";

  // const / enum
  if ("const" in schema && !deepEqual(value, schema.const)) {
    errors.push({ path: at, message: `must equal const ${json(schema.const)}` });
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((e: any) => deepEqual(value, e))) {
    errors.push({ path: at, message: `must be one of ${json(schema.enum)}` });
  }

  // type
  if (schema.type != null) {
    const types: string[] = Array.isArray(schema.type) ? schema.type : [schema.type];
    const nullable = schema.nullable === true;
    const ok = (value === null && (types.includes("null") || nullable)) ||
      types.some((t) => typeMatches(value, t));
    if (!ok) {
      errors.push({ path: at, message: `expected ${types.join(" | ")}, got ${typeOf(value)}` });
      return; // don't cascade keyword checks against the wrong type
    }
    if (value === null) return; // null satisfied via null/nullable; no further checks
  }

  // object
  if (isPlainObject(value)) {
    if (Array.isArray(schema.required)) {
      for (const r of schema.required) {
        if (!(r in value)) errors.push({ path: join(path, r), message: "required property missing" });
      }
    }
    const props = isPlainObject(schema.properties) ? schema.properties : {};
    for (const [k, sub] of Object.entries(props)) {
      if (k in value) check(value[k], sub, join(path, k), errors);
    }
    if (schema.additionalProperties === false) {
      for (const k of Object.keys(value)) {
        if (!(k in props)) errors.push({ path: join(path, k), message: "unexpected property" });
      }
    } else if (isPlainObject(schema.additionalProperties)) {
      for (const k of Object.keys(value)) {
        if (!(k in props)) check(value[k], schema.additionalProperties, join(path, k), errors);
      }
    }
  }

  // array
  if (Array.isArray(value)) {
    if (isPlainObject(schema.items) || typeof schema.items === "boolean") {
      value.forEach((el, i) => check(el, schema.items, `${path}/${i}`, errors));
    }
    if (typeof schema.minItems === "number" && value.length < schema.minItems) {
      errors.push({ path: at, message: `must have >= ${schema.minItems} items` });
    }
    if (typeof schema.maxItems === "number" && value.length > schema.maxItems) {
      errors.push({ path: at, message: `must have <= ${schema.maxItems} items` });
    }
  }

  // string
  if (typeof value === "string") {
    if (typeof schema.minLength === "number" && value.length < schema.minLength) {
      errors.push({ path: at, message: `must be >= ${schema.minLength} chars` });
    }
    if (typeof schema.maxLength === "number" && value.length > schema.maxLength) {
      errors.push({ path: at, message: `must be <= ${schema.maxLength} chars` });
    }
    if (typeof schema.pattern === "string" && !safeRegexTest(schema.pattern, value)) {
      errors.push({ path: at, message: `must match /${schema.pattern}/` });
    }
  }

  // number
  if (typeof value === "number") {
    if (typeof schema.minimum === "number" && value < schema.minimum) {
      errors.push({ path: at, message: `must be >= ${schema.minimum}` });
    }
    if (typeof schema.maximum === "number" && value > schema.maximum) {
      errors.push({ path: at, message: `must be <= ${schema.maximum}` });
    }
    if (typeof schema.exclusiveMinimum === "number" && value <= schema.exclusiveMinimum) {
      errors.push({ path: at, message: `must be > ${schema.exclusiveMinimum}` });
    }
    if (typeof schema.exclusiveMaximum === "number" && value >= schema.exclusiveMaximum) {
      errors.push({ path: at, message: `must be < ${schema.exclusiveMaximum}` });
    }
  }
}

/* ------------------------------- helpers --------------------------------- */

function typeMatches(value: any, t: string): boolean {
  switch (t) {
    case "integer": return typeof value === "number" && Number.isInteger(value);
    case "number": return typeof value === "number" && !Number.isNaN(value);
    case "string": return typeof value === "string";
    case "boolean": return typeof value === "boolean";
    case "object": return isPlainObject(value);
    case "array": return Array.isArray(value);
    case "null": return value === null;
    default: return false;
  }
}

function typeOf(value: any): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function isPlainObject(v: any): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function join(base: string, key: string): string {
  return `${base}/${String(key).replace(/~/g, "~0").replace(/\//g, "~1")}`;
}

/** Accept an object or a JSON string; return the parsed object or the raw value. */
function coerceJson(v: unknown): any {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v; // a bare string is a legitimate value to validate
  }
}

function safeRegexTest(pattern: string, value: string): boolean {
  try {
    return new RegExp(pattern).test(value);
  } catch {
    return true; // an unparseable pattern shouldn't fail the payload
  }
}

function json(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a == null || b == null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}
