import type { ApiModel, Parameter } from "./model.js";
import { resolveSchema } from "./schema.js";

const FORMAT_VALUES: Readonly<Record<string, string>> = {
  date: "2026-01-01",
  "date-time": "2026-01-01T00:00:00Z",
  uuid: "00000000-0000-0000-0000-000000000000",
  email: "user@example.com",
};

/** The scheme most operations use becomes the collection default. */
export function mostUsedScheme(model: ApiModel): string | undefined {
  const counts = new Map<string, number>();
  for (const operation of model.operations) {
    for (const name of operation.security) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
}

/** Without an example, a value of the right type keeps the request valid. */
export function parameterValue(model: ApiModel, parameter: Parameter): string {
  const schema = resolveSchema(model, parameter.schema);
  const enumeration = Array.isArray(schema.enum) ? schema.enum : [];
  const value = parameter.example ?? schema.example ?? schema.default ?? enumeration[0];
  if (value !== undefined) {
    return String(value);
  }
  switch (schema.type) {
    case "integer":
    case "number":
      return "1";
    case "boolean":
      return "true";
    default:
      return FORMAT_VALUES[String(schema.format)] ?? "string";
  }
}
