import {
  type ApiModel,
  type Emitter,
  type Generator,
  type Loader,
  MODEL_VERSION,
  type OpenChasquiConfig,
  type Plugin,
  type Transformer,
  type Validator,
} from "@abitechdev/openchasqui-spec";
import { describe, expect, it } from "vitest";
import { OpenChasquiError, run } from "../src/index.js";

const emptyModel: ApiModel = {
  modelVersion: MODEL_VERSION,
  info: { title: "Test", version: "1.0.0" },
  servers: [],
  securitySchemes: {},
  operations: [],
  schemas: {},
};

const config: OpenChasquiConfig = {
  version: 1,
  source: "openapi.yaml",
  targets: ["fake"],
  output: "dist",
  environments: { qa: { variables: { API_URL: "https://qa.example.com" }, secrets: ["TOKEN"] } },
};

const reader = { readText: async () => "openapi: 3.1.0" };

function loader(): Loader {
  return {
    name: "fake-loader",
    kind: "loader",
    apiVersion: 1,
    canLoad: (document) => (document as { openapi?: string }).openapi === "3.1.0",
    load: async () => emptyModel,
  };
}

function emitter(
  files = [
    { path: "b.json", contents: "{}" },
    { path: "a.json", contents: "{}" },
  ],
): Emitter {
  return {
    name: "fake-emitter",
    kind: "emitter",
    apiVersion: 1,
    target: "fake",
    emit: async () => files,
  };
}

async function expectError(promise: Promise<unknown>, code: string): Promise<void> {
  const error = await promise.catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(OpenChasquiError);
  expect((error as OpenChasquiError).code).toBe(code);
}

describe("run", () => {
  it("runs loader, transformers, generators, validators and emitters in that order", async () => {
    const calls: string[] = [];
    const transformer: Transformer = {
      name: "t",
      kind: "transformer",
      apiVersion: 1,
      transform: async (model) => {
        calls.push("transform");
        return { ...model, info: { ...model.info, title: "Transformed" } };
      },
    };
    const generator: Generator = {
      name: "g",
      kind: "generator",
      apiVersion: 1,
      generate: async (model) => {
        calls.push(`generate:${model.info.title}`);
        return model;
      },
    };
    const validator: Validator = {
      name: "v",
      kind: "validator",
      apiVersion: 1,
      validate: async () => {
        calls.push("validate");
        return [{ rule: "demo", severity: "warning", message: "Just a warning." }];
      },
    };
    const plugins: Plugin[] = [emitter(), validator, generator, transformer, loader()];

    const result = await run(config, { reader, plugins });

    expect(calls).toEqual(["transform", "generate:Transformed", "validate"]);
    expect(result.findings).toHaveLength(1);
    expect(result.model.info.title).toBe("Transformed");
  });

  it("sorts emitted files so the same input produces the same output", async () => {
    const result = await run(config, { reader, plugins: [loader(), emitter()] });

    expect(result.outputs[0]?.files.map((file) => file.path)).toEqual(["a.json", "b.json"]);
  });

  it("passes environments sorted by name, with their secrets", async () => {
    let received: unknown;
    const spy: Emitter = {
      ...emitter(),
      emit: async (input) => {
        received = input.environments;
        return [];
      },
    };
    const twoEnvironments: OpenChasquiConfig = {
      ...config,
      environments: { qa: { variables: {} }, dev: { variables: {}, secrets: ["TOKEN"] } },
    };

    await run(twoEnvironments, { reader, plugins: [loader(), spy] });

    expect(received).toEqual([
      { name: "dev", variables: {}, secrets: ["TOKEN"] },
      { name: "qa", variables: {}, secrets: [] },
    ]);
  });

  it("refuses an environment that looks like production", async () => {
    const production = { ...config, environments: { prod: { variables: {} } } };

    await expectError(
      run(production, { reader, plugins: [loader(), emitter()] }),
      "invalid-config",
    );
  });

  it("refuses a secret that has a value", async () => {
    const leaked = {
      ...config,
      environments: { qa: { variables: { TOKEN: "eyJ..." }, secrets: ["TOKEN"] } },
    };

    await expectError(run(leaked, { reader, plugins: [loader(), emitter()] }), "invalid-config");
  });

  it("fails when no loader understands the document", async () => {
    const swagger = { readText: async () => "swagger: '2.0'" };

    await expectError(
      run(config, { reader: swagger, plugins: [loader(), emitter()] }),
      "unsupported-document",
    );
  });

  it("fails when a target has no emitter", async () => {
    await expectError(
      run({ ...config, targets: ["bruno"] }, { reader, plugins: [loader()] }),
      "unknown-target",
    );
  });

  it("fails when a plugin speaks another plugin API version", async () => {
    const future = { ...loader(), apiVersion: 2 } as unknown as Loader;

    await expectError(run(config, { reader, plugins: [future, emitter()] }), "incompatible-plugin");
  });

  it("refuses an emitted path outside the target folder", async () => {
    const escaping = emitter([{ path: "../../etc/passwd", contents: "" }]);

    await expectError(run(config, { reader, plugins: [loader(), escaping] }), "unsafe-output-path");
  });
});
