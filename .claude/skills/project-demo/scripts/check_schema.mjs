// Small JSON Schema checker for the demo spec and the template params (no ajv). Supports exactly the keywords the
// project-demo schemas use: type, enum, properties, required, additionalProperties: false, items, minItems,
// maxItems, minimum, maximum, minLength, pattern, default. Anything else in a schema is ignored, so keep to these.

function typeOf(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

function typeMatches(value, type) {
  const actual = typeOf(value);
  return actual === type || (type === "number" && actual === "integer");
}

function checkScalar(value, schema, at) {
  const errors = [];
  if (schema.type && !typeMatches(value, schema.type)) return [`${at}: expected ${schema.type}, got ${typeOf(value)}`];
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${at}: must be one of ${schema.enum.join(", ")}`);
  if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${at}: must be >= ${schema.minimum}`);
  if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${at}: must be <= ${schema.maximum}`);
  if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${at}: is too short`);
  if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${at}: must match ${schema.pattern}`);
  return errors;
}

function checkObject(value, schema, at) {
  const props = schema.properties || {};
  const errors = (schema.required || []).filter((key) => !(key in value)).map((key) => `${at}.${key}: is required`);
  for (const [key, child] of Object.entries(value)) {
    if (Object.hasOwn(props, key)) errors.push(...checkSchema(child, props[key], `${at}.${key}`));
    else if (schema.additionalProperties === false) errors.push(`${at}.${key}: is not allowed`);
  }
  return errors;
}

function checkArray(value, schema, at) {
  const errors = [];
  if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${at}: needs ${schema.minItems}+`);
  if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${at}: max ${schema.maxItems}`);
  if (schema.items) value.forEach((item, i) => errors.push(...checkSchema(item, schema.items, `${at}[${i}]`)));
  return errors;
}

/** Returns a list of "path: problem" strings; empty means valid. */
export function checkSchema(value, schema, at = "spec") {
  const errors = checkScalar(value, schema, at);
  if (errors.length) return errors;
  if (typeOf(value) === "object") return checkObject(value, schema, at);
  if (typeOf(value) === "array") return checkArray(value, schema, at);
  return [];
}

/** Returns a copy of value with every missing property that has a schema default filled in, at every depth. */
export function applyDefaults(value, schema) {
  if (typeOf(value) === "array" && schema.items) return value.map((item) => applyDefaults(item, schema.items));
  if (typeOf(value) !== "object" || !schema.properties) return value;
  const out = { ...value };
  for (const [key, child] of Object.entries(schema.properties)) {
    if (!(key in out) && child.default !== undefined) out[key] = structuredClone(child.default);
    if (key in out) out[key] = applyDefaults(out[key], child);
  }
  return out;
}
