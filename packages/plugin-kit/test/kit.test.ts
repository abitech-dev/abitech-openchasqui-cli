import { type ApiModel, MODEL_VERSION } from "@abitech/openchasqui-spec";
import { describe, expect, it } from "vitest";
import { fileName, flattenAllOf, inlineSchema, resolveSchema, slugify } from "../src/index.js";

const model: ApiModel = {
  modelVersion: MODEL_VERSION,
  info: { title: "Test", version: "1" },
  servers: [],
  securitySchemes: {},
  operations: [],
  schemas: {
    Alias: { $ref: "#/components/schemas/Pet" },
    Pet: {
      allOf: [
        { $ref: "#/components/schemas/Named" },
        {
          type: "object",
          required: ["id"],
          properties: { owner: { $ref: "#/components/schemas/Owner" } },
        },
      ],
    },
    Named: { type: "object", required: ["name"], properties: { name: { type: "string" } } },
    Owner: {
      type: "object",
      properties: { pets: { type: "array", items: { $ref: "#/components/schemas/Pet" } } },
    },
  },
};

describe("resolveSchema", () => {
  it("follows a chain of references", () => {
    expect(resolveSchema(model, { $ref: "#/components/schemas/Alias" })).toBe(model.schemas.Pet);
  });

  it("returns an empty schema for a missing one", () => {
    expect(resolveSchema(model, undefined)).toEqual({});
  });
});

describe("inlineSchema", () => {
  it("inlines references and cuts a recursive one to an open schema", () => {
    const inlined = inlineSchema(model, { $ref: "#/components/schemas/Owner" }) as any;

    expect(inlined.properties.pets.items.allOf[0]).toEqual(model.schemas.Named);
    expect(inlined.properties.pets.items.allOf[1].properties.owner).toEqual({});
    expect(JSON.stringify(inlined)).not.toContain("$ref");
  });
});

describe("flattenAllOf", () => {
  it("merges the parts into one object with their required fields", () => {
    expect(flattenAllOf(model, { $ref: "#/components/schemas/Pet" })).toEqual({
      type: "object",
      properties: { name: { type: "string" }, owner: { $ref: "#/components/schemas/Owner" } },
      required: ["name", "id"],
    });
  });
});

describe("naming", () => {
  it("makes slugs from any title", () => {
    expect(slugify("Good Money – Catálogos")).toBe("good-money-catalogos");
    expect(slugify("¡¡¡")).toBe("api");
  });

  it("keeps readable file names without forbidden characters", () => {
    expect(fileName("Listar bancos")).toBe("Listar bancos");
    expect(fileName("GET /health")).toBe("GET -health");
    expect(fileName('Ver "perfil": uno.')).toBe("Ver -perfil-- uno");
  });
});
