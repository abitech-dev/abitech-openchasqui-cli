import type { ApiModel, JsonSchema } from "@abitech/openchasqui-spec";

const LOCAL_SCHEMA = "#/components/schemas/";
const MAX_DEPTH = 20;

/** Follows `$ref` chains to the schema they point to. */
export function resolveSchema(model: ApiModel, schema: JsonSchema | undefined): JsonSchema {
  let current = schema;
  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    const ref = current?.$ref;
    if (typeof ref !== "string" || !ref.startsWith(LOCAL_SCHEMA)) {
      break;
    }
    current = model.schemas[ref.slice(LOCAL_SCHEMA.length)];
  }
  return current ?? {};
}

/**
 * Returns a self-contained copy with every local `$ref` inlined. A schema
 * that refers to itself again is cut to `{}`, which accepts any value.
 */
export function inlineSchema(model: ApiModel, schema: JsonSchema | undefined): JsonSchema {
  return inline(model, schema ?? {}, new Set());
}

function inline(model: ApiModel, value: unknown, visiting: ReadonlySet<string>): JsonSchema {
  if (Array.isArray(value)) {
    return value.map((item) => inline(model, item, visiting)) as unknown as JsonSchema;
  }
  if (value === null || typeof value !== "object") {
    return value as JsonSchema;
  }
  const node = value as Record<string, unknown>;
  const ref = node.$ref;
  if (typeof ref === "string" && ref.startsWith(LOCAL_SCHEMA)) {
    const name = ref.slice(LOCAL_SCHEMA.length);
    if (visiting.has(name)) {
      return {};
    }
    return inline(model, model.schemas[name] ?? {}, new Set([...visiting, name]));
  }
  return Object.fromEntries(
    Object.entries(node).map(([key, child]) => [key, inline(model, child, visiting)]),
  );
}

/** Merges an `allOf` into one object schema, as most tools expect. */
export function flattenAllOf(model: ApiModel, schema: JsonSchema | undefined): JsonSchema {
  const resolved = resolveSchema(model, schema);
  const parts = resolved.allOf;
  if (!Array.isArray(parts)) {
    return resolved;
  }
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const part of parts) {
    const flat = flattenAllOf(model, part as JsonSchema);
    Object.assign(properties, flat.properties ?? {});
    required.push(...((flat.required as string[] | undefined) ?? []));
  }
  return { type: "object", properties, required: [...new Set(required)] };
}
