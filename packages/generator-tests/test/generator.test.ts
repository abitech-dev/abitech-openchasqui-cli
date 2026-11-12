import { readFile } from "node:fs/promises";
import { parseDocument } from "@abitech/openchasqui-core";
import { openApiLoader } from "@abitech/openchasqui-loader-openapi";
import type { ApiModel, Operation } from "@abitech/openchasqui-spec";
import { describe, expect, it } from "vitest";
import { forValidators, testsGenerator } from "../src/index.js";

const reader = { readText: async () => "" };

async function petstore(options: Record<string, unknown> = {}): Promise<ApiModel> {
  const text = await readFile(new URL("../../../fixtures/petstore.yaml", import.meta.url), "utf8");
  const model = await openApiLoader.load(parseDocument(text), { reader, options: {} });
  return testsGenerator.generate(model, { reader, options });
}

function op(model: ApiModel, id: string): Operation {
  return model.operations.find((candidate) => candidate.id === id) as Operation;
}

describe("testsGenerator", () => {
  it("checks status, JSON content, the schema and the response time", async () => {
    const tests = op(await petstore(), "listPets").tests;

    expect(tests.map((test) => test.kind)).toEqual([
      "status",
      "contentType",
      "jsonSchema",
      "responseTime",
    ]);
    expect(tests[0]).toEqual({ kind: "status", expected: [200] });
    expect(tests[3]).toEqual({ kind: "responseTime", maxMilliseconds: 5000 });
  });

  it("inlines the response schema so the test is self-contained", async () => {
    const schema = op(await petstore(), "listPets").tests[2] as { schema: unknown };

    expect(JSON.stringify(schema)).not.toContain("$ref");
  });

  it("only checks the status when the response has no JSON body", async () => {
    expect(op(await petstore(), "DELETE /pets/{petId}").tests.map((test) => test.kind)).toEqual([
      "status",
      "responseTime",
    ]);
  });

  it("takes the response time limit from the configuration", async () => {
    const tests = op(await petstore({ responseTimeMs: 800 }), "GET /health").tests;

    expect(tests.at(-1)).toEqual({ kind: "responseTime", maxMilliseconds: 800 });
  });

  it("keeps tests that an earlier plugin already defined", async () => {
    const text = await readFile(
      new URL("../../../fixtures/petstore.yaml", import.meta.url),
      "utf8",
    );
    const loaded = await openApiLoader.load(parseDocument(text), { reader, options: {} });
    const custom: ApiModel = {
      ...loaded,
      operations: loaded.operations.map((operation) => ({
        ...operation,
        tests: [{ kind: "status", expected: [418] }],
      })),
    };

    const model = await testsGenerator.generate(custom, { reader, options: {} });

    expect(op(model, "listPets").tests).toEqual([{ kind: "status", expected: [418] }]);
  });
});

describe("forValidators", () => {
  it("turns nullable into a null type and drops OpenAPI-only keywords", () => {
    expect(
      forValidators({
        type: "object",
        properties: {
          format: { type: "string", format: "date", nullable: true, example: "2026-01-01" },
          "x-internal": { type: "integer" },
        },
        "x-tag": "ignored",
      }),
    ).toEqual({
      type: "object",
      properties: {
        format: { type: ["string", "null"] },
        "x-internal": { type: "integer" },
      },
    });
  });
});
