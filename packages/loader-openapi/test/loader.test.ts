import { readFile } from "node:fs/promises";
import { parseDocument } from "@abitech/openchasqui-core";
import type { ApiModel, Operation } from "@abitech/openchasqui-spec";
import { beforeAll, describe, expect, it } from "vitest";
import { openApiLoader } from "../src/index.js";

const context = { reader: { readText: async () => "" }, options: {} };
let model: ApiModel;

function operation(id: string): Operation {
  const found = model.operations.find((candidate) => candidate.id === id);
  if (!found) {
    throw new Error(`Operation ${id} not found`);
  }
  return found;
}

beforeAll(async () => {
  const text = await readFile(new URL("../../../fixtures/petstore.yaml", import.meta.url), "utf8");
  model = await openApiLoader.load(parseDocument(text), context);
});

describe("openApiLoader", () => {
  it("accepts OpenAPI 3.0 and 3.1 and rejects Swagger 2.0", () => {
    expect(openApiLoader.canLoad({ openapi: "3.0.3" })).toBe(true);
    expect(openApiLoader.canLoad({ openapi: "3.1.0" })).toBe(true);
    expect(openApiLoader.canLoad({ swagger: "2.0" })).toBe(false);
  });

  it("reads info, servers and security schemes", () => {
    expect(model.info).toEqual({
      title: "Petstore",
      version: "1.2.0",
      description: "Fixture that covers the cases the loader must handle.",
    });
    expect(model.servers).toEqual([{ url: "https://api.example.com/v1" }]);
    expect(model.securitySchemes).toEqual({
      bearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      apiKey: { type: "apiKey", in: "header", name: "X-API-Key" },
    });
  });

  it("covers every operation of the document", () => {
    expect(model.operations.map((op) => `${op.method} ${op.path}`).sort()).toEqual([
      "DELETE /pets/{petId}",
      "GET /health",
      "GET /pets",
      "GET /pets/{petId}",
      "GET /store/hours",
      "POST /pets",
      "POST /pets/{petId}/photo",
    ]);
  });

  it("uses the operationId as id and the method plus path when it is missing", () => {
    expect(operation("listPets").name).toBe("List pets");
    expect(operation("showPet").name).toBe("showPet");
    expect(operation("DELETE /pets/{petId}").deprecated).toBe(true);
  });

  it("groups by the first tag, or the first path segment without tags, ordered from 1", () => {
    expect(operation("listPets").folder).toEqual(["pets"]);
    expect(operation("GET /health").folder).toEqual(["health"]);
    const pets = model.operations.filter((op) => op.folder[0] === "pets").map((op) => op.order);
    expect(pets).toEqual([1, 2, 3, 4, 5]);
  });

  it("resolves parameter references and lets the operation replace a path parameter", () => {
    expect(operation("listPets").parameters).toEqual([
      {
        name: "limit",
        in: "query",
        required: false,
        schema: { type: "integer", maximum: 100 },
        example: 20,
      },
      {
        name: "species",
        in: "query",
        required: false,
        schema: { type: "string", enum: ["dog", "cat"] },
      },
    ]);
    expect(operation("showPet").parameters.map((p) => `${p.in}:${p.name}:${p.required}`)).toEqual([
      "path:petId:true",
      "header:X-Trace:true",
    ]);
  });

  it("resolves request bodies and responses but keeps schema references", () => {
    const create = operation("createPet");
    expect(create.requestBody).toEqual({
      required: true,
      content: [
        {
          mediaType: "application/json",
          schema: { $ref: "#/components/schemas/NewPet" },
          example: { name: "Fido", species: "dog" },
        },
      ],
    });
    expect(create.responses[0]?.content[0]?.schema).toEqual({ $ref: "#/components/schemas/Pet" });
    expect(Object.keys(model.schemas)).toEqual(["NewPet", "Pet", "Owner"]);
  });

  it("takes the first named example when there is no single example", () => {
    const hours = operation("GET /store/hours");
    expect(hours.responses[0]?.content[0]?.example).toEqual({ open: "09:00", close: "18:00" });
    expect(hours.extensions).toEqual({ "x-cache-seconds": 60 });
  });

  it("applies the global security unless the operation says otherwise", () => {
    expect(operation("listPets").security).toEqual(["bearer"]);
    expect(operation("GET /store/hours").security).toEqual([]);
    expect(operation("DELETE /pets/{petId}").security).toEqual(["apiKey", "bearer"]);
  });

  it("keeps multipart bodies with their file fields", () => {
    const upload = operation("POST /pets/{petId}/photo");
    expect(upload.requestBody?.content[0]?.mediaType).toBe("multipart/form-data");
  });
});

describe("openApiLoader with OpenChasqui extensions", () => {
  const document = {
    openapi: "3.1.0",
    info: { title: "Catalog", version: "1" },
    paths: {
      "/banks": {
        get: {
          summary: "Listar bancos",
          "x-openchasqui-folder": "Catálogos/Bancos",
          "x-openchasqui-order": 2,
        },
        post: {
          summary: "Crear banco",
          "x-openchasqui-folder": "Catálogos/Bancos",
          "x-openchasqui-order": 1,
        },
      },
      "/banks/{id}": {
        get: { summary: "Ver banco", "x-openchasqui-folder": "Catálogos/Bancos" },
      },
    },
  };

  it("uses x-openchasqui-folder as a nested folder path", async () => {
    const loaded = await openApiLoader.load(document, context);
    expect(loaded.operations.map((op) => op.folder)).toEqual([
      ["Catálogos", "Bancos"],
      ["Catálogos", "Bancos"],
      ["Catálogos", "Bancos"],
    ]);
  });

  it("orders by x-openchasqui-order first and puts unordered operations last", async () => {
    const loaded = await openApiLoader.load(document, context);
    expect(loaded.operations.map((op) => `${op.order} ${op.name}`)).toEqual([
      "1 Crear banco",
      "2 Listar bancos",
      "3 Ver banco",
    ]);
  });
});
