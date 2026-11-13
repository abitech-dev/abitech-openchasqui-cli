import { readFile } from "node:fs/promises";
import { parseDocument } from "@abitechdev/openchasqui-core";
import { DEPARTMENT_CAPITALS, isValidRuc } from "@abitechdev/openchasqui-data-es-pe";
import { openApiLoader } from "@abitechdev/openchasqui-loader-openapi";
import type { ApiModel, Operation } from "@abitechdev/openchasqui-spec";
import { describe, expect, it } from "vitest";
import { examplesGenerator } from "../src/index.js";

const reader = { readText: async () => "" };

async function petstore(data = "generic"): Promise<ApiModel> {
  const text = await readFile(new URL("../../../fixtures/petstore.yaml", import.meta.url), "utf8");
  const model = await openApiLoader.load(parseDocument(text), { reader, options: {} });
  return examplesGenerator.generate(model, { reader, options: { data } });
}

function op(model: ApiModel, id: string): Operation {
  return model.operations.find((candidate) => candidate.id === id) as Operation;
}

const customer = {
  openapi: "3.1.0",
  info: { title: "Customers", version: "1" },
  paths: {
    "/customers": {
      post: {
        operationId: "createCustomer",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nombre: { type: "string" },
                  apellido: { type: "string" },
                  correo: { type: "string" },
                  dni: { type: "string" },
                  ruc: { type: "string" },
                  telefono: { type: "string" },
                  ubigeo: { type: "string" },
                  departamento: { type: "string" },
                  distrito: { type: "string" },
                  codigo: { type: "string", maxLength: 3 },
                },
              },
            },
          },
        },
        responses: {},
      },
    },
  },
};

describe("examplesGenerator", () => {
  it("keeps the examples the contract already declares", async () => {
    const model = await petstore();
    expect(op(model, "listPets").parameters[0]?.example).toBe(20);
    expect(op(model, "createPet").requestBody?.content[0]?.example).toEqual({
      name: "Fido",
      species: "dog",
    });
  });

  it("fills missing parameters with a value of their type or the first enum value", async () => {
    const model = await petstore();
    expect(op(model, "showPet").parameters.map((p) => p.example)).toEqual([1, "string"]);
    expect(op(model, "listPets").parameters[1]?.example).toBe("dog");
  });

  it("builds Peruvian data that keeps one person and place per object", async () => {
    const loaded = await openApiLoader.load(customer, { reader, options: {} });
    const model = await examplesGenerator.generate(loaded, { reader, options: { data: "es-pe" } });
    const body = op(model, "createCustomer").requestBody?.content[0]?.example as Record<
      string,
      string
    >;

    expect(body.dni).toMatch(/^[1-9]\d{7}$/);
    expect(isValidRuc(body.ruc ?? "")).toBe(true);
    expect(body.telefono).toMatch(/^9\d{8}$/);
    expect(DEPARTMENT_CAPITALS).toContainEqual({
      code: body.ubigeo,
      department: body.departamento,
      district: body.distrito,
    });
    expect(body.correo?.endsWith("@example.com")).toBe(true);
    expect(
      body.correo?.startsWith(
        body.nombre
          ?.normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase() ?? "?",
      ),
    ).toBe(true);
    expect(body.codigo?.length).toBeLessThanOrEqual(3);
  });

  it("produces the same examples on every run", async () => {
    expect(await petstore("es-pe")).toEqual(await petstore("es-pe"));
  });

  it("stops at recursive schemas instead of looping", async () => {
    const loaded = await petstore();
    const recursive: ApiModel = {
      ...loaded,
      operations: loaded.operations.map((operation) =>
        operation.id === "createPet"
          ? {
              ...operation,
              requestBody: {
                required: true,
                content: [
                  { mediaType: "application/json", schema: { $ref: "#/components/schemas/Pet" } },
                ],
              },
            }
          : operation,
      ),
    };

    const model = await examplesGenerator.generate(recursive, { reader, options: {} });
    const pet = op(model, "createPet").requestBody?.content[0]?.example as any;
    expect(pet).toMatchObject({ name: "Jane", species: "dog", id: 1 });
    expect(pet.owner.pets).toEqual([]);
  });
});
