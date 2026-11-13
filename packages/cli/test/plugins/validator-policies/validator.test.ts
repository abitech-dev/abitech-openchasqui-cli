import { type ApiModel, MODEL_VERSION, type Operation } from "@abitechdev/openchasqui-plugin-kit";
import { describe, expect, it } from "vitest";
import { policiesValidator } from "../../../src/plugins/validator-policies/index.js";

const context = { reader: { readText: async () => "" }, options: {} };

function operation(overrides: Partial<Operation>): Operation {
  return {
    id: "op",
    method: "GET",
    path: "/things",
    name: "Things",
    folder: ["things"],
    order: 1,
    deprecated: false,
    parameters: [],
    responses: [{ status: "200", content: [] }],
    security: ["bearer"],
    tests: [],
    extensions: {},
    ...overrides,
  };
}

function model(...operations: Operation[]): ApiModel {
  return {
    modelVersion: MODEL_VERSION,
    info: { title: "T", version: "1" },
    servers: [],
    securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
    operations,
    schemas: {},
  };
}

async function rules(op: Operation): Promise<string[]> {
  return (await policiesValidator.validate(model(op), context)).map(
    (f) => `${f.severity} ${f.rule}`,
  );
}

describe("policiesValidator", () => {
  it("accepts a clean, authenticated operation", async () => {
    expect(await rules(operation({}))).toEqual([]);
  });

  it("rejects an example that carries a token", async () => {
    const leaked = operation({
      parameters: [
        {
          name: "Authorization",
          in: "header",
          required: true,
          example: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature",
        },
      ],
    });

    expect(await rules(leaked)).toEqual(["error no-secrets-in-examples"]);
  });

  it("warns about emails outside the domains reserved for examples", async () => {
    const real = operation({
      requestBody: {
        required: true,
        content: [
          { mediaType: "application/json", example: { a: "ana@gmail.com", b: "jane@example.com" } },
        ],
      },
    });

    expect(await rules(real)).toEqual(["warning reserved-email-domains"]);
  });

  it("warns when no success response is documented", async () => {
    expect(await rules(operation({ responses: [{ status: "400", content: [] }] }))).toEqual([
      "warning success-response",
    ]);
  });

  it("warns about writes without authentication in an API that has it", async () => {
    expect(await rules(operation({ method: "DELETE", security: [] }))).toEqual([
      "warning public-write",
    ]);
    expect(await rules(operation({ method: "GET", security: [] }))).toEqual([]);
  });
});
