import { readFile } from "node:fs/promises";
import { parseDocument } from "@abitech/openchasqui-core";
import { openApiLoader } from "@abitech/openchasqui-loader-openapi";
import { type ApiModel, DEFAULT_VARIABLES, type EmitInput } from "@abitech/openchasqui-spec";
import { beforeAll, describe, expect, it } from "vitest";
import { postmanEmitter } from "../src/index.js";

type Json = Record<string, any>;

const context = { reader: { readText: async () => "" }, options: {} };
let input: EmitInput;
let collection: Json;
let files: readonly { path: string; contents: string }[];

function find(items: Json[], name: string): Json {
  for (const item of items) {
    if (item.name === name) return item;
    if (item.item) {
      const found = find(item.item, name);
      if (found) return found;
    }
  }
  return undefined as unknown as Json;
}

beforeAll(async () => {
  const text = await readFile(new URL("../../../fixtures/petstore.yaml", import.meta.url), "utf8");
  const loaded: ApiModel = await openApiLoader.load(parseDocument(text), context);
  const model: ApiModel = {
    ...loaded,
    operations: loaded.operations.map((op) =>
      op.id === "listPets"
        ? {
            ...op,
            tests: [
              { kind: "status", expected: [200] },
              { kind: "contentType", mediaType: "application/json" },
              { kind: "responseTime", maxMilliseconds: 5000 },
              { kind: "jsonSchema", schema: { type: "array" } },
            ],
          }
        : op,
    ),
  };
  input = {
    model,
    variables: DEFAULT_VARIABLES,
    environments: [
      { name: "qa", variables: { baseUrl: "https://qa.example.com" }, secrets: ["token"] },
    ],
  };
  files = await postmanEmitter.emit(input, context);
  collection = JSON.parse(files[0]?.contents ?? "{}");
});

describe("postmanEmitter", () => {
  it("emits the collection and one environment per definition", () => {
    expect(files.map((file) => file.path)).toEqual([
      "petstore.postman_collection.json",
      "petstore-qa.postman_environment.json",
    ]);
  });

  it("matches the reference output for the fixture", async () => {
    await expect(files[0]?.contents).toMatchFileSnapshot(
      "__golden__/petstore.postman_collection.json",
    );
  });

  it("uses the most common scheme as the collection auth", () => {
    expect(collection.auth).toEqual({
      type: "bearer",
      bearer: [{ key: "token", value: "{{token}}", type: "string" }],
    });
  });

  it("turns off auth for public calls and inherits it otherwise", () => {
    expect(find(collection.item, "Opening hours").request.auth).toEqual({ type: "noauth" });
    expect(find(collection.item, "Delete a pet").request.auth).toBeUndefined();
  });

  it("keeps optional query parameters disabled and out of the URL", () => {
    const url = find(collection.item, "List pets").request.url;
    expect(url.raw).toBe("{{baseUrl}}/pets");
    expect(url.query).toEqual([
      { key: "limit", value: "20", disabled: true },
      { key: "species", value: "dog", disabled: true },
    ]);
  });

  it("writes path parameters as Postman variables with a value of their type", () => {
    const url = find(collection.item, "showPet").request.url;
    expect(url.path).toEqual(["pets", ":petId"]);
    expect(url.variable).toEqual([{ key: "petId", value: "1" }]);
  });

  it("fills required headers that have no example, so the request is valid", () => {
    const headers = find(collection.item, "showPet").request.header;
    expect(headers).toEqual([{ key: "X-Trace", value: "string", disabled: false }]);
  });

  it("sends the JSON example as the body and file fields as form data", () => {
    expect(JSON.parse(find(collection.item, "Create a pet").request.body.raw)).toEqual({
      name: "Fido",
      species: "dog",
    });
    expect(find(collection.item, "Upload a photo").request.body.formdata).toEqual([
      { key: "file", type: "file", src: [] },
    ]);
  });

  it("turns each test case into a Postman test", () => {
    const exec: string[] = find(collection.item, "List pets").event[0].script.exec;
    expect(exec.join("\n")).toContain("pm.expect(pm.response.code).to.be.oneOf([200]);");
    expect(exec.join("\n")).toContain("pm.response.to.have.jsonSchema(");
    expect(exec.join("\n")).toContain("to.be.below(5000)");
  });

  it("leaves secrets empty and marks them as secret", () => {
    expect(JSON.parse(files[1]?.contents ?? "{}").values).toEqual([
      { key: "baseUrl", value: "https://qa.example.com", type: "default", enabled: true },
      { key: "token", value: "", type: "secret", enabled: true },
    ]);
  });

  it("produces the same bytes on every run", async () => {
    const again = await postmanEmitter.emit(input, context);
    expect(again).toEqual(files);
  });
});
