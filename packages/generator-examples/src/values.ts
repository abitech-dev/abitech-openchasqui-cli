import {
  createRandom,
  dni,
  mobilePhone,
  type Person,
  person,
  type Random,
  ruc,
  ubigeo,
} from "@abitech/openchasqui-data-es-pe";
import { flattenAllOf, resolveSchema } from "@abitech/openchasqui-plugin-kit";
import type { ApiModel, JsonSchema } from "@abitech/openchasqui-spec";

export type DataSet = "generic" | "es-pe";

const MAX_DEPTH = 4;
const GENERIC_PERSON: Person = {
  firstName: "Jane",
  paternalSurname: "Doe",
  maternalSurname: "Roe",
  fullName: "Jane Doe",
  email: "jane.doe@example.com",
};

/** Builds example values for one operation, seeded by that operation. */
export class ExampleBuilder {
  private readonly random: Random;
  private person: Person | undefined;

  constructor(
    private readonly model: ApiModel,
    private readonly data: DataSet,
    seed: string,
  ) {
    this.random = createRandom(seed);
  }

  value(name: string, schema: JsonSchema | undefined): unknown {
    return this.build(name, schema, 0, new Set());
  }

  private build(
    name: string,
    raw: JsonSchema | undefined,
    depth: number,
    seen: Set<string>,
  ): unknown {
    const ref = typeof raw?.$ref === "string" ? raw.$ref : undefined;
    if (ref && seen.has(ref)) {
      return undefined;
    }
    const visiting = ref ? new Set([...seen, ref]) : seen;
    const schema = flattenAllOf(this.model, resolveSchema(this.model, raw));
    const declared =
      schema.example ?? schema.default ?? firstOf(schema.enum) ?? firstOf(schema.examples);
    if (declared !== undefined) {
      return declared;
    }
    const variant = firstOf(schema.oneOf) ?? firstOf(schema.anyOf);
    if (variant !== undefined) {
      return this.build(name, variant as JsonSchema, depth, visiting);
    }

    switch (typeOf(schema)) {
      case "object":
        return depth >= MAX_DEPTH ? {} : this.object(schema, depth, visiting);
      case "array":
        return depth >= MAX_DEPTH
          ? []
          : [this.build(name, schema.items as JsonSchema, depth + 1, visiting)].filter(
              (item) => item !== undefined,
            );
      case "integer":
        return integerFor(name, schema);
      case "number":
        return numberFor(name, schema);
      case "boolean":
        return true;
      default:
        return fit(this.text(name, schema), schema);
    }
  }

  private object(schema: JsonSchema, depth: number, seen: Set<string>): Record<string, unknown> {
    const previous = this.person;
    this.person = undefined;
    const properties = (schema.properties as Record<string, JsonSchema> | undefined) ?? {};
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(properties)) {
      const value = this.build(key, child, depth + 1, seen);
      if (value !== undefined) {
        result[key] = value;
      }
    }
    this.person = previous;
    return result;
  }

  private text(name: string, schema: JsonSchema): string {
    const byFormat = FORMATS[String(schema.format)];
    if (byFormat) {
      return byFormat;
    }
    const key = name.toLowerCase().replace(/[^a-z]/g, "");
    const someone = this.currentPerson();
    if (/email|correo/.test(key)) return someone.email;
    if (/password|clave|contrasena/.test(key)) return "Example#2026";
    if (/url|uri|link|enlace|website/.test(key)) return "https://example.com";
    if (this.data === "es-pe") {
      if (/^ruc|ruc$/.test(key)) return ruc(this.random, "company");
      if (/dni|documentnumber|numberdocument|numerodocumento|nrodocumento/.test(key))
        return dni(this.random);
      if (/phone|celular|telefono|movil|mobile/.test(key)) return mobilePhone(this.random);
      if (/ubigeo/.test(key)) return ubigeo(this.random).code;
      if (/departamento|department/.test(key)) return ubigeo(this.random).department;
      if (/distrito|district/.test(key)) return ubigeo(this.random).district;
    }
    if (/razonsocial|businessname|company|empresa/.test(key)) return "Example S.A.C.";
    if (/fullname|nombrecompleto/.test(key)) return someone.fullName;
    if (/lastname|surname|apellido/.test(key)) return someone.paternalSurname;
    if (/name|nombre/.test(key)) return someone.firstName;
    if (/address|direccion/.test(key)) return "Av. Example 123";
    if (/date|fecha/.test(key)) return "2026-01-15";
    return "string";
  }

  private currentPerson(): Person {
    if (this.data !== "es-pe") {
      return GENERIC_PERSON;
    }
    this.person ??= person(this.random);
    return this.person;
  }
}

const FORMATS: Readonly<Record<string, string>> = {
  date: "2026-01-15",
  "date-time": "2026-01-15T10:00:00Z",
  time: "10:00:00",
  email: "jane.doe@example.com",
  uri: "https://example.com",
  url: "https://example.com",
  uuid: "3f0c2b7e-8d1a-4c5e-9f6b-2a7d4e1c9b80",
  ipv4: "192.0.2.10",
  binary: "",
};

function typeOf(schema: JsonSchema): string {
  const type = schema.type;
  if (Array.isArray(type)) {
    return String(type.find((item) => item !== "null") ?? "string");
  }
  if (typeof type === "string") {
    return type;
  }
  return schema.properties ? "object" : schema.items ? "array" : "string";
}

function integerFor(name: string, schema: JsonSchema): number {
  const key = name.toLowerCase();
  const minimum = typeof schema.minimum === "number" ? schema.minimum : undefined;
  if (key.includes("year") || key.includes("anio")) return 2026;
  if (key.includes("month") || key === "mes") return 1;
  if (key.includes("page") || key.includes("pagina")) return Math.max(1, minimum ?? 1);
  return minimum ?? 1;
}

function numberFor(name: string, schema: JsonSchema): number {
  const minimum = typeof schema.minimum === "number" ? schema.minimum : undefined;
  if (/rate|price|precio|cambio|amount|monto|total|importe/i.test(name)) return minimum ?? 100.5;
  return minimum ?? 1.5;
}

function fit(text: string, schema: JsonSchema): string {
  const max = typeof schema.maxLength === "number" ? schema.maxLength : undefined;
  return max !== undefined && text.length > max ? text.slice(0, max) : text;
}

function firstOf(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : undefined;
}
