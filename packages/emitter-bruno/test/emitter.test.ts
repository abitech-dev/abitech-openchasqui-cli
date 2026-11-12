import { readFile } from "node:fs/promises";
import { parseDocument } from "@abitech/openchasqui-core";
import { examplesGenerator } from "@abitech/openchasqui-generator-examples";
import { testsGenerator } from "@abitech/openchasqui-generator-tests";
import { openApiLoader } from "@abitech/openchasqui-loader-openapi";
import { DEFAULT_VARIABLES, type EmitInput, type EmittedFile } from "@abitech/openchasqui-spec";
import { beforeAll, describe, expect, it } from "vitest";
import { parse } from "yaml";
import { brunoEmitter } from "../src/index.js";

const context = { reader: { readText: async () => "" }, options: {} };
let input: EmitInput;
let files: readonly EmittedFile[];

function file(path: string): any {
  const found = files.find((candidate) => candidate.path === path);
  if (!found) {
    throw new Error(`${path} was not emitted`);
  }
  return parse(found.contents);
}

beforeAll(async () => {
  const text = await readFile(new URL("../../../fixtures/petstore.yaml", import.meta.url), "utf8");
  let model = await openApiLoader.load(parseDocument(text), context);
  model = await examplesGenerator.generate(model, context);
  model = await testsGenerator.generate(model, context);
  input = {
    model,
    variables: DEFAULT_VARIABLES,
    environments: [
      { name: "qa", variables: { baseUrl: "https://qa.example.com" }, secrets: ["token"] },
    ],
  };
  files = await brunoEmitter.emit(input, context);
});

describe("brunoEmitter", () => {
  it("emits the OpenCollection root, environments, folders and one file per request", () => {
    expect(files.map((f) => f.path).sort()).toEqual([
      "environments/qa.yml",
      "health/GET -health.yml",
      "health/folder.yml",
      "opencollection.yml",
      "pets/Create a pet.yml",
      "pets/Delete a pet.yml",
      "pets/List pets.yml",
      "pets/Upload a photo.yml",
      "pets/folder.yml",
      "pets/showPet.yml",
      "store/Opening hours.yml",
      "store/folder.yml",
    ]);
  });

  it("matches the reference output for the fixture", async () => {
    for (const path of ["opencollection.yml", "pets/List pets.yml", "pets/showPet.yml"]) {
      const contents = files.find((f) => f.path === path)?.contents;
      await expect(contents).toMatchFileSnapshot(`__golden__/${path.replace("/", "--")}`);
    }
  });

  it("declares the most used scheme at the root and turns it off for public calls", () => {
    expect(file("opencollection.yml").request.auth).toEqual({ type: "bearer", token: "{{token}}" });
    expect(file("store/Opening hours.yml").http).not.toHaveProperty("auth");
    expect(file("pets/List pets.yml").http.auth).toBe("inherit");
  });

  it("writes parameters with typed values and optional query parameters disabled", () => {
    expect(file("pets/showPet.yml").http.params).toEqual([
      { name: "petId", value: "1", type: "path" },
    ]);
    expect(file("pets/showPet.yml").http.headers).toEqual([{ name: "X-Trace", value: "string" }]);
    expect(file("pets/List pets.yml").http.params).toEqual([
      { name: "limit", value: "20", type: "query", disabled: true },
      { name: "species", value: "dog", type: "query", disabled: true },
    ]);
  });

  it("turns the generated tests into one Bruno test script", () => {
    const code: string = file("pets/List pets.yml").runtime.scripts[0].code;
    expect(file("pets/List pets.yml").runtime.scripts[0].type).toBe("tests");
    expect(code).toContain("expect(res.getStatus()).to.be.oneOf([200]);");
    expect(code).toContain('const Ajv = require("ajv");');
    expect(code).toContain("expect(res.getResponseTime()).to.be.below(5000);");
  });

  it("marks secrets as secret without a value", () => {
    expect(file("environments/qa.yml")).toEqual({
      name: "qa",
      variables: [
        { name: "baseUrl", value: "https://qa.example.com" },
        { name: "token", secret: true },
      ],
    });
  });

  it("produces the same bytes on every run", async () => {
    expect(await brunoEmitter.emit(input, context)).toEqual(files);
  });
});
