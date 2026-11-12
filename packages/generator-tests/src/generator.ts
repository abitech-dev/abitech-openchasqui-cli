import { inlineSchema } from "@abitech/openchasqui-plugin-kit";
import type {
  ApiModel,
  Generator,
  JsonSchema,
  Operation,
  TestCase,
} from "@abitech/openchasqui-spec";

const OPENAPI_ONLY = new Set([
  "format",
  "example",
  "discriminator",
  "xml",
  "externalDocs",
  "nullable",
]);

export const testsGenerator: Generator = {
  name: "@abitech/openchasqui-generator-tests",
  kind: "generator",
  apiVersion: 1,
  generate: async (model, context) => {
    const maxMilliseconds = Number(context.options.responseTimeMs ?? 5000);
    return {
      ...model,
      operations: model.operations.map((op) =>
        op.tests.length > 0 ? op : { ...op, tests: testsFor(model, op, maxMilliseconds) },
      ),
    };
  },
};

function testsFor(model: ApiModel, operation: Operation, maxMilliseconds: number): TestCase[] {
  const success = operation.responses.filter((response) => /^2\d\d$/.test(response.status));
  const tests: TestCase[] = [];
  if (success.length > 0) {
    tests.push({
      kind: "status",
      expected: success.map((response) => Number(response.status)).sort(),
    });
  }
  const json = success
    .flatMap((response) => response.content)
    .find((media) => media.mediaType.includes("json"));
  if (json) {
    tests.push({ kind: "contentType", mediaType: "application/json" });
    if (json.schema) {
      tests.push({ kind: "jsonSchema", schema: forValidators(inlineSchema(model, json.schema)) });
    }
  }
  tests.push({ kind: "responseTime", maxMilliseconds });
  return tests;
}

/**
 * Turns an OpenAPI schema into plain JSON Schema for Ajv. `nullable` becomes
 * a `null` type and OpenAPI-only keywords go away, since Ajv rejects them.
 */
export function forValidators(schema: JsonSchema): JsonSchema {
  return clean(schema) as JsonSchema;
}

function clean(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(clean);
  }
  if (value === null || typeof value !== "object") {
    return value;
  }
  const node = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(node)) {
    if (OPENAPI_ONLY.has(key) || key.startsWith("x-")) {
      continue;
    }
    result[key] = key === "properties" ? cleanEach(child) : clean(child);
  }
  if (node.nullable === true && typeof node.type === "string") {
    result.type = [node.type, "null"];
  }
  return result;
}

/** Property names are data, not keywords, so only their schemas are cleaned. */
function cleanEach(properties: unknown): unknown {
  if (properties === null || typeof properties !== "object") {
    return properties;
  }
  return Object.fromEntries(
    Object.entries(properties as Record<string, unknown>).map(([name, schema]) => [
      name,
      clean(schema),
    ]),
  );
}
